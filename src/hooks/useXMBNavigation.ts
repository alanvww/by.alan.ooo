// src/hooks/useXMBNavigation.ts
import { useEffect, useCallback, useRef, useState } from 'react';
import type { XMBCategory, XMBItem } from '@/lib/xmb-types';
import { useRouter } from 'next/navigation';
import { useXMBNavigationContext } from '@/lib/xmb-navigation-context';
import { useKeyAudioFx } from '@/hooks/useKeyAudioFx';

export function useXMBNavigation(categories: XMBCategory[]) {
  const {
    categoryIndex,
    setCategoryIndex,
    itemIndex,
    setItemIndex,
    navigationPath,
    setNavigationPath,
    activeCategory,
    activeItem,
    currentItems,
    isNavigating,
    startNavigation,
    finishNavigation
  } = useXMBNavigationContext();

  const { playKeySound } = useKeyAudioFx();
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
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
  const playKeySoundRef = useRef(playKeySound);

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
    playKeySoundRef.current = playKeySound;
  }, [categories, categoryIndex, itemIndex, navigationPath, activeCategory, activeItem, currentItems, router, startNavigation, playKeySound]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    setPressedKeys(prev => new Set(prev).add(key));

    // Play sound for all handled navigation keys
    const handledKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Backspace'];
    if (handledKeys.includes(key)) {
      // Skip Backspace sound when focused on input/textarea (Backspace is ignored there)
      if (key === 'Backspace' && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        // Don't play sound — this keypress is not handled by XMB
      } else {
        playKeySoundRef.current();
      }
    }

    switch (key) {
      case 'ArrowLeft':
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
        break;
      case 'ArrowRight':
        if (navigationPathRef.current.length > 0) {
          // Inside folder: open the selected item (link/action only, not folders)
          if (activeItemRef.current) {
            if (activeItemRef.current.action) {
              activeItemRef.current.action();
            } else if (activeItemRef.current.link) {
              if (activeItemRef.current.link.startsWith('http') || activeItemRef.current.link.startsWith('mailto')) {
                window.open(activeItemRef.current.link, '_blank');
              } else {
                startNavigationRef.current();
                routerRef.current.push(activeItemRef.current.link);
              }
            }
            // If it's a folder, → does nothing (Enter is required to drill into nested folders)
          }
        } else {
          // Category level or item selected: switch to next category
          setCategoryIndex((categoryIndexRef.current < categoriesRef.current.length - 1 ? categoryIndexRef.current + 1 : 0));
          setItemIndex(-1);
          setNavigationPath([]);
        }
        break;
      case 'ArrowUp':
        setItemIndex((itemIndexRef.current > -1 ? itemIndexRef.current - 1 : -1));
        break;
      case 'ArrowDown':
        setItemIndex((() => {
          const max = currentItemsRef.current.length - 1;
          return itemIndexRef.current < max ? itemIndexRef.current + 1 : itemIndexRef.current;
        })());
        break;
      case 'Enter':
        if (activeItemRef.current) {
          if (activeItemRef.current.type === 'folder' && activeItemRef.current.items) {
            setNavigationPath([...navigationPathRef.current, itemIndexRef.current]);
            setItemIndex(0);
          } else if (activeItemRef.current.action) {
            activeItemRef.current.action();
          } else if (activeItemRef.current.link) {
            if (activeItemRef.current.link.startsWith('http') || activeItemRef.current.link.startsWith('mailto')) {
              window.open(activeItemRef.current.link, '_blank');
            } else {
              startNavigationRef.current();
              routerRef.current.push(activeItemRef.current.link);
            }
          }
        } else {
            if (currentItemsRef.current.length > 0) {
                setItemIndex(0);
            }
        }
        break;
      case 'Escape':
      case 'Backspace':
        if (key === 'Backspace' && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
          return;
        }
        if (navigationPathRef.current.length > 0) {
          const parentFolderIndex = navigationPathRef.current[navigationPathRef.current.length - 1];
          setNavigationPath(navigationPathRef.current.slice(0, -1));
          setItemIndex(parentFolderIndex);
        } else if (itemIndexRef.current !== -1) {
          setItemIndex(-1);
        }
        break;
    }
  }, [setCategoryIndex, setItemIndex, setNavigationPath]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(e.key);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    categoryIndex,
    itemIndex,
    navigationPath,
    activeCategory,
    activeItem,
    currentItems,
    isNavigating,
    startNavigation,
    finishNavigation,
    setCategoryIndex,
    setItemIndex,
    setNavigationPath,
    pressedKeys
  };
}
