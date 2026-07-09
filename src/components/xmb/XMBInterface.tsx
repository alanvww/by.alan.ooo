// src/components/xmb/XMBInterface.tsx
'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { XMBCategory, XMBItem } from '@/lib/xmb-types';
import { useXMBNavigation } from '@/hooks/useXMBNavigation';
import XMBCategoryRow from './XMBCategoryRow';
import XMBVerticalList from './XMBVerticalList';
import XMBCarousel from './XMBCarousel';
import XMBPreview from './XMBPreview';
import { useTheme } from '@/lib/theme-context';
import XMBHeader from './XMBHeader';
import XMBKeyboardHelper from './XMBKeyboardHelper';

interface XMBInterfaceProps {
  categories: XMBCategory[];
}

const XMBInterface = ({ categories }: XMBInterfaceProps) => {
  const { toggleTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<'full' | 'paged'>('full');
  const [pagedStage, setPagedStage] = useState<'categories' | 'list'>('categories');

  const augmentedCategories = useMemo(() => {
    return categories.map(cat => {
      if (cat.id === 'settings') {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.actionId === 'toggle-theme') {
              return { ...item, action: toggleTheme };
            }
            return item;
          })
        };
      }
      return cat;
    });
  }, [categories, toggleTheme]);

  const {
    categoryIndex,
    itemIndex,
    navigationPath,
    activeCategory,
    activeItem,
    currentItems,
    setCategoryIndex,
    setItemIndex,
    setNavigationPath,
    pressedKeys,
    finishNavigation
  } = useXMBNavigation(augmentedCategories);

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

  useEffect(() => {
    if (layoutMode !== 'paged') {
      return;
    }

    if (itemIndex >= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- paged stage trails navigation state driven by the shared XMB navigation context
      setPagedStage('list');
    } else if (itemIndex === -1 && navigationPath.length === 0) {
      setPagedStage('categories');
    }
  }, [layoutMode, itemIndex, navigationPath.length]);

  useEffect(() => {
    if (layoutMode === 'full') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paged stage when the ResizeObserver switches layout mode
      setPagedStage('categories');
    }
  }, [layoutMode]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (itemIndex !== -1) {
      return;
    }

    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, [itemIndex]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (itemIndex !== -1) {
      touchStartX.current = null;
      return;
    }

    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (startX === null || endX === undefined) {
      return;
    }

    const deltaX = startX - endX;
    const swipeThreshold = 50;

    if (Math.abs(deltaX) < swipeThreshold) {
      return;
    }

    if (deltaX > 0) {
      setCategoryIndex(categoryIndex < augmentedCategories.length - 1 ? categoryIndex + 1 : 0);
    } else {
      setCategoryIndex(categoryIndex > 0 ? categoryIndex - 1 : augmentedCategories.length - 1);
    }
    setItemIndex(-1);
  }, [itemIndex, categoryIndex, augmentedCategories.length, setCategoryIndex, setItemIndex]);

  const handleFolderDrill = (idx: number) => {
    setNavigationPath([...navigationPath, idx]);
    setItemIndex(0);
  };

  // Check if we're inside a folder (drilled down)
  const isInsideFolder = navigationPath.length > 0;
  const showCarousel = isInsideFolder && currentItems.length > 0;

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

  // Handle Escape key for paged layout back navigation
  // This must be called before any early returns to satisfy Rules of Hooks
  useEffect(() => {
    const handlePagedBack = (event: KeyboardEvent) => {
      if (layoutMode !== 'paged') {
        return;
      }

      if (event.key === 'Escape') {
        setPagedStage('categories');
      }
    };

    window.addEventListener('keydown', handlePagedBack);
    return () => {
      window.removeEventListener('keydown', handlePagedBack);
    };
  }, [layoutMode]);

  // Early return after all hooks have been called
  if (augmentedCategories.length === 0 || !activeCategory) return null;

  const handleCategorySelect = (idx: number) => {
    if (layoutMode === 'paged' && idx === categoryIndex) {
      setPagedStage('categories');
      setItemIndex(-1);
      return;
    }

    setCategoryIndex(idx);
    if (layoutMode === 'paged') {
      setItemIndex(0);
      setPagedStage('list');
    } else {
      setItemIndex(-1);
    }
  };

  const showFullLayout = layoutMode === 'full';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 text-white overflow-hidden font-sans select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 bg-linear-to-br from-black/40 to-transparent" />

      {/* Screen Reader Live Region */}
      <div aria-live="polite" className="sr-only">
        {activeItem ? `Selected item: ${activeItem.title}` : `Selected category: ${activeCategory.title}`}
      </div>

      <XMBHeader />

      {layoutMode === 'full' && (
        <div className="absolute left-[15%] top-[30%]">
          <XMBCategoryRow
            categories={augmentedCategories}
            categoryIndex={categoryIndex}
            itemIndex={itemIndex}
            onCategorySelect={handleCategorySelect}
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
          />
        </div>
      )}

      {/* Paged layout */}
      <AnimatePresence mode="wait">
        {layoutMode === 'paged' && pagedStage === 'categories' && (
          <motion.div
            key="paged-categories"
            className="absolute inset-x-0 top-[30%] flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <XMBCategoryRow
              categories={augmentedCategories}
              categoryIndex={categoryIndex}
              itemIndex={itemIndex}
              onCategorySelect={handleCategorySelect}
            />
          </motion.div>
        )}

        {layoutMode === 'paged' && pagedStage === 'list' && (
          <motion.div
            key="paged-list"
            className="absolute inset-x-0 top-[22%] flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
              listClassName="w-[70vw] max-w-2xl"
              showHeader
              onHeaderClick={() => {
                setItemIndex(-1);
                setPagedStage('categories');
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
          />
        )}
      </AnimatePresence>

      {/* Rich Preview (Level 3) - Only show when NOT in carousel mode */}
      <AnimatePresence>
        {activeItem && !showCarousel && showFullLayout && (
          <XMBPreview item={activeItem} />
        )}
      </AnimatePresence>

      {/* Keyboard Helper */}
      <XMBKeyboardHelper pressedKeys={pressedKeys} />
    </div>
  );
};

export default XMBInterface;
