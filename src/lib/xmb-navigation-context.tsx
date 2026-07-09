'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { XMBCategory, XMBItem } from './xmb-types';

interface XMBNavigationContextType {
    categoryIndex: number;
    itemIndex: number;
    navigationPath: number[];
    setCategoryIndex: (index: number) => void;
    setItemIndex: (index: number) => void;
    setNavigationPath: (path: number[]) => void;
    activeCategory: XMBCategory | null;
    activeItem: XMBItem | null;
    currentItems: XMBItem[];
    pressedKeys: Set<string>;
    isContentViewing: boolean;
    setIsContentViewing: (isViewing: boolean) => void;
    isNavigating: boolean;
    startNavigation: () => void;
    finishNavigation: () => void;
}

const XMBNavigationContext = createContext<XMBNavigationContextType | undefined>(undefined);

export const XMBNavigationProvider = ({ children, categories }: { children: React.ReactNode, categories: XMBCategory[] }) => {
    const [categoryIndex, setCategoryIndex] = useState(2); // Default to Projects
    const [itemIndex, setItemIndex] = useState(-1);
    const [navigationPath, setNavigationPath] = useState<number[]>([]);
    const [pressedKeys] = useState<Set<string>>(new Set());
    const [isContentViewing, setIsContentViewing] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    const navTimerRef = useRef<NodeJS.Timeout | null>(null);
    const minDelayReachedRef = useRef(false);
    const finishPendingRef = useRef(false);

    const startNavigation = useCallback(() => {
        setIsNavigating(true);
        minDelayReachedRef.current = false;
        finishPendingRef.current = false;
        
        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        
        navTimerRef.current = setTimeout(() => {
            minDelayReachedRef.current = true;
            if (finishPendingRef.current) {
                setIsNavigating(false);
            }
        }, 400); // 400ms minimum display time
    }, []);

    const finishNavigation = useCallback(() => {
        if (minDelayReachedRef.current) {
            setIsNavigating(false);
        } else {
            finishPendingRef.current = true;
        }
    }, []);

    const activeCategory = categories[categoryIndex] || null;
    
    const getCurrentItems = (): XMBItem[] => {
        if (!activeCategory) return [];
        let currentItems = activeCategory.items;
        for (const pathIndex of navigationPath) {
            if (currentItems[pathIndex]?.items) {
                currentItems = currentItems[pathIndex].items!;
            }
        }
        return currentItems;
    };

    const currentItems = getCurrentItems();
    const activeItem = itemIndex >= 0 ? currentItems[itemIndex] : null;

    // We'll keep the keyboard handling here too if we want it global
    // But for now, let's just provide the state

    return (
        <XMBNavigationContext.Provider value={{
            categoryIndex,
            itemIndex,
            navigationPath,
            setCategoryIndex,
            setItemIndex,
            setNavigationPath,
            activeCategory,
            activeItem,
            currentItems,
            pressedKeys,
            isContentViewing,
            setIsContentViewing,
            isNavigating,
            startNavigation,
            finishNavigation
        }}>
            {children}
        </XMBNavigationContext.Provider>
    );
};

export const useXMBNavigationContext = () => {
    const context = useContext(XMBNavigationContext);
    if (!context) {
        throw new Error('useXMBNavigationContext must be used within an XMBNavigationProvider');
    }
    return context;
};
