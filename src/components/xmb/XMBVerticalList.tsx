// src/components/xmb/XMBVerticalList.tsx
"use client";

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, forwardRef } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import type { XMBCategory, XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import XMBBackPill from "./XMBBackPill";
import { XMB_LAYOUT, XMB_ANIMATION, EASE } from "@/lib/xmb-constants";
import { activateItem, isExternalLink } from "@/lib/xmb-navigation";
import { playNavigate, playConfirm } from "@/hooks/useKeyAudioFx";

interface XMBVerticalListProps {
    activeCategory: XMBCategory;
    currentItems: XMBItem[]; // Use the current items from navigation hook
    itemIndex: number;
    // No longer read here (the list is pinned at the wrapper origin), but
    // kept so callers that still thread it keep compiling.
    categoryIndex?: number;
    navigationPath: number[]; // Add path for breadcrumb/context
    isContextView?: boolean; // Show as context sidebar when inside folder
    onItemSelect: (index: number) => void;
    onFolderDrill?: (index: number) => void;
    onBack?: () => void; // Exit the folder (mouse/touch equivalent of Escape)
    listClassName?: string;
    showHeader?: boolean;
    onHeaderClick?: () => void;
    layoutMode?: 'full' | 'paged';
    /** True during a pointer press: focus events it causes must not drive selection. */
    isPointerEvent?: () => boolean;
}

interface XMBListItemProps {
    item: XMBItem;
    index: number;
    selectedIndex: number; // global selected index for distance-based fade
    isItemSelected: boolean;
    /** In-folder context sidebar: rows are inert and unfocusable. */
    isContextView: boolean;
    /** First click / keyboard focus: move the cursor to this row. */
    onRowSelect: (index: number) => void;
    /** Second click on the selected row (folders/actions): activate it. */
    onRowActivate: (index: number) => void;
    /** Keyboard/AT focus landed on this row: sync the selection cursor. */
    onRowFocus: (index: number) => void;
    /** Shows the loading skeleton ahead of internal link navigation. */
    startNavigation: () => void;
}

const XMBListItem = React.memo(forwardRef<HTMLElement, XMBListItemProps>(
    ({ item, index, selectedIndex, isItemSelected, isContextView, onRowSelect, onRowActivate, onRowFocus, startNavigation }, ref) => {
        const [imgError, setImgError] = useState(false);
        const reduceMotion = useReducedMotion();
        const isFolder = item.type === 'folder';

        // Rows that navigate render as real links (SPA <Link> internally,
        // <a target=_blank> externally) so middle-click, context menus, and
        // assistive tech all get genuine link semantics; folders and action
        // items render as <button>.
        const isLinkRow = !!item.link && !item.action && !isFolder;
        const isExternal = isLinkRow && isExternalLink(item.link!);

        // Roving tabindex: the selected row is the list's one tab stop; with
        // nothing selected yet, row 0 is the Tab entry point (focusing it
        // selects it via onRowFocus). Context-view rows are never tabbable.
        const tabIndex = isContextView
            ? -1
            : isItemSelected || (selectedIndex === -1 && index === 0)
            ? 0
            : -1;

        const handleClick = (e: React.MouseEvent<HTMLElement>): void => {
            // Modified clicks on links (cmd/ctrl/shift/middle) are pure
            // browser affordances — no selection change, no preventDefault.
            if (isLinkRow && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
                return;
            }
            if (!isItemSelected) {
                // First click moves the cursor, never activates.
                e.preventDefault();
                onRowSelect(index);
                return;
            }
            playConfirm();
            if (isLinkRow) {
                // The anchor performs the navigation natively: <Link> pushes
                // the route, external <a> opens its tab. No preventDefault.
                if (!isExternal) {
                    startNavigation();
                }
                return;
            }
            e.preventDefault();
            onRowActivate(index);
        };

        const handleFocus = (): void => onRowFocus(index);

        // Distance from selected item (negative = above, positive = below).
        // Opacity falloff carries the depth cue; we deliberately skip per-item
        // scale / x-shift so the only motion between selections is the
        // container slide, the above-row lift, and the highlight crossfade.
        // Visual treatment is identical regardless of `isContextView` —
        // that prop only controls interactivity (pointer-events) so the
        // in-folder parent list reuses the same look as the top-level list.
        const delta = selectedIndex >= 0 ? index - selectedIndex : index;
        const isAbove = delta < 0;
        const distance = Math.abs(delta);

        // Items above the selection are routed into a narrow lane above the
        // active row so they don't collide with its highlight / description.
        const aboveRowLift = isAbove
            ? XMB_LAYOUT.TITLE_ROW_CLEARANCE_PX + Math.max(0, distance - 1) * XMB_LAYOUT.ABOVE_ROW_STACK_STEP_PX
            : 0;

        const opacity = isItemSelected
            ? 1
            : isAbove
            ? Math.max(0.1, 0.42 * Math.pow(0.62, distance - 1))
            : Math.max(0.25, 0.7 - distance * 0.1);

        // No element-level Enter/Space handler: links and buttons activate
        // natively (the window dispatcher's guard stands down for them), so
        // exactly one activation fires per keypress.
        const rowClassName = 'relative block w-full cursor-pointer mb-6 md:mb-8 focus-visible:outline-none overflow-visible';
        const sharedProps: React.HTMLAttributes<HTMLElement> = {
            role: 'option',
            'aria-selected': isItemSelected,
            id: `xmb-item-${index}`,
            className: rowClassName,
            style: { contain: 'layout style' },
            onClick: handleClick,
            onFocus: handleFocus,
            tabIndex,
        };

        const content = (
            <>
                {/* Item visual scale/offset animation with highlight */}
                <motion.div
                    className={`flex items-center gap-3 md:gap-4 w-full py-3 md:py-4 px-3 md:px-4 rounded-lg transition-[background-color,box-shadow,border-color] duration-150 ${
                        isItemSelected
                            ? "bg-xmb-fg/20 ring-1 ring-xmb-fg/40 shadow-[0_0_20px_var(--color-xmb-shadow-glow)]"
                            : "hover:bg-xmb-fg/5"
                    }`}
                    animate={{ y: -aboveRowLift, opacity }}
                    transition={XMB_ANIMATION.LIST_SPRING}
                >
                    {/* Thumbnail */}
                    <div
                        className={`w-16 h-10 md:w-24 md:h-14 bg-xmb-fg/5 rounded flex items-center justify-center overflow-hidden border shrink-0 ${
                            isItemSelected
                                ? "border-xmb-fg/50"
                                : "border-xmb-fg/10"
                        }`}
                    >
                        {isFolder ? (
                            <div className="flex items-center justify-center w-full h-full">
                                <XMBIcon name={item.icon ?? "Folder"} size={24} />
                            </div>
                        ) : item.icon ? (
                            <div className="flex items-center justify-center w-full h-full">
                                <XMBIcon name={item.icon} size={24} />
                            </div>
                        ) : item.image && !imgError ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={item.image}
                                    alt=""
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        ) : (
                            <XMBIcon name="File" size={24} />
                        )}
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-lg md:text-xl font-light whitespace-nowrap truncate">
                                {item.title}
                            </span>
                            {isFolder && !isItemSelected && (
                                <XMBIcon name="CaretRight" size={18} />
                            )}
                        </div>
                        {/* initial={false}: entering at full size avoids the
                            height 0→auto tween, which forces a column reflow on
                            every animation frame right when the list mounts
                            with row 0 selected. */}
                        {isItemSelected && item.description && (
                            <motion.p
                                initial={false}
                                // Full element opacity: stacking 0.6 on the /60
                                // color token landed at ~0.36 effective (~3.2:1,
                                // a WCAG AA failure); /70 alone is ~9.7:1.
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs md:text-sm text-xmb-fg/70 mt-1 line-clamp-2"
                            >
                                {item.description}
                            </motion.p>
                        )}
                    </div>

                    {/* Selected folders park the disclosure caret on the card's
                        right edge (it leaves the title line while selected so
                        the title keeps the width). */}
                    <AnimatePresence>
                        {isItemSelected && isFolder && (
                            <motion.div
                                key="drill-caret"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18, ease: EASE.ENTER }}
                                className="shrink-0 pr-1"
                                aria-hidden="true"
                            >
                                <motion.div
                                    animate={{ x: reduceMotion ? 0 : [0, 5, 0] }}
                                    transition={{
                                        repeat: reduceMotion ? 0 : Infinity,
                                        duration: 1.5,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <XMBIcon name="CaretRight" size={18} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </>
        );

        if (isLinkRow && !isExternal) {
            return (
                <Link href={item.link!} prefetch={false} ref={ref as React.Ref<HTMLAnchorElement>} {...sharedProps}>
                    {content}
                </Link>
            );
        }
        if (isLinkRow) {
            return (
                <a href={item.link} target="_blank" rel="noopener noreferrer" ref={ref as React.Ref<HTMLAnchorElement>} {...sharedProps}>
                    {content}
                    <span className="sr-only"> (opens in new tab)</span>
                </a>
            );
        }
        return (
            <button type="button" ref={ref as React.Ref<HTMLButtonElement>} {...sharedProps} className={`${rowClassName} text-left`}>
                {content}
            </button>
        );
    },
));

XMBListItem.displayName = "XMBListItem";

const XMBVerticalList = React.memo(
    ({
        activeCategory,
        currentItems,
        itemIndex,
        navigationPath,
        isContextView = false,
        onItemSelect,
        onFolderDrill,
        onBack,
        listClassName,
        showHeader = false,
        onHeaderClick,
        layoutMode = 'full',
        isPointerEvent,
    }: XMBVerticalListProps) => {
        const router = useRouter();
        const { startNavigation } = useXMBLoadingContext();

        // First click on a different row = move the cursor.
        const handleRowSelect = useCallback((idx: number) => {
            playNavigate();
            onItemSelect(idx);
        }, [onItemSelect]);

        // Second click on the selected row, folders/actions only — link rows
        // navigate natively through their own anchor. Sound is owned by the
        // row's onClick (playConfirm) so both paths stay in step.
        const handleRowActivate = useCallback((idx: number) => {
            const item = currentItems[idx];
            if (!item) return;
            activateItem(item, idx, {
                router,
                startNavigation,
                drillIntoFolder: onFolderDrill,
            });
        }, [currentItems, onFolderDrill, router, startNavigation]);

        // Keyboard/AT focus landed on a row: sync the selection cursor.
        // Pointer-driven focus defers to onClick (the two-click model); the
        // idempotence check keeps the index→focus sync from echoing back.
        const handleRowFocus = useCallback((idx: number) => {
            if (isPointerEvent?.()) return;
            if (idx !== itemIndex) onItemSelect(idx);
        }, [isPointerEvent, itemIndex, onItemSelect]);

        const displayIndex = itemIndex === -1 ? 0 : itemIndex;

        // Row DOM nodes, keyed by item.id. Index keys would alias across
        // content swaps (category switches replace the item set in place),
        // letting a measurement read a stale node from the previous list.
        // Written only from callback refs (React Compiler safe); entries are
        // deleted on the null cleanup call so the map never holds unmounted
        // nodes.
        const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
        const columnRef = useRef<HTMLDivElement | null>(null);

        // Measured slide offset for the column. Row pitch is content-driven
        // (responsive padding/margins, description expansion), so it must be
        // read from the DOM rather than a constant — a fixed per-row step
        // drifts further from the focus anchor with every index. offsetTop
        // ignores CSS transforms, so the aboveRowLift translate on earlier
        // rows never pollutes the measurement.
        const [containerOffset, setContainerOffset] = useState(0);

        const measureOffset = useCallback(() => {
            const firstId = currentItems[0]?.id;
            const selectedId = currentItems[displayIndex]?.id;
            const first = firstId ? rowRefs.current.get(firstId) : undefined;
            const selected = selectedId ? rowRefs.current.get(selectedId) : undefined;
            if (!first || !selected) {
                return;
            }
            // Diff of offsetTops: exact regardless of offsetParent.
            setContainerOffset(-(selected.offsetTop - first.offsetTop));
        }, [currentItems, displayIndex]);

        // Re-measure before paint whenever selection or the item set changes
        // (both are inputs of measureOffset, so its identity tracks them).
        useLayoutEffect(() => {
            measureOffset();
        }, [measureOffset]);

        // Re-measure whenever the column's size changes: breakpoint/viewport
        // resizes AND the previous selection's description collapse (its
        // AnimatePresence height animation transiently shifts lower rows).
        // Retargeting the y spring mid-flight is fine in motion.
        useEffect(() => {
            const column = columnRef.current;
            if (!column) {
                return;
            }
            const resizeObserver = new ResizeObserver(() => measureOffset());
            resizeObserver.observe(column);
            return () => resizeObserver.disconnect();
        }, [measureOffset]);

        // What the back pill does here: exit the folder when inside one,
        // otherwise (paged top level) fall back to the header's
        // return-to-categories action.
        const backPillAction = navigationPath.length > 0
            ? onBack
            : layoutMode === 'paged'
            ? onHeaderClick
            : undefined;

        // The wrapper stays mounted across category switches — remounting it
        // (the old keyed-AnimatePresence approach) rebuilt the whole list and
        // kept an exiting clone alive for the transition, a main-thread +
        // raster spike on every switch. Instead the rows reconcile against
        // their globally unique `item.id` keys in one commit, and we replay a
        // light slide-in on category change. The pose is driven by explicit
        // motion values, NOT animate-prop retargeting: motion applies
        // retargeted props from its rAF loop after paint, so a state-driven
        // hidden pose flashes the swapped rows at rest for one frame (and can
        // even resolve the fade's origin before the reset lands, skipping the
        // entrance entirely). jump() resets the values synchronously with the
        // commit. Drilling into / out of folders updates `currentItems` but
        // not `activeCategory.id`, so it never retriggers the entrance. No
        // exit animation — the PS3 XMB cuts hard.
        const prevCategoryIdRef = useRef<string | null>(null);
        const entranceOpacity = useMotionValue(0);
        const entranceX = useMotionValue(-20);
        // Imperative animate() on motion values bypasses MotionConfig's
        // reducedMotion, so the entrance gates itself.
        const reduceMotion = useReducedMotion();
        // 'snap' for the commit that swaps categories: the column's y then
        // retargets with duration 0 instead of springing the previous
        // category's scroll offset into the incoming list.
        const [columnPhase, setColumnPhase] = useState<'snap' | 'settled'>('snap');

        useLayoutEffect(() => {
            if (prevCategoryIdRef.current === activeCategory.id) {
                return;
            }
            prevCategoryIdRef.current = activeCategory.id;
            if (reduceMotion) {
                entranceOpacity.jump(1);
                entranceX.jump(0);
            } else {
                entranceOpacity.jump(0);
                entranceX.jump(-20);
                animate(entranceOpacity, 1, { duration: 0.15, ease: EASE.MOVE });
                animate(entranceX, 0, { duration: 0.15, ease: EASE.MOVE });
            }
            setColumnPhase('snap');
        }, [activeCategory.id, entranceOpacity, entranceX, reduceMotion]);

        // Follow-up commit restores the column's selection-move spring.
        useEffect(() => {
            if (columnPhase === 'snap') {
                setColumnPhase('settled');
            }
        }, [columnPhase]);

        return (
            <motion.div
                className="absolute overflow-visible"
                // In the folder context view the carousel is the live listbox;
                // this parent list is background chrome — hidden from AT and
                // inert so its rows can't be focused or clicked, leaving
                // exactly one listbox exposed at a time.
                aria-hidden={isContextView || undefined}
                inert={isContextView || undefined}
                style={{
                    opacity: entranceOpacity,
                    x: entranceX,
                    ...(layoutMode === 'paged'
                        ? {
                              position: 'relative',
                              top: 'auto',
                              left: 'auto',
                              marginTop: 0,
                              pointerEvents: 'auto',
                          }
                        : {
                              // Plain coordinates, not anchor(): the active
                              // category icon always sits at this wrapper's
                              // origin (the strip translates beneath it), so
                              // there is nothing to anchor to that left: 0
                              // doesn't already express — and anchor() was
                              // dropped wholesale by Safari/Firefox, leaving
                              // the list unpositioned there.
                              // Same origin in and out of folders: the context
                              // view only dims/disables the list (the carousel
                              // overlays the folder contents), so any offset
                              // here would read as the list jumping on drill.
                              top: '4rem',
                              left: 0,
                              // 2rem base gap + 2rem reserving the line the old
                              // "Press ESC to go back" hint occupied, so the list
                              // keeps the same vertical rhythm below the big icons.
                              // Combined with top: 4rem the list sits 8rem below
                              // the wrapper top.
                              marginTop: "4rem",
                              pointerEvents: isContextView ? 'none' : 'auto',
                          }),
                }}
            >
                <div
                    className={`relative h-[40dvh] md:h-[50dvh] overflow-visible ${listClassName ?? ''}`}
                >
                    {/* Header + back pill sit above the sliding rows (z-20 vs
                        z-0) so rows that translate up past them can never
                        swallow their taps — a touch user scrolled down a
                        list must always be able to reach "back". */}
                    <div className="relative z-20">
                        {showHeader && (
                            <motion.button
                                type="button"
                                onClick={onHeaderClick}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4 text-lg md:text-xl font-light tracking-wide text-xmb-fg/80 focus-visible:outline-none"
                            >
                                {activeCategory.title}
                            </motion.button>
                        )}
                        {/* Back pill above the item list. In a folder it exits
                            one level; at the top level (paged mode) it returns
                            to the categories stage. The full layout keeps the
                            pill folder-only — the carousel owns it there. */}
                        {backPillAction && !isContextView && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4"
                            >
                                <XMBBackPill onBack={backPillAction} />
                            </motion.div>
                        )}
                    </div>
                    <div
                        role="listbox"
                        aria-label={`Items in ${activeCategory.title}`}
                        className="relative z-0"
                    >

                    {/* Sliding container - Flexbox layout.
                        Width is pinned here so every row in the column is the
                        same width regardless of which one is selected. */}
                    <motion.div
                        ref={columnRef}
                        className="flex flex-col"
                        style={{
                            width: layoutMode === 'paged' ? '100%' : `${XMB_LAYOUT.LIST_FULL_WIDTH_PX}px`,
                            willChange: "transform",
                        }}
                        animate={{ y: containerOffset }}
                        transition={columnPhase === 'snap' ? { duration: 0 } : XMB_ANIMATION.LIST_SPRING}
                    >
                        {currentItems.map((item, idx) => {
                            const isItemSelected = idx === itemIndex;

                            return (
                                <XMBListItem
                                    key={item.id}
                                    ref={(node) => {
                                        if (node) {
                                            rowRefs.current.set(item.id, node);
                                        } else {
                                            rowRefs.current.delete(item.id);
                                        }
                                    }}
                                    index={idx}
                                    item={item}
                                    selectedIndex={itemIndex}
                                    isItemSelected={isItemSelected}
                                    isContextView={isContextView}
                                    onRowSelect={handleRowSelect}
                                    onRowActivate={handleRowActivate}
                                    onRowFocus={handleRowFocus}
                                    startNavigation={startNavigation}
                                />
                            );
                        })}
                    </motion.div>
                    </div>
                </div>
            </motion.div>
        );
    },
);

XMBVerticalList.displayName = "XMBVerticalList";

export default XMBVerticalList;
