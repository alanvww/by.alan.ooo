// src/hooks/useXMBNavigation.ts
import { useEffect, useCallback, useMemo, useRef } from 'react';
import type { XMBCategory, XMBItem } from '@/lib/xmb-types';
import { useRouter } from 'next/navigation';
import { useXMBDerivedContext, useXMBLoadingContext, useXMBSelectionContext } from '@/lib/xmb-navigation-context';
import { useKeyAudioFx, playConfirm, playCancel, playNavigate } from '@/hooks/useKeyAudioFx';
import { activateItem } from '@/lib/xmb-navigation';

// Holding ArrowLeft/Right auto-repeats at the OS rate (~30ms), which queues
// category switches (and their exit animations) faster than they can render.
// Repeat events are throttled to one switch per this interval so hold-to-scroll
// still works but the animation pipeline never backs up. Up/Down row moves are
// cheap and stay unthrottled.
const HORIZONTAL_REPEAT_INTERVAL_MS = 150;

/**
 * The six XMB navigation primitives, shared verbatim between the keyboard
 * dispatcher and the touch controls (command bar buttons, swipes, pans).
 * Each command owns its own sound, so keyboard/touch parity — state
 * transitions, clamping, wrap-around, AND audio — holds by construction.
 */
export interface XMBCommands {
  /** ArrowLeft: prev category (wraps) at root; exit folder when inside one. */
  moveLeft: () => void;
  /** ArrowRight: next category (wraps) at root; activate (links only) inside a folder. */
  moveRight: () => void;
  /** ArrowUp: selection up one row; floors at the first item inside a folder or in the paged list, at -1 (deselected) at the full layout's root. */
  moveUp: () => void;
  /** ArrowDown: selection down one row; clamps at the last item. */
  moveDown: () => void;
  /** Enter: activate the selected item (incl. folder drill), or select item 0. */
  confirm: () => void;
  /** Escape/Backspace: exit one folder level, else deselect to the category row. */
  back: () => void;
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
  startNavigation: () => void;
  finishNavigation: () => void;
  setCategoryIndex: (index: number) => void;
  setItemIndex: (index: number) => void;
  setNavigationPath: (path: number[]) => void;
}

export function useXMBNavigation(categories: XMBCategory[], layoutMode: 'full' | 'paged' = 'full'): XMBNavigationResult {
  const {
    categoryIndex,
    setCategoryIndex,
    itemIndex,
    setItemIndex,
    navigationPath,
    setNavigationPath,
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

  // Ensure the shared audio context is initialised; sound functions are module-level singletons
  useKeyAudioFx();
  const router = useRouter();

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
  }, [categories, categoryIndex, itemIndex, navigationPath, activeCategory, activeItem, currentItems, router, startNavigation, layoutMode]);

  const moveLeft = useCallback(() => {
    playNavigate();
    if (navigationPathRef.current.length > 0) {
      // Inside folder: exit folder, restore cursor to the folder item we came from
      const parentFolderIndex = navigationPathRef.current[navigationPathRef.current.length - 1];
      setNavigationPath(navigationPathRef.current.slice(0, -1));
      setItemIndex(parentFolderIndex);
    } else {
      // Category level or item selected: switch to previous category
      setCategoryIndex((categoryIndexRef.current > 0 ? categoryIndexRef.current - 1 : categoriesRef.current.length - 1));
      setItemIndex(-1);
      setNavigationPath([]);
    }
  }, [setCategoryIndex, setItemIndex, setNavigationPath]);

  const moveRight = useCallback(() => {
    playNavigate();
    if (navigationPathRef.current.length > 0) {
      // Inside folder: open the selected item (link/action only, not folders).
      // `drillIntoFolder` is intentionally omitted so folders are no-ops
      // here — Enter is required to drill into nested folders.
      if (activeItemRef.current) {
        activateItem(activeItemRef.current, itemIndexRef.current, {
          router: routerRef.current,
          startNavigation: startNavigationRef.current,
        });
      }
    } else {
      // Category level or item selected: switch to next category
      setCategoryIndex((categoryIndexRef.current < categoriesRef.current.length - 1 ? categoryIndexRef.current + 1 : 0));
      setItemIndex(-1);
      setNavigationPath([]);
    }
  }, [setCategoryIndex, setItemIndex, setNavigationPath]);

  const moveUp = useCallback(() => {
    playNavigate();
    // The first item is the floor inside folders, and also at the root of
    // the paged layout while the list is showing — deselecting to -1 there
    // would pop the stage back to categories, so exiting stays on the BACK
    // and header controls. At the full layout's root, moving past item 0
    // deselects to the category row (-1).
    const inPagedList = layoutModeRef.current === 'paged' && itemIndexRef.current >= 0;
    const floor = navigationPathRef.current.length > 0 || inPagedList ? 0 : -1;
    setItemIndex(Math.max(itemIndexRef.current - 1, floor));
  }, [setItemIndex]);

  const moveDown = useCallback(() => {
    playNavigate();
    setItemIndex((() => {
      const max = currentItemsRef.current.length - 1;
      return itemIndexRef.current < max ? itemIndexRef.current + 1 : itemIndexRef.current;
    })());
  }, [setItemIndex]);

  const confirm = useCallback(() => {
    playConfirm();
    if (activeItemRef.current) {
      activateItem(activeItemRef.current, itemIndexRef.current, {
        router: routerRef.current,
        startNavigation: startNavigationRef.current,
        drillIntoFolder: (idx) => {
          setNavigationPath([...navigationPathRef.current, idx]);
          setItemIndex(0);
        },
      });
    } else if (currentItemsRef.current.length > 0) {
      setItemIndex(0);
    }
  }, [setItemIndex, setNavigationPath]);

  const back = useCallback(() => {
    playCancel();
    if (navigationPathRef.current.length > 0) {
      const parentFolderIndex = navigationPathRef.current[navigationPathRef.current.length - 1];
      setNavigationPath(navigationPathRef.current.slice(0, -1));
      setItemIndex(parentFolderIndex);
    } else if (itemIndexRef.current !== -1) {
      setItemIndex(-1);
    }
  }, [setItemIndex, setNavigationPath]);

  const commands = useMemo<XMBCommands>(() => ({
    moveLeft,
    moveRight,
    moveUp,
    moveDown,
    confirm,
    back,
  }), [back, confirm, moveDown, moveLeft, moveRight, moveUp]);

  // Timestamp of the last accepted Left/Right press, for repeat throttling.
  const lastHorizontalMoveRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const now = performance.now();
        // First (non-repeat) press is always instant; only OS auto-repeat is
        // rate-limited.
        if (e.repeat && now - lastHorizontalMoveRef.current < HORIZONTAL_REPEAT_INTERVAL_MS) {
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
        moveUp();
        break;
      case 'ArrowDown':
        moveDown();
        break;
      case 'Enter':
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
  };
}
