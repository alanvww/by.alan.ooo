// src/hooks/useXMBNavigation.ts
import { useEffect, useCallback, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import type { XMBCategory, XMBItem } from '@/lib/xmb-types';
import { useRouter } from 'next/navigation';
import { useXMBDerivedContext, useXMBLoadingContext, useXMBSelectionContext } from '@/lib/xmb-navigation-context';
import { playConfirm, playCancel, playNavigate, playDeny } from '@/hooks/useKeyAudioFx';
import { activateItem, isActivatable } from '@/lib/xmb-navigation';
import { XMB_KEY_REPEAT } from '@/lib/xmb-constants';

// Holding an arrow key auto-repeats at the OS rate (~30ms), which queues
// moves — category switches with their list entrances, row moves with their
// 300ms tweens — faster than they can render. Repeat events are throttled
// (XMB_KEY_REPEAT) so hold-to-scroll still works but the animation pipeline
// never backs up; the first press of a key is always instant. Up/Down were
// once left unthrottled as "cheap": they are not — at the OS rate the cursor
// tween settles rows behind the highlight ring and the list swoops on release.

/**
 * The lowest itemIndex the selection may move to. The first item is the
 * floor inside folders, and also at the root of the paged layout while the
 * list is showing — deselecting to -1 there would pop the stage back to
 * categories, so exiting stays on the BACK and header controls. At the
 * full layout's root, moving past item 0 deselects to the category row.
 * Shared by moveUp and the wheel hook so both inputs agree about whether
 * the top of the list deselects.
 */
export function itemFloor(layoutMode: 'full' | 'paged', inFolder: boolean, itemIndex: number): number {
  const inPagedList = layoutMode === 'paged' && itemIndex >= 0;
  return inFolder || inPagedList ? 0 : -1;
}

/** Ends an open wheel gesture (see useXMBNavigation's wheelAbortRef). */
function endWheelGesture(ref: RefObject<(() => void) | null> | undefined): void {
  ref?.current?.();
}

/**
 * True when the keydown's target natively activates on Enter/Space (links,
 * buttons, form fields). The dispatcher must stand down there: the browser
 * synthesizes a click on the focused element, and that click path is the
 * single activation — dispatching confirm() too would run two activations
 * from one keypress (e.g. the same external link opening in two tabs). The
 * dispatcher owns Enter/Space only when focus rests on <body> or a
 * non-interactive element (the arrows-only console mode).
 */
function isNativeActivationTarget(e: KeyboardEvent): boolean {
  const target = e.target;
  if (!(target instanceof Element) || target === document.body) {
    return false;
  }
  return target.closest('a[href], button, input, textarea, select, summary, [contenteditable="true"]') !== null;
}

/**
 * The six XMB navigation primitives, shared verbatim between the keyboard
 * dispatcher and the touch controls (command bar buttons, swipes, pans).
 * Each command owns its own sound, so keyboard/touch parity — state
 * transitions, clamping, wrap-around, AND audio — holds by construction.
 */
export interface XMBCommands {
  /** ArrowLeft: prev category (wraps, recalls that column's cursor) at root; exit folder when inside one. */
  moveLeft: () => void;
  /** ArrowRight: next category (wraps, recalls that column's cursor) at root; activate (links only) inside a folder. */
  moveRight: () => void;
  /** ArrowUp: selection up one row; floors at the first item inside a folder or in the paged list, at -1 (deselected) at the full layout's root. */
  moveUp: () => void;
  /** ArrowDown: selection down one row; clamps at the last item. */
  moveDown: () => void;
  /** Enter: activate the selected item (incl. folder drill), or select item 0. */
  confirm: () => void;
  /** Escape/Backspace: exit one folder level, else deselect to the category row. */
  back: () => void;
  /** Paged header title / back pill at the paged root: clear the folder path and deselect in one step. */
  resetToRoot: () => void;
}

interface XMBNavigationResult {
  categoryIndex: number;
  itemIndex: number;
  navigationPath: number[];
  activeCategory: XMBCategory | null;
  activeItem: XMBItem | null;
  currentItems: XMBItem[];
  isNavigating: boolean;
  commands: XMBCommands;
  startNavigation: (href?: string) => void;
  finishNavigation: () => void;
  setCategoryIndex: (index: number) => void;
  setItemIndex: (index: number) => void;
  setNavigationPath: (path: number[]) => void;
  recallItemIndex: (categoryIndex: number) => number;
}

export function useXMBNavigation(
  categories: XMBCategory[],
  layoutMode: 'full' | 'paged' = 'full',
  /** Restricted item activated (Enter/ArrowRight): shake + toast owner. */
  onRestricted?: (item: XMBItem, index: number) => void,
  /** The row the wheel hook is visibly on or has just committed, until
      React has rendered it (null at rest) — see useWheelCursor. The
      vertical commands step from it, and Enter activates it, so a key
      during a trackpad coast acts on the highlighted row, and a key in the
      gap between the hook's commit and React's render steps from the
      committed row rather than the stale one. */
  liveIndexRef?: RefObject<number | null>,
  /** Ends an open wheel gesture. Every command calls it first: a key
      whose target is the committed row changes no state, so nothing else
      would stop the coast from settling over the keypress. */
  wheelAbortRef?: RefObject<(() => void) | null>,
): XMBNavigationResult {
  const {
    categoryIndex,
    setCategoryIndex,
    itemIndex,
    setItemIndex,
    navigationPath,
    setNavigationPath,
    recallItemIndex,
    rememberItemIndex,
  } = useXMBSelectionContext();
  const {
    activeCategory,
    activeItem,
    currentItems,
  } = useXMBDerivedContext();
  const {
    isNavigating,
    startNavigation,
    finishNavigation
  } = useXMBLoadingContext();

  const router = useRouter();

  // Per-column cursor memory. Mirrored continuously while browsing a
  // category's ROOT list, so the outgoing category's latest cursor is
  // already recorded by the time a switch commits — the switch itself never
  // has to capture pre-switch state. Folder levels are excluded: itemIndex
  // means an in-folder position there, and the root index that leads to the
  // folder was mirrored before drilling in.
  //
  // -1 is mirrored only in the full layout, where it is an explicit deselect
  // (Escape at root) and a column the user backed out of should be recalled
  // deselected rather than re-highlighted. In the paged layout -1 is just
  // the 'categories' stage: every category switch parks there (moveLeft/
  // moveRight) and lands in the same commit as setCategoryIndex, so
  // mirroring it would overwrite the DESTINATION column's cursor with -1 on
  // every swipe. Re-entering a paged list always floors the recall at 0
  // anyway, so skipping -1 there loses nothing.
  useEffect(() => {
    if (navigationPath.length > 0) return;
    if (itemIndex === -1 && layoutMode === 'paged') return;
    rememberItemIndex(categoryIndex, itemIndex);
  }, [categoryIndex, itemIndex, navigationPath, layoutMode, rememberItemIndex]);

  // Use refs to prevent handler recreation
  const categoriesRef = useRef(categories);
  const categoryIndexRef = useRef(categoryIndex);
  const itemIndexRef = useRef(itemIndex);
  const navigationPathRef = useRef(navigationPath);
  const activeCategoryRef = useRef(activeCategory);
  const activeItemRef = useRef(activeItem);
  const currentItemsRef = useRef(currentItems);
  const routerRef = useRef(router);
  const startNavigationRef = useRef(startNavigation);
  const layoutModeRef = useRef(layoutMode);
  const onRestrictedRef = useRef(onRestricted);
  const recallItemIndexRef = useRef(recallItemIndex);
  const isNavigatingRef = useRef(isNavigating);
  const liveIndexParamRef = useRef(liveIndexRef);
  const wheelAbortParamRef = useRef(wheelAbortRef);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
    liveIndexParamRef.current = liveIndexRef;
    wheelAbortParamRef.current = wheelAbortRef;
  }, [isNavigating, liveIndexRef, wheelAbortRef]);

  // Where a category switch lands. Full layout: the destination column's
  // remembered cursor (-1 if never entered). Paged layout: a switch made
  // from the categories stage stays there (-1); a switch made while
  // BROWSING a list stays in the list, on the destination's remembered row
  // floored at 0 (an itemIndex ≥ 0 is what derives the 'list' stage) —
  // the XMB's defining sideways slide. It used to park at -1 either way,
  // so comparing two columns cost swipe, tap the icon, read, swipe, tap.
  // The setters land in one batched commit, so the per-column mirror
  // records the destination's row, not the outgoing one.
  const landingIndex = useCallback((next: number): number => {
    const recalled = recallItemIndexRef.current(next);
    if (layoutModeRef.current !== 'paged') return recalled;
    return itemIndexRef.current >= 0 ? Math.max(recalled, 0) : -1;
  }, []);

  // The vertical commands step from — and Enter acts on — the wheel's
  // visible row while a coast is open (liveIndexRef), else the committed
  // index. Each reads that base FIRST and then ends the gesture: the abort
  // nulls the live index. Refs only, so the commands keep their identities.

  useEffect(() => {
    categoriesRef.current = categories;
    categoryIndexRef.current = categoryIndex;
    itemIndexRef.current = itemIndex;
    navigationPathRef.current = navigationPath;
    activeCategoryRef.current = activeCategory;
    activeItemRef.current = activeItem;
    currentItemsRef.current = currentItems;
    routerRef.current = router;
    startNavigationRef.current = startNavigation;
    layoutModeRef.current = layoutMode;
    onRestrictedRef.current = onRestricted;
    recallItemIndexRef.current = recallItemIndex;
  }, [categories, categoryIndex, itemIndex, navigationPath, activeCategory, activeItem, currentItems, router, startNavigation, layoutMode, onRestricted, recallItemIndex]);

  const moveLeft = useCallback(() => {
    endWheelGesture(wheelAbortParamRef.current);
    if (navigationPathRef.current.length > 0) {
      // Inside folder: exit one level, restoring the cursor to the folder
      // row we came from. A cancel cue, like Escape — every path out of a
      // folder sounds the same.
      playCancel();
      const parentFolderIndex = navigationPathRef.current[navigationPathRef.current.length - 1];
      setNavigationPath(navigationPathRef.current.slice(0, -1));
      setItemIndex(parentFolderIndex);
    } else {
      // Category level or item selected: switch to previous category and
      // recall that column's own cursor (XMB per-column memory).
      playNavigate();
      const next = categoryIndexRef.current > 0 ? categoryIndexRef.current - 1 : categoriesRef.current.length - 1;
      setCategoryIndex(next);
      setItemIndex(landingIndex(next));
      setNavigationPath([]);
    }
  }, [landingIndex, setCategoryIndex, setItemIndex, setNavigationPath]);

  const moveRight = useCallback(() => {
    // Same base as confirm(): the wheel's visible row while a coast is
    // open, read BEFORE the abort nulls it.
    const base = liveIndexParamRef.current?.current ?? itemIndexRef.current;
    endWheelGesture(wheelAbortParamRef.current);
    if (navigationPathRef.current.length > 0) {
      // Inside folder: open the selected item (link/action only, not folders).
      // `drillIntoFolder` is intentionally omitted so folders are no-ops
      // here — Enter is required to drill into nested folders. Restricted
      // items skip the navigate tick (the deny path owns its own sound).
      const item = base >= 0 ? currentItemsRef.current[base] ?? null : null;
      if (item && !isActivatable(item)) {
        playDeny();
        return;
      }
      if (!item?.restricted) {
        playNavigate();
      }
      if (item) {
        activateItem(item, base, {
          router: routerRef.current,
          startNavigation: startNavigationRef.current,
          onRestricted: onRestrictedRef.current,
        });
      }
    } else {
      playNavigate();
      // Category level or item selected: switch to next category and
      // recall that column's own cursor (XMB per-column memory).
      const next = categoryIndexRef.current < categoriesRef.current.length - 1 ? categoryIndexRef.current + 1 : 0;
      setCategoryIndex(next);
      setItemIndex(landingIndex(next));
      setNavigationPath([]);
    }
  }, [landingIndex, setCategoryIndex, setItemIndex, setNavigationPath]);

  const moveUp = useCallback(() => {
    const base = liveIndexParamRef.current?.current ?? itemIndexRef.current;
    endWheelGesture(wheelAbortParamRef.current);
    // Floor rule shared with the wheel hook — see itemFloor.
    const floor = itemFloor(layoutModeRef.current, navigationPathRef.current.length > 0, base);
    const next = Math.max(base - 1, floor);
    // Clamp before the tick: the "you moved" sound must not play at a list
    // boundary where nothing moves (useIndexPan.step already gets this right).
    if (next !== base) {
      playNavigate();
    }
    setItemIndex(next);
  }, [setItemIndex]);

  const moveDown = useCallback(() => {
    const base = liveIndexParamRef.current?.current ?? itemIndexRef.current;
    endWheelGesture(wheelAbortParamRef.current);
    const max = currentItemsRef.current.length - 1;
    const next = base < max ? base + 1 : base;
    // Same boundary rule as moveUp: no tick when the clamp holds position.
    if (next !== base) {
      playNavigate();
    }
    setItemIndex(next);
  }, [setItemIndex]);

  const confirm = useCallback(() => {
    const base = liveIndexParamRef.current?.current ?? itemIndexRef.current;
    endWheelGesture(wheelAbortParamRef.current);
    const item = base >= 0 ? currentItemsRef.current[base] ?? null : null;
    if (!item) {
      // Nothing selected: Enter enters the column (a commit, so it blooms)
      // — unless there is nothing to enter, which gets the deny cue rather
      // than a bloom followed by nothing.
      if (currentItemsRef.current.length > 0) {
        playConfirm();
        setItemIndex(0);
      } else {
        playDeny();
      }
      return;
    }
    // Dead rows (empty folder, link-less link) get the deny cue, not a
    // confirm bloom followed by nothing.
    if (!isActivatable(item)) {
      playDeny();
      return;
    }
    // Restricted items swap the confirm bloom for the deny path's own cue.
    if (!item.restricted) {
      playConfirm();
    }
    activateItem(item, base, {
      router: routerRef.current,
      startNavigation: startNavigationRef.current,
      drillIntoFolder: (idx) => {
        setNavigationPath([...navigationPathRef.current, idx]);
        setItemIndex(0);
      },
      onRestricted: onRestrictedRef.current,
    });
  }, [setItemIndex, setNavigationPath]);

  const back = useCallback(() => {
    endWheelGesture(wheelAbortParamRef.current);
    // The cue lives in the acting branches: Escape on the category row
    // changes nothing and must stay silent, like every other clamp.
    if (navigationPathRef.current.length > 0) {
      playCancel();
      const parentFolderIndex = navigationPathRef.current[navigationPathRef.current.length - 1];
      setNavigationPath(navigationPathRef.current.slice(0, -1));
      setItemIndex(parentFolderIndex);
    } else if (itemIndexRef.current !== -1) {
      playCancel();
      setItemIndex(-1);
    }
  }, [setItemIndex, setNavigationPath]);

  const resetToRoot = useCallback(() => {
    endWheelGesture(wheelAbortParamRef.current);
    // Clean root state IS the paged 'categories' stage: a stale folder
    // path would desync the command bar and kill root swipes.
    if (navigationPathRef.current.length === 0 && itemIndexRef.current === -1) return;
    playCancel();
    setNavigationPath([]);
    setItemIndex(-1);
  }, [setItemIndex, setNavigationPath]);

  const commands = useMemo<XMBCommands>(() => ({
    moveLeft,
    moveRight,
    moveUp,
    moveDown,
    confirm,
    back,
    resetToRoot,
  }), [back, confirm, moveDown, moveLeft, moveRight, moveUp, resetToRoot]);

  // Timestamps of the last accepted presses per axis, for repeat throttling.
  const lastHorizontalMoveRef = useRef(0);
  const lastVerticalMoveRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Modified keys are browser affordances (Cmd+← is Safari's back,
    // Alt+← is Windows', Cmd+Enter opens in a new tab) — never hijack
    // them. Cmd+← used to switch category, tick, AND write the per-column
    // memory while the browser navigated away, so the user came back to a
    // column they never chose. Shift stays out of this set: Shift+Tab
    // roving must survive. Same rule as XMBPostViewer's dispatcher.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Under the loading skeleton the menu is about to unmount: an Escape
    // there deselected to -1 and the focus restore on the way back bailed,
    // costing the user both focus and selection.
    if (isNavigatingRef.current) return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const now = performance.now();
        // First (non-repeat) press is always instant; only OS auto-repeat is
        // rate-limited.
        if (e.repeat && now - lastHorizontalMoveRef.current < XMB_KEY_REPEAT.HORIZONTAL_INTERVAL_MS) {
          return;
        }
        lastHorizontalMoveRef.current = now;
        if (e.key === 'ArrowLeft') {
          moveLeft();
        } else {
          moveRight();
        }
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        const now = performance.now();
        if (e.repeat && now - lastVerticalMoveRef.current < XMB_KEY_REPEAT.VERTICAL_INTERVAL_MS) {
          return;
        }
        lastVerticalMoveRef.current = now;
        if (e.key === 'ArrowUp') {
          moveUp();
        } else {
          moveDown();
        }
        break;
      }
      case 'Enter':
      case ' ':
        if (isNativeActivationTarget(e)) {
          return;
        }
        // Consume the key outright: confirm() moves the selection, the focus
        // sync moves DOM focus with it, and without preventDefault the same
        // keypress's default action would synthesize a click on the NEWLY
        // focused control — one Enter selecting item 0 and drilling into it.
        e.preventDefault();
        confirm();
        break;
      case 'Escape':
      case 'Backspace':
        // Backspace in an editable field is typing, not navigation — skip
        // the command entirely (no sound, no action), same as before the
        // command extraction.
        if (e.key === 'Backspace' && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
          return;
        }
        back();
        break;
    }
  }, [back, confirm, moveDown, moveLeft, moveRight, moveUp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    categoryIndex,
    itemIndex,
    navigationPath,
    activeCategory,
    activeItem,
    currentItems,
    isNavigating,
    commands,
    startNavigation,
    finishNavigation,
    setCategoryIndex,
    setItemIndex,
    setNavigationPath,
    recallItemIndex,
  };
}
