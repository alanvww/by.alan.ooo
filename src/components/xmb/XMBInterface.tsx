// src/components/xmb/XMBInterface.tsx
'use client';

import React, { useMemo, useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { XMBCategory, XMBItem } from '@/lib/xmb-types';
import { useXMBNavigation } from '@/hooks/useXMBNavigation';
import { useIndexPan } from '@/hooks/useIndexPan';
import { playConfirm, playNavigate, playCancel, playDeny } from '@/hooks/useKeyAudioFx';
import { focusSilently } from '@/lib/focus';
import { EASE, XMB_GESTURE } from '@/lib/xmb-constants';
import XMBCategoryRow from './XMBCategoryRow';
import XMBVerticalList from './XMBVerticalList';
import XMBCarousel from './XMBCarousel';
import XMBPreview from './XMBPreview';
import XMBHeader from './XMBHeader';
import XMBCommandBar from './XMBCommandBar';
import XMBRestrictedToast, { type RestrictedPing } from './XMBRestrictedToast';

interface XMBInterfaceProps {
  categories: XMBCategory[];
}

const XMBInterface = ({ categories }: XMBInterfaceProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<'full' | 'paged'>('full');

  // Restricted-item deny: every activation attempt bumps the nonce so the
  // matching row/card re-shakes and the toast timer resets. The handler owns
  // the deny sound — the shared confirm paths skip their bloom for
  // restricted items.
  const [restrictedPing, setRestrictedPing] = useState<RestrictedPing | null>(null);
  const handleRestricted = useCallback((item: XMBItem) => {
    playDeny();
    setRestrictedPing((prev) => ({ id: item.id, nonce: (prev?.nonce ?? 0) + 1 }));
  }, []);

  const {
    categoryIndex,
    itemIndex,
    navigationPath,
    activeCategory,
    activeItem,
    currentItems,
    commands,
    setCategoryIndex,
    setItemIndex,
    setNavigationPath,
    recallItemIndex,
    finishNavigation
  } = useXMBNavigation(categories, layoutMode, handleRestricted);

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      const width = entry?.contentRect.width ?? window.innerWidth;
      setLayoutMode(width < 1024 ? 'paged' : 'full');
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // The paged stage is fully derived from navigation state: a selection or an
  // open folder means the list is showing, otherwise the category row is.
  // Deriving during render (instead of mirroring into state via trailing
  // effects) removes a throwaway frame on category swipes where the NEW
  // category's full list mounted, painted once, and was discarded when the
  // effect flipped the stage back — the primary mobile switch lag.
  const pagedStage: 'categories' | 'list' =
    itemIndex >= 0 || navigationPath.length > 0 ? 'list' : 'categories';

  const handleFolderDrill = useCallback((idx: number) => {
    setNavigationPath([...navigationPath, idx]);
    setItemIndex(0);
  }, [navigationPath, setItemIndex, setNavigationPath]);

  // Mouse/touch equivalent of Escape inside a folder: exit one level and
  // restore the cursor to the folder row we drilled in from.
  const handleFolderBack = useCallback(() => {
    if (navigationPath.length === 0) return;
    const parentFolderIndex = navigationPath[navigationPath.length - 1];
    setNavigationPath(navigationPath.slice(0, -1));
    setItemIndex(parentFolderIndex);
  }, [navigationPath, setItemIndex, setNavigationPath]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartX.current = touch?.clientX ?? null;
    touchStartY.current = touch?.clientY ?? null;
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    const endX = event.changedTouches[0]?.clientX;
    const endY = event.changedTouches[0]?.clientY;

    if (startX === null || startY === null || endX === undefined || endY === undefined) {
      return;
    }

    const dx = endX - startX;
    const dy = endY - startY;

    // Horizontal swipes only — direction-locked so vertical list pans never
    // read as category switches.
    if (
      Math.abs(dx) < XMB_GESTURE.SWIPE_THRESHOLD_PX ||
      Math.abs(dx) <= XMB_GESTURE.DIRECTION_LOCK_RATIO * Math.abs(dy)
    ) {
      return;
    }

    if (navigationPath.length > 0) {
      // Inside a folder: swipe right steps back one level. Swipes starting
      // at the left screen edge are ignored so this never races the
      // browser's own edge-back gesture.
      if (dx > 0 && startX >= XMB_GESTURE.EDGE_GUARD_PX) {
        playCancel();
        handleFolderBack();
      }
      return;
    }

    // Root level (with or without a selected item, like ArrowLeft/Right):
    // swipe left = next category, swipe right = previous. The shared
    // commands own the wrap-around, state resets, and tick sound.
    if (dx < 0) {
      commands.moveRight();
    } else {
      commands.moveLeft();
    }
  }, [commands, handleFolderBack, navigationPath]);

  // Check if we're inside a folder (drilled down)
  const isInsideFolder = navigationPath.length > 0;
  const showCarousel = isInsideFolder && currentItems.length > 0;

  // ——— DOM focus mirrors the index-state cursor (roving tabindex) ———
  // focusWithinRef tracks whether focus is inside the menu: mouse/touch users
  // who never focused it must never have focus yanked by selection changes.
  const focusWithinRef = useRef(false);
  // True for the microtask window around a pointer press: Chrome focuses
  // links/buttons on mousedown, and that focus event must not drive selection
  // (the two-click model owns pointer selection via onClick).
  const pointerDownRef = useRef(false);

  const isPointerEvent = useCallback(() => pointerDownRef.current, []);

  const handlePointerDownCapture = useCallback(() => {
    pointerDownRef.current = true;
    window.setTimeout(() => {
      pointerDownRef.current = false;
    }, 0);
  }, []);

  const handleFocusCapture = useCallback(() => {
    focusWithinRef.current = true;
  }, []);

  const handleBlurCapture = useCallback((event: React.FocusEvent) => {
    // relatedTarget null means focus fell to body (an AnimatePresence unmount
    // or a window blur) — keep the flag armed so the sync effect below can
    // reclaim focus for the current selection.
    const next = event.relatedTarget;
    if (next instanceof Node && !containerRef.current?.contains(next)) {
      focusWithinRef.current = false;
    }
  }, []);

  // Index → focus: whenever the cursor moves while the menu owns focus, move
  // DOM focus to the element the cursor points at. preventScroll is mandatory
  // everywhere — rows/tabs/cards live inside transform-animated columns in
  // overflow-hidden containers, and native scroll-on-focus would desync the
  // measured centering.
  useEffect(() => {
    if (!focusWithinRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const current = document.activeElement;
    // Focus parked outside the menu (browser UI, another widget) is not ours
    // to steal; body means an unmount dropped it and we reclaim.
    if (current !== document.body && !container.contains(current)) return;
    const target =
      itemIndex === -1
        ? document.getElementById(`xmb-category-${categoryIndex}`)
        : showCarousel && layoutMode === 'full'
          ? document.getElementById(`carousel-item-${itemIndex}`)
          : document.getElementById(`xmb-item-${itemIndex}`);
    if (target && target !== current) {
      // App-driven cursor move — the selection styling is the indicator, so
      // the focus ring stays silent; it paints only for real Tab traversal.
      // Cleanup is deliberately NOT returned: the `target !== current` guard
      // skips StrictMode's replay, so an unmark here would strand a focused,
      // unmarked element (ring flash in dev). The once-blur listener owns
      // clearing the mark.
      focusSilently(target);
    }
    // navigationPath is a deliberate extra dep: folder drills can swap the
    // row set without changing itemIndex, and the re-run reclaims focus
    // after those unmounts drop it to body.
  }, [categoryIndex, itemIndex, navigationPath, showCarousel, layoutMode]);

  // Focus restore on return from the post overlay (WCAG 2.4.3): Escape in
  // XMBPostFrame pushes '/', this remounts, and the provider (root layout)
  // still holds the selection — put focus back on the exact row/card. Fresh
  // loads arrive with itemIndex === -1 and no-op. The restore is silent:
  // the selection styling already marks the position, so no focus ring.
  useEffect(() => {
    if (itemIndex < 0) return;
    const target =
      showCarousel && layoutMode === 'full'
        ? document.getElementById(`carousel-item-${itemIndex}`)
        : document.getElementById(`xmb-item-${itemIndex}`);
    if (!target) return;
    const current = document.activeElement;
    // `current === target` re-arms the silent-focus mark on StrictMode's
    // dev replay (the first pass already focused the target and its
    // cleanup unmarked it).
    if (current !== document.body && current !== target) return;
    return focusSilently(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only focus restore; later cursor moves are owned by the index→focus sync above
  }, []);

  // Calculate parent context for vertical list when inside a folder
  const { parentItems, parentIndex } = useMemo(() => {
    if (!isInsideFolder || !activeCategory) {
      return { parentItems: currentItems, parentIndex: itemIndex };
    }

    // Navigate to the parent level
    let parentItems: XMBItem[] = activeCategory.items;
    for (let i = 0; i < navigationPath.length - 1; i++) {
      const nextItems = parentItems[navigationPath[i]]?.items;
      if (nextItems) {
        parentItems = nextItems;
      }
    }

    // The parent index is the last item in the navigation path (the folder we're in)
    const parentIndex = navigationPath[navigationPath.length - 1];

    return { parentItems, parentIndex };
  }, [isInsideFolder, currentItems, itemIndex, activeCategory, navigationPath]);

  // Screen-reader announcements for index-state transitions (4.1.3), spoken
  // ONLY while DOM focus is outside the menu (arrows-on-body console mode).
  // Once focus roves with the selection, the focused row/tab/card announces
  // itself — speaking here too would read everything twice.
  const [announcement, setAnnouncement] = useState('');
  const prevAnnouncedRef = useRef<{ categoryIndex: number; itemIndex: number; pathLength: number } | null>(null);

  useEffect(() => {
    const prev = prevAnnouncedRef.current;
    prevAnnouncedRef.current = { categoryIndex, itemIndex, pathLength: navigationPath.length };
    if (!prev || !activeCategory || focusWithinRef.current) return;

    let next = '';
    if (navigationPath.length > prev.pathLength) {
      const folderTitle = parentItems[parentIndex]?.title ?? activeCategory.title;
      next = `Entered folder ${folderTitle}, ${currentItems.length} items`;
    } else if (navigationPath.length < prev.pathLength) {
      next = 'Exited folder';
    } else if (categoryIndex !== prev.categoryIndex || (itemIndex === -1 && prev.itemIndex !== -1)) {
      next = `Category: ${activeCategory.title}, ${currentItems.length} items`;
    } else if (itemIndex !== prev.itemIndex && activeItem) {
      next = `${activeItem.title}, ${itemIndex + 1} of ${currentItems.length}`;
    }
    if (next) {
      setAnnouncement(next);
    }
  }, [categoryIndex, itemIndex, navigationPath, activeCategory, activeItem, currentItems, parentItems, parentIndex]);

  // No paged-specific Escape handler: with the derived stage, the shared
  // `back` command (window keydown in useXMBNavigation) already lands on the
  // right stage — at the root it deselects (itemIndex -1 → 'categories'), and
  // inside a folder it pops ONE level with the cursor on the folder row
  // (itemIndex >= 0 → stays 'list'). A second Escape listener would fight it
  // and jump folders straight back to the category row.

  // handleCategorySelect reads categoryIndex/layoutMode through refs (same
  // pattern as handleRowFocus in XMBVerticalList) so it keeps ONE identity
  // for the life of the menu — closing over them minted a new handler on
  // every category switch, busting every memoized XMBCategoryCell on
  // exactly the event the memo exists for.
  const categoryIndexRef = useRef(categoryIndex);
  const layoutModeRef = useRef(layoutMode);
  const recallItemIndexRef = useRef(recallItemIndex);
  useLayoutEffect(() => {
    categoryIndexRef.current = categoryIndex;
    layoutModeRef.current = layoutMode;
    recallItemIndexRef.current = recallItemIndex;
  });

  const handleCategorySelect = useCallback((idx: number) => {
    if (layoutModeRef.current === 'paged' && idx === categoryIndexRef.current) {
      // Tapping the already-active category ENTERS its list. (It used to
      // reset to the categories stage, which made the initially-active
      // column impossible to open by touch.) Enter at the column's
      // remembered cursor; the floor of 0 is what derives the 'list' stage.
      playConfirm();
      setNavigationPath([]);
      setItemIndex(Math.max(recallItemIndexRef.current(idx), 0));
      return;
    }

    playNavigate();
    setCategoryIndex(idx);
    // Keyboard category switches reset the folder path — clicks must too,
    // or a stale path gets replayed inside the newly selected category.
    setNavigationPath([]);
    // XMB per-column memory: land on the column's remembered cursor. In
    // paged mode an item must be selected for the 'list' stage to derive,
    // so the recall floors at item 0 there.
    setItemIndex(layoutModeRef.current === 'paged'
      ? Math.max(recallItemIndexRef.current(idx), 0)
      : recallItemIndexRef.current(idx));
  }, [setCategoryIndex, setItemIndex, setNavigationPath]);

  // Drag-with-snap on the paged list: vertical pan travel commits discrete
  // index steps (clamped at 0 — deselect-to-categories stays on the visible
  // BACK controls so a flick can't pop the stage under the user's finger).
  const listPanHandlers = useIndexPan({
    getIndex: () => Math.max(itemIndex, 0),
    getMin: () => 0,
    getMax: () => Math.max(currentItems.length - 1, 0),
    onCommit: setItemIndex,
  });

  // Early return after all hooks have been called
  if (categories.length === 0 || !activeCategory) return null;

  const showFullLayout = layoutMode === 'full';

  return (
    <div
      ref={containerRef}
      role="navigation"
      aria-label="Site menu"
      className="fixed inset-0 text-xmb-fg overflow-hidden font-sans select-none"
      style={{ contain: 'layout style' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onPointerDownCapture={handlePointerDownCapture}
    >
      {/* Screen Reader Live Region — transition announcements while focus is
          outside the menu; empty (silent) once real focus takes over. */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      <XMBHeader />

      {layoutMode === 'full' && (
        <div className="absolute left-[15%] top-[30%] overflow-visible">
          <XMBCategoryRow
            categories={categories}
            categoryIndex={categoryIndex}
            itemIndex={itemIndex}
            onCategorySelect={handleCategorySelect}
            isPointerEvent={isPointerEvent}
          />

          <XMBVerticalList
            activeCategory={activeCategory}
            currentItems={parentItems}
            itemIndex={parentIndex}
            categoryIndex={categoryIndex}
            navigationPath={navigationPath}
            isContextView={isInsideFolder}
            onItemSelect={setItemIndex}
            onFolderDrill={handleFolderDrill}
            onRestricted={handleRestricted}
            restrictedPing={restrictedPing}
            isPointerEvent={isPointerEvent}
          />
        </div>
      )}

      {/* Paged layout */}
      <AnimatePresence mode="popLayout">
        {layoutMode === 'paged' && pagedStage === 'categories' && (
          <motion.div
            key="paged-categories"
            className="absolute inset-x-0 top-[30%] flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: EASE.MOVE }}
          >
            <XMBCategoryRow
              categories={categories}
              categoryIndex={categoryIndex}
              itemIndex={itemIndex}
              onCategorySelect={handleCategorySelect}
              isPointerEvent={isPointerEvent}
            />
          </motion.div>
        )}

        {layoutMode === 'paged' && pagedStage === 'list' && (
          <motion.div
            key="paged-list"
            className="absolute inset-x-0 top-[22%] flex justify-center"
            style={{ touchAction: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: EASE.MOVE }}
            onPanStart={listPanHandlers.onPanStart}
            onPan={listPanHandlers.onPan}
            onPanEnd={listPanHandlers.onPanEnd}
            onClickCapture={listPanHandlers.onClickCapture}
          >
            <XMBVerticalList
              activeCategory={activeCategory}
              currentItems={currentItems}
              itemIndex={itemIndex}
              categoryIndex={categoryIndex}
              navigationPath={navigationPath}
              isContextView={false}
              onItemSelect={setItemIndex}
              onFolderDrill={handleFolderDrill}
              onBack={handleFolderBack}
              onRestricted={handleRestricted}
              restrictedPing={restrictedPing}
              isPointerEvent={isPointerEvent}
              listClassName="w-[88vw] max-w-2xl"
              showHeader
              onHeaderClick={() => {
                // Returning to the categories stage must be a clean root
                // state — a stale folder path desyncs the command bar and
                // kills root swipes (same reason handleCategorySelect
                // clears it). Clean root state IS the 'categories' stage.
                setNavigationPath([]);
                setItemIndex(-1);
              }}
              layoutMode="paged"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel View - Shows when inside a folder */}
      <AnimatePresence>
        {showCarousel && showFullLayout && (
          <XMBCarousel
            items={currentItems}
            activeIndex={itemIndex >= 0 ? itemIndex : 0}
            onSelect={setItemIndex}
            onBack={handleFolderBack}
            onRestricted={handleRestricted}
            restrictedPing={restrictedPing}
            isPointerEvent={isPointerEvent}
          />
        )}
      </AnimatePresence>

      {/* Rich Preview (Level 3) - Only show when NOT in carousel mode.
          Top-level folders are containers, not previewable content — wait until
          the user drills into them before showing a preview. */}
      <AnimatePresence>
        {activeItem && !showCarousel && showFullLayout && activeItem.type !== 'folder' && !activeItem.hidePreview && (
          <XMBPreview item={activeItem} />
        )}
      </AnimatePresence>

      {/* Restricted-item toast — sits just above the command bar */}
      <XMBRestrictedToast ping={restrictedPing} />

      {/* Contextual command bar (PS3-style hint strip; pressable on touch) */}
      <XMBCommandBar commands={commands} />
    </div>
  );
};

export default XMBInterface;
