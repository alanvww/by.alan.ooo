// src/components/xmb/XMBVerticalList.tsx
"use client";

import React, { useState, useMemo, useCallback, forwardRef } from "react";
import Image from 'next/image';
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import type { XMBCategory, XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import { XMB_LAYOUT, XMB_ANIMATION } from "@/lib/xmb-constants";

interface XMBVerticalListProps {
    activeCategory: XMBCategory;
    currentItems: XMBItem[]; // Use the current items from navigation hook
    itemIndex: number;
    categoryIndex: number; // Add this for fallback positioning
    navigationPath: number[]; // Add path for breadcrumb/context
    isContextView?: boolean; // Show as context sidebar when inside folder
    onItemSelect: (index: number) => void;
    onFolderDrill?: (index: number) => void;
    listClassName?: string;
    showHeader?: boolean;
    onHeaderClick?: () => void;
    layoutMode?: 'full' | 'paged';
}

interface XMBListItemProps {
    item: XMBItem;
    index: number;
    isItemSelected: boolean;
    isContextView?: boolean;
    onItemSelect: (index: number) => void;
}

const XMBListItem = React.memo(forwardRef<HTMLDivElement, XMBListItemProps>(
    ({ item, index, isItemSelected, isContextView, onItemSelect }, ref) => {
        const [imgError, setImgError] = useState(false);
        const isFolder = item.type === 'folder';

        return (
            <div
                ref={ref}
                role="option"
                aria-selected={isItemSelected}
                id={`xmb-item-${index}`}
                className="relative w-auto cursor-pointer mb-6 md:mb-8 focus-visible:outline-none"
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
                    className={`flex items-center gap-3 md:gap-4 w-full py-3 md:py-4 px-3 md:px-4 rounded-lg transition-all ${
                        isItemSelected && !isContextView
                            ? "bg-white/20 ring-1 ring-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            : isItemSelected && isContextView
                            ? "bg-white/10 ring-1 ring-white/30"
                            : "hover:bg-white/5"
                    }`}
                    animate={{
                        x: isItemSelected && !isContextView ? 40 : 0,
                        scale: isItemSelected && !isContextView ? 1.05 : 1,
                        opacity: isContextView ? (isItemSelected ? 1 : 0.3) : (isItemSelected ? 1 : 0.7),
                    }}
                    transition={XMB_ANIMATION.LIST_SPRING}
                    style={{ willChange: "transform, opacity" }}
                >
                    {/* Thumbnail */}
                    <div
                        className={`w-16 h-10 md:w-24 md:h-14 bg-white/5 rounded flex items-center justify-center overflow-hidden border shrink-0 ${
                            isItemSelected
                                ? "border-white/50"
                                : "border-white/10"
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
                                    animate={{ x: isItemSelected ? [0, 5, 0] : 0 }}
                                    transition={{ 
                                        repeat: isItemSelected ? Infinity : 0,
                                        duration: 1.5,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <XMBIcon name="CaretRight" size={18} />
                                </motion.div>
                            )}
                        </div>
                        {isItemSelected && !isContextView && item.description && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 0.6, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs md:text-sm text-white/60 mt-1 line-clamp-2"
                            >
                                {item.description}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    },
));

XMBListItem.displayName = "XMBListItem";

const ROW_HEIGHT = 96;
const ROW_GAP = 32;
const ROW_STEP = ROW_HEIGHT + ROW_GAP;

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
        listClassName,
        showHeader = false,
        onHeaderClick,
        layoutMode = 'full',
    }: XMBVerticalListProps) => {
        const router = useRouter();
        const { startNavigation } = useXMBLoadingContext();

        const handleItemClick = useCallback((idx: number) => {
            const item = currentItems[idx];

            if (!item) {
                return;
            }

            if (idx === itemIndex) {
                if (item.type === 'folder' && onFolderDrill) {
                    onFolderDrill(idx);
                } else if (item.link) {
                    if (item.link.startsWith('http') || item.link.startsWith('mailto')) {
                        window.open(item.link, '_blank');
                    } else {
                        startNavigation();
                        router.push(item.link);
                    }
                } else if (item.action) {
                    item.action();
                }
            } else {
                onItemSelect(idx);
            }
        }, [currentItems, itemIndex, onFolderDrill, onItemSelect, router, startNavigation]);

        const displayIndex = itemIndex === -1 ? 0 : itemIndex;
        const containerOffset = useMemo(() => {
            return -displayIndex * ROW_STEP;
        }, [displayIndex]);

        // Fallback positioning
        const fallbackLeft = categoryIndex * XMB_LAYOUT.CATEGORY_WIDTH;

        // Create a unique key that includes the navigation path
        const listKey = `${activeCategory.id}-${navigationPath.join('-')}`;

        return (
            <AnimatePresence mode="wait">

                <motion.div
                    key={listKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                        opacity: 1, 
                        x: 0,
                        filter: 'blur(0px)'
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
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
                                  // Fallback positioning
                                  top: XMB_LAYOUT.VERTICAL_LIST_TOP,
                                  left: isContextView ? '-50px' : `${fallbackLeft}px`,
                                  transform: isContextView ? 'translateX(0)' : 'translateX(-50%)',
                                  // CSS Anchor positioning (progressive enhancement)
                                  // @ts-ignore - CSS Anchor positioning API
                                  positionAnchor: "--active-category",
                                  // @ts-ignore
                                  inset: "anchor(bottom) auto auto anchor(left)",
                                  marginTop: "2rem",
                                  pointerEvents: isContextView ? 'none' : 'auto',
                              }),
                    }}
                >
                    <div 
                        className={`relative h-[40vh] md:h-[50vh] overflow-visible ${listClassName ?? ''}`}
                    >
                        {showHeader && (
                            <motion.button
                                type="button"
                                onClick={onHeaderClick}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4 text-lg md:text-xl font-light tracking-wide text-white/80 focus-visible:outline-none"
                            >
                                {activeCategory.title}
                            </motion.button>
                        )}
                        <div
                            role="listbox"
                            aria-label={`Items in ${activeCategory.title}`}
                            className="relative"
                        >
                        {/* Breadcrumb indicator for nested navigation */}
                        {navigationPath.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-8 left-0 text-xs md:text-sm text-white/40 font-mono flex items-center gap-2"
                            >
                                <XMBIcon name="ArrowLeft" size={14} />
                                <span>Press ESC to go back</span>
                            </motion.div>
                        )}
                        
                        {/* Sliding container - Flexbox layout */}
                        <motion.div
                            className="flex flex-col"
                            animate={{ y: containerOffset }}
                            transition={XMB_ANIMATION.LIST_SPRING}
                            style={{ willChange: "transform" }}
                        >
                            {currentItems.map((item, idx) => {
                                const isItemSelected = idx === itemIndex;

                                return (
                                    <XMBListItem
                                        key={item.id}
                                        index={idx}
                                        item={item}
                                        isItemSelected={isItemSelected}
                                        isContextView={isContextView}
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
