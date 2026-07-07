// src/components/xmb/XMBVerticalList.tsx
"use client";

import React, { useState, useMemo, useCallback, forwardRef } from "react";
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import type { XMBCategory, XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import XMBBackPill from "./XMBBackPill";
import { XMB_LAYOUT, XMB_ANIMATION, EASE } from "@/lib/xmb-constants";
import { activateItem, getEnterActionLabel } from "@/lib/xmb-navigation";
import { playNavigate, playConfirm } from "@/hooks/useKeyAudioFx";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import XMBKeycap from "./XMBKeycap";

interface XMBVerticalListProps {
    activeCategory: XMBCategory;
    currentItems: XMBItem[]; // Use the current items from navigation hook
    itemIndex: number;
    categoryIndex: number; // Add this for fallback positioning
    navigationPath: number[]; // Add path for breadcrumb/context
    isContextView?: boolean; // Show as context sidebar when inside folder
    onItemSelect: (index: number) => void;
    onFolderDrill?: (index: number) => void;
    onBack?: () => void; // Exit the folder (mouse/touch equivalent of Escape)
    listClassName?: string;
    showHeader?: boolean;
    onHeaderClick?: () => void;
    layoutMode?: 'full' | 'paged';
}

interface XMBListItemProps {
    item: XMBItem;
    index: number;
    selectedIndex: number; // global selected index for distance-based fade
    isItemSelected: boolean;
    onItemSelect: (index: number) => void;
}

const XMBListItem = React.memo(forwardRef<HTMLDivElement, XMBListItemProps>(
    ({ item, index, selectedIndex, isItemSelected, onItemSelect }, ref) => {
        const [imgError, setImgError] = useState(false);
        const isCoarse = useCoarsePointer();
        const reduceMotion = useReducedMotion();
        const isFolder = item.type === 'folder';

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

        return (
            <div
                ref={ref}
                role="option"
                aria-selected={isItemSelected}
                id={`xmb-item-${index}`}
                className="relative w-full cursor-pointer mb-6 md:mb-8 focus-visible:outline-none overflow-visible"
                style={{ contain: 'layout style' }}
                onClick={() => onItemSelect(index)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onItemSelect(index);
                    }
                }}
                tabIndex={isItemSelected ? 0 : -1}
            >
                {/* Item visual scale/offset animation with highlight */}
                <motion.div
                    className={`flex items-center gap-3 md:gap-4 w-full py-3 md:py-4 px-3 md:px-4 rounded-lg transition-[background-color,box-shadow,border-color] duration-150 ${
                        isItemSelected
                            ? "bg-xmb-fg/20 ring-1 ring-xmb-fg/40 shadow-[0_0_20px_var(--color-xmb-shadow-glow)]"
                            : "hover:bg-xmb-fg/5"
                    }`}
                    animate={{ y: -aboveRowLift, opacity }}
                    transition={XMB_ANIMATION.LIST_SPRING}
                    style={{ willChange: "transform, opacity" }}
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
                                <XMBIcon name="Folder" size={24} />
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
                            {isFolder && (
                                <motion.div
                                    animate={{ x: isItemSelected && !reduceMotion ? [0, 5, 0] : 0 }}
                                    transition={{
                                        repeat: isItemSelected && !reduceMotion ? Infinity : 0,
                                        duration: 1.5,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <XMBIcon name="CaretRight" size={18} />
                                </motion.div>
                            )}
                        </div>
                        {isItemSelected && item.description && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 0.6, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs md:text-sm text-xmb-fg/60 mt-1 line-clamp-2"
                            >
                                {item.description}
                            </motion.p>
                        )}
                    </div>

                    {/* Floating ENTER hint — telegraphs the action at the focus
                        point. On coarse pointers the hint IS the control: a
                        tappable chip running the same activate path. */}
                    <AnimatePresence>
                        {isItemSelected && (
                            <motion.div
                                key="enter-hint"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18, ease: EASE.ENTER }}
                                className="flex items-center gap-2 shrink-0 pr-1"
                                aria-hidden={isCoarse ? undefined : 'true'}
                            >
                                {isCoarse ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            // The row's own onClick would activate too —
                                            // one tap, one activation.
                                            e.stopPropagation();
                                            onItemSelect(index);
                                        }}
                                        className="min-h-11 px-4 rounded-full border border-xmb-fg/25 bg-xmb-fg/10 text-[10px] font-mono uppercase tracking-[0.18em] text-xmb-fg/80 touch-manipulation select-none active:bg-xmb-fg active:text-background transition-colors duration-150"
                                    >
                                        {getEnterActionLabel(item)}
                                    </button>
                                ) : (
                                    <>
                                        <XMBKeycap label="ENTER" pressed={false} className="px-1.5 w-auto" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-xmb-fg/55">
                                            {getEnterActionLabel(item)}
                                        </span>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        );
    },
));

XMBListItem.displayName = "XMBListItem";

const XMBVerticalList = React.memo(
    ({
        activeCategory,
        currentItems,
        itemIndex,
        categoryIndex,
        navigationPath,
        isContextView = false,
        onItemSelect,
        onFolderDrill,
        onBack,
        listClassName,
        showHeader = false,
        onHeaderClick,
        layoutMode = 'full',
    }: XMBVerticalListProps) => {
        const router = useRouter();
        const { startNavigation } = useXMBLoadingContext();

        const handleItemClick = useCallback((idx: number) => {
            const item = currentItems[idx];
            if (!item) return;

            if (idx === itemIndex) {
                // Second click on the already-selected row = open/activate
                playConfirm();
                activateItem(item, idx, {
                    router,
                    startNavigation,
                    drillIntoFolder: onFolderDrill,
                });
            } else {
                // First click on a different row = move the cursor
                playNavigate();
                onItemSelect(idx);
            }
        }, [currentItems, itemIndex, onFolderDrill, onItemSelect, router, startNavigation]);

        const displayIndex = itemIndex === -1 ? 0 : itemIndex;
        const containerOffset = useMemo(() => {
            return -displayIndex * XMB_LAYOUT.LIST_ROW_STEP_PX;
        }, [displayIndex]);

        // What the back pill does here: exit the folder when inside one,
        // otherwise (paged top level) fall back to the header's
        // return-to-categories action.
        const backPillAction = navigationPath.length > 0
            ? onBack
            : layoutMode === 'paged'
            ? onHeaderClick
            : undefined;


        // Re-mount the list (and replay the slide-in) only when the category
        // changes. Drilling into / out of folders updates `currentItems` but
        // the wrapper stays mounted, so items just reconcile against their
        // own `item.id` keys without retriggering the entrance animation.
        const listKey = activeCategory.id;

        return (
            <AnimatePresence mode="popLayout">

                <motion.div
                    key={listKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                        opacity: 1,
                        x: 0,
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15, ease: EASE.MOVE }}
                    className="absolute overflow-visible"
                    style={{
                        ...(layoutMode === 'paged'
                            ? {
                                  position: 'relative',
                                  top: 'auto',
                                  left: 'auto',
                                  transform: 'none',
                                  marginTop: 0,
                                  pointerEvents: 'auto',
                              }
                            : {
                                  // CSS Anchor positioning with inline fallbacks
                                  // (progressive enhancement — browsers without
                                  // anchor support ignore anchor() and use the
                                  // fallback value, which matches the old explicit
                                  // top / left we had before).
                                  // @ts-ignore - CSS Anchor positioning API
                                  positionAnchor: "--active-category",
                                  // @ts-ignore
                                  top: `anchor(bottom, ${XMB_LAYOUT.VERTICAL_LIST_TOP})`,
                                  right: "auto",
                                  bottom: "auto",
                                  // @ts-ignore
                                  left: isContextView ? '-50px' : `anchor(left, ${categoryIndex * XMB_LAYOUT.CATEGORY_WIDTH}px)`,
                                  transform: isContextView ? 'translateX(0)' : 'translateX(-50%)',
                                  // 2rem base gap + 2rem reserving the line the old
                                  // "Press ESC to go back" hint occupied, so the list
                                  // keeps the same vertical rhythm below the big icons.
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
                            className="flex flex-col"
                            style={{
                                width: layoutMode === 'paged' ? '100%' : `${XMB_LAYOUT.LIST_FULL_WIDTH_PX}px`,
                                willChange: "transform",
                            }}
                            animate={{ y: containerOffset }}
                            transition={XMB_ANIMATION.LIST_SPRING}
                        >
                            {currentItems.map((item, idx) => {
                                const isItemSelected = idx === itemIndex;

                                return (
                                    <XMBListItem
                                        key={item.id}
                                        index={idx}
                                        item={item}
                                        selectedIndex={itemIndex}
                                        isItemSelected={isItemSelected}
                                        onItemSelect={handleItemClick}
                                    />
                                );
                            })}
                        </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    },
);

XMBVerticalList.displayName = "XMBVerticalList";

export default XMBVerticalList;
