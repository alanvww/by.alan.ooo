'use client';

import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from 'react';
import type { XMBCategory, XMBItem } from './xmb-types';

interface XMBSelectionContextType {
    categoryIndex: number;
    itemIndex: number;
    navigationPath: number[];
    setCategoryIndex: React.Dispatch<React.SetStateAction<number>>;
    setItemIndex: React.Dispatch<React.SetStateAction<number>>;
    setNavigationPath: React.Dispatch<React.SetStateAction<number[]>>;
}

interface XMBDerivedContextType {
    activeCategory: XMBCategory | null;
    activeItem: XMBItem | null;
    currentItems: XMBItem[];
}

interface XMBLoadingContextType {
    isNavigating: boolean;
    /**
     * Destination of the in-flight navigation, when known. Lets the loading
     * overlay pick a route-shaped skeleton (/cv, /stack-and-gear) instead of
     * the article one; null falls back to the article shape.
     */
    pendingHref: string | null;
    startNavigation: (href?: string) => void;
    finishNavigation: () => void;
}

const XMBSelectionContext = createContext<XMBSelectionContextType | undefined>(undefined);
const XMBDerivedContext = createContext<XMBDerivedContextType | undefined>(undefined);
const XMBLoadingContext = createContext<XMBLoadingContextType | undefined>(undefined);

function getCurrentItems(activeCategory: XMBCategory | null, navigationPath: number[]): XMBItem[] {
    if (!activeCategory) {
        return [];
    }

    let nextItems = activeCategory.items;

    for (const pathIndex of navigationPath) {
        const nestedItems = nextItems[pathIndex]?.items;

        if (!nestedItems) {
            break;
        }

        nextItems = nestedItems;
    }

    return nextItems;
}

export const XMBNavigationProvider = ({
    children,
    categories,
    initialCategoryIndex = 0,
}: {
    children: React.ReactNode;
    categories: XMBCategory[];
    initialCategoryIndex?: number;
}) => {
    const [categoryIndex, setCategoryIndex] = useState(() =>
        Math.min(Math.max(initialCategoryIndex, 0), Math.max(categories.length - 1, 0)),
    );

    const [itemIndex, setItemIndex] = useState(-1);
    const [navigationPath, setNavigationPath] = useState<number[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    const navTimerRef = useRef<NodeJS.Timeout | null>(null);
    const minDelayReachedRef = useRef(false);
    const finishPendingRef = useRef(false);

    const startNavigation = useCallback((href?: string) => {
        setIsNavigating(true);
        setPendingHref(href ?? null);
        minDelayReachedRef.current = false;
        finishPendingRef.current = false;

        if (navTimerRef.current) {
            clearTimeout(navTimerRef.current);
        }

        navTimerRef.current = setTimeout(() => {
            minDelayReachedRef.current = true;

            if (finishPendingRef.current) {
                setIsNavigating(false);
            }
        }, 150);
    }, []);

    const finishNavigation = useCallback(() => {
        if (minDelayReachedRef.current) {
            setIsNavigating(false);
        } else {
            finishPendingRef.current = true;
        }
    }, []);

    const selectionValue = useMemo<XMBSelectionContextType>(() => ({
        categoryIndex,
        itemIndex,
        navigationPath,
        setCategoryIndex,
        setItemIndex,
        setNavigationPath,
    }), [categoryIndex, itemIndex, navigationPath, setCategoryIndex]);

    const derivedValue = useMemo<XMBDerivedContextType>(() => {
        const activeCategory = categories[categoryIndex] ?? null;
        const currentItems = getCurrentItems(activeCategory, navigationPath);
        const activeItem = itemIndex >= 0 ? currentItems[itemIndex] ?? null : null;

        return {
            activeCategory,
            activeItem,
            currentItems,
        };
    }, [categories, categoryIndex, itemIndex, navigationPath]);

    const loadingValue = useMemo<XMBLoadingContextType>(() => ({
        isNavigating,
        pendingHref,
        startNavigation,
        finishNavigation,
    }), [finishNavigation, isNavigating, pendingHref, startNavigation]);

    return (
        <XMBLoadingContext.Provider value={loadingValue}>
            <XMBSelectionContext.Provider value={selectionValue}>
                <XMBDerivedContext.Provider value={derivedValue}>
                    {children}
                </XMBDerivedContext.Provider>
            </XMBSelectionContext.Provider>
        </XMBLoadingContext.Provider>
    );
};

function useRequiredContext<T>(context: React.Context<T | undefined>, name: string): T {
    const value = useContext(context);

    if (!value) {
        throw new Error(`${name} must be used within an XMBNavigationProvider`);
    }

    return value;
}

export function useXMBSelectionContext(): XMBSelectionContextType {
    return useRequiredContext(XMBSelectionContext, 'useXMBSelectionContext');
}

export function useXMBDerivedContext(): XMBDerivedContextType {
    return useRequiredContext(XMBDerivedContext, 'useXMBDerivedContext');
}

export function useXMBLoadingContext(): XMBLoadingContextType {
    return useRequiredContext(XMBLoadingContext, 'useXMBLoadingContext');
}

export function useXMBNavigationContext(): XMBSelectionContextType & XMBDerivedContextType & XMBLoadingContextType {
    return {
        ...useXMBSelectionContext(),
        ...useXMBDerivedContext(),
        ...useXMBLoadingContext(),
    };
}
