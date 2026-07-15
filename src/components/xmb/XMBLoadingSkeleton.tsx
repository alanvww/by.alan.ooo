'use client';

import React from 'react';
import { motion } from 'motion/react';
import { XMB_LAYOUT, XMB_OVERLAY } from '@/lib/xmb-constants';
import { cn } from '@/lib/utils';
import XMBIcon from './XMBIcon';
import XMBHeader from './XMBHeader';

const ShimmerBar = ({ className }: { className?: string }) => (
    <motion.div
        aria-hidden="true"
        className={cn('relative overflow-hidden bg-xmb-fg/5 rounded-lg', className)}
    >
        <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'linear' 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-xmb-fg/10 to-transparent"
        />
    </motion.div>
);

interface XMBLoadingSkeletonProps {
    /**
     * 'fullscreen' draws its own frosted backdrop and back-button placeholder
     * (standalone overlay, e.g. over the home menu). 'content' fills the
     * persistent XMBPostFrame, which already provides both.
     */
    variant?: 'fullscreen' | 'content';
}

const XMBLoadingSkeleton = ({ variant = 'fullscreen' }: XMBLoadingSkeletonProps) => {
    const isFullscreen = variant === 'fullscreen';

    return (
        <div
            role="status"
            aria-label="Loading"
            className={`${
                isFullscreen ? `fixed inset-0 z-50 ${XMB_OVERLAY.FULLSCREEN}` : 'absolute inset-0'
            } flex flex-col text-xmb-fg overflow-hidden`}
        >
            <span className="sr-only">Loading</span>
            {/* Header / Back (Top Left) */}
            {isFullscreen && (
                <div className="absolute top-8 left-12 z-50">
                    <div className="flex items-center gap-3 text-xmb-fg/20">
                        <div className="w-10 h-10 rounded-full border border-xmb-fg/5 flex items-center justify-center bg-xmb-fg/5">
                            <XMBIcon name="ArrowLeft" size={18} />
                        </div>
                        <div className="h-2 w-24 bg-xmb-fg/5 rounded-full" />
                    </div>
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pt-32 pb-48 px-6 md:px-0 scroll-smooth motion-reduce:scroll-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section Skeleton */}
                    <div className="mb-16 text-center flex flex-col items-center">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <ShimmerBar className="h-6 w-20" />
                            <div className="h-px w-12 bg-xmb-fg/10" />
                            <ShimmerBar className="h-4 w-32" />
                        </div>

                        <ShimmerBar className="h-12 md:h-20 w-3/4 mb-4" />
                        <ShimmerBar className="h-12 md:h-20 w-1/2 mb-8" />

                        <div className="flex flex-wrap justify-center gap-3">
                            <ShimmerBar className="h-6 w-16 rounded-full" />
                            <ShimmerBar className="h-6 w-20 rounded-full" />
                            <ShimmerBar className="h-6 w-24 rounded-full" />
                        </div>
                    </div>

                    {/* Featured Image Skeleton */}
                    <ShimmerBar className="relative aspect-video rounded-2xl border border-xmb-fg/10 mb-24" />

                    {/* Content Skeletons */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-11/12" />
                            <ShimmerBar className="h-4 w-10/12" />
                        </div>
                        <div className="space-y-4">
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-3/4" />
                        </div>
                        <div className="space-y-4">
                            <ShimmerBar className="h-4 w-11/12" />
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-1/2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Skeleton — geometry mirrors the real bottom
                nav in XMBPostViewer so the placeholders sit exactly where the
                Previous/Next buttons land when the post arrives. */}
            <div className={`absolute bottom-0 inset-x-0 h-32 ${XMB_OVERLAY.BOTTOM_FADE} pointer-events-none z-40`}>
                <div className="h-full max-w-6xl mx-auto px-6 md:px-12 pb-[env(safe-area-inset-bottom)] flex items-center justify-between pointer-events-none">
                    <div className="flex-1 flex flex-col items-start gap-2">
                        <ShimmerBar className="h-2 w-16" />
                        <ShimmerBar className="h-4 w-32" />
                    </div>

                    <div className="flex-1 flex flex-col items-end gap-2 text-right">
                        <ShimmerBar className="h-2 w-16" />
                        <ShimmerBar className="h-4 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface XMBStandaloneSkeletonShellProps {
    /** Announced to screen readers, e.g. "Loading CV". */
    label: string;
    /** The page's scroll-region horizontal padding (e.g. 'px-6 md:px-0'). */
    paddingClassName: string;
    /** The page's column width (e.g. 'max-w-4xl'). */
    columnClassName: string;
    children: React.ReactNode;
}

/**
 * Frame-shaped shell for the standalone document pages' loading states
 * (/cv, /stack-and-gear). Draws XMBPostFrame's frosted backdrop plus a
 * non-interactive back-pill stand-in at the frame's exact offsets, and the
 * pages' shared scroll-region geometry (pt-32 pb-48, centered column), so
 * the swap to the real page keeps every fixed element in place. The
 * article-shaped skeleton above stays reserved for post routes.
 */
const XMBStandaloneSkeletonShell = ({
    label,
    paddingClassName,
    columnClassName,
    children,
}: XMBStandaloneSkeletonShellProps) => (
    <div
        role="status"
        aria-label={label}
        className={`fixed inset-0 z-50 ${XMB_OVERLAY.FULLSCREEN} flex flex-col text-xmb-fg overflow-hidden`}
    >
        <span className="sr-only">{label}</span>

        {/* Back pill placeholder — same top/left offsets and min-h-11 pill as
            XMBPostFrame's button, so the real control lands on top of it. */}
        <div className="absolute top-[max(2rem,env(safe-area-inset-top))] left-6 md:left-12 z-50">
            <div className="flex min-h-11 items-center gap-2 rounded-full border border-xmb-fg/5 bg-xmb-fg/5 px-3 py-2 text-xmb-fg/20">
                <XMBIcon name="ArrowLeft" size={18} />
            </div>
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden pt-32 pb-48 ${paddingClassName}`}>
            <div className={`${columnClassName} mx-auto`}>{children}</div>
        </div>
    </div>
);

/**
 * CV-shaped skeleton mirroring /cv: centered badge + name header in the
 * max-w-4xl column, then CVEntry-shaped blocks (left rule, title/org against
 * date/location, bullet lines, links row). Used by both the /cv route's
 * loading boundary and the menu-navigation overlay in LayoutWrapper.
 */
export const CVLoadingSkeleton = () => (
    <XMBStandaloneSkeletonShell
        label="Loading CV"
        paddingClassName="px-6 md:px-0"
        columnClassName="max-w-4xl"
    >
        {/* Header — badge pill, then the name (text-4xl md:text-7xl leading-tight).
            No mb-8 on the name like the real h1: that margin collapses into the
            header's mb-16 on the page, but this flex column would add it. */}
        <div className="mb-16 flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center gap-4">
                <ShimmerBar className="h-6 w-28" />
            </div>
            <ShimmerBar className="h-11 w-56 md:h-22 md:w-96" />
        </div>

        {/* Section heading (h2 text-2xl md:text-3xl) — mb-10 matches the
            collapsed margin between the real h2 (mb-6) and first entry (mt-10). */}
        <ShimmerBar className="mb-10 h-8 w-44 md:h-9" />

        {/* CVEntry-shaped blocks. Titles wrap to two lines in the mobile
            column (h-14 = 2 × 28px line boxes), one line at md. */}
        <div className="space-y-10">
            {[0, 1, 2].map((entry) => (
                <div key={entry} className="border-l-2 border-xmb-fg/10 pl-6 md:pl-8">
                    <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-6">
                        <div className="min-w-0 flex-1">
                            <ShimmerBar className="h-14 w-3/4 max-w-md md:h-8" />
                            <ShimmerBar className="mt-1 h-6 w-40 md:h-7" />
                        </div>
                        <div className="flex shrink-0 flex-row flex-wrap gap-x-5 gap-y-1 md:flex-col md:items-end md:gap-1">
                            <ShimmerBar className="h-4 w-36" />
                            <ShimmerBar className="h-4 w-28" />
                        </div>
                    </div>
                    <div className="mt-5 space-y-2">
                        <ShimmerBar className="h-4 w-full" />
                        <ShimmerBar className="h-4 w-11/12" />
                        <ShimmerBar className="h-4 w-full" />
                        <ShimmerBar className="h-4 w-4/5" />
                        <ShimmerBar className="h-4 w-2/3" />
                    </div>
                    {/* Links row */}
                    <div className="mt-4 flex items-center gap-x-5">
                        <ShimmerBar className="h-3 w-10" />
                        <ShimmerBar className="h-4 w-32" />
                        <ShimmerBar className="h-4 w-40" />
                    </div>
                </div>
            ))}
        </div>
    </XMBStandaloneSkeletonShell>
);

/** Per-section shape of the /stack-and-gear skeleton below. */
const STACK_SKELETON_SECTIONS = [
    // Intro heights track the real copy's wrapping: 3 lines on mobile for
    // Stack (h-18 = 72px), 2 for Gear (h-12), one line at md (h-6).
    { cards: 6, introClassName: 'h-18 md:h-6' },
    { cards: 3, introClassName: 'h-12 md:h-6' },
] as const;

/**
 * Card-grid-shaped skeleton mirroring /stack-and-gear: centered badge +
 * title + tagline header in the page's wider max-w-6xl column, then
 * per-section heading/intro rows and StackGrid's responsive card template.
 * Used by both the route's loading boundary and the menu-navigation overlay.
 */
export const StackGearLoadingSkeleton = () => (
    <XMBStandaloneSkeletonShell
        label="Loading stack and gear"
        paddingClassName="px-6"
        columnClassName="max-w-6xl"
    >
        {/* Header — badge pill, title (text-4xl md:text-7xl), tagline. The
            tagline wraps to two lines on mobile (h-14 = 2 × 28px line boxes). */}
        <div className="mb-16 flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center gap-4">
                <ShimmerBar className="h-6 w-24" />
            </div>
            <ShimmerBar className="mb-8 h-11 w-64 md:h-22 md:w-[26rem]" />
            <ShimmerBar className="h-14 w-72 max-w-full md:h-7" />
        </div>

        {/* Stack, then Gear: section heading + intro + card grid. No section
            top margin: on the real page both h2s are :first-child
            (first:mt-0), so the inter-section gap is just the grid's my-8. */}
        {STACK_SKELETON_SECTIONS.map((section, i) => (
            <section key={i}>
                <ShimmerBar className="mb-3 h-8 w-24 md:h-9" />
                <ShimmerBar className={`w-full max-w-xl ${section.introClassName}`} />
                <div className="my-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                    {Array.from({ length: section.cards }, (_, card) => (
                        <div
                            key={card}
                            className="flex items-start gap-4 rounded-xl border border-xmb-fg/10 bg-xmb-fg/5 p-4"
                        >
                            <ShimmerBar className="size-12 shrink-0 md:size-14" />
                            <div className="min-w-0 flex-1">
                                <ShimmerBar className="h-6 w-2/5" />
                                {/* h-5 ≈ the comment's leading-relaxed line
                                    boxes, so the card matches the real ~143px. */}
                                <div className="mt-1 space-y-1.5">
                                    <ShimmerBar className="h-5 w-full" />
                                    <ShimmerBar className="h-5 w-3/4" />
                                </div>
                                <div className="mt-2.5 flex gap-1.5">
                                    <ShimmerBar className="h-5 w-12 rounded" />
                                    <ShimmerBar className="h-5 w-10 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ))}
    </XMBStandaloneSkeletonShell>
);

/** Boot-state constants for the menu skeleton, matching the live menu:
    three categories (About me, Projects, Socials) with the first content
    column active — mirroring initialCategoryIndex in the root layout — and
    itemIndex -1 (no row selected, so the category label shows and the three
    folder rows fade downward). Counts are representative; the real menu is
    data-driven. */
const MENU_SKELETON = {
    CATEGORIES: 3,
    ACTIVE_INDEX: 1,
    ROWS: 3,
} as const;

const MenuSkeletonCategoryStrip = () => (
    // One cell wide like XMBCategoryRow, so centering wrappers (paged
    // layout) center the ACTIVE cell; the strip is absolute at
    // -activeIndex cells, where the real row's containerOffset sits at boot.
    <div className="relative h-16 md:h-20" style={{ width: XMB_LAYOUT.CATEGORY_WIDTH }}>
        <div
            className="absolute top-0 flex h-full items-center"
            style={{ left: -MENU_SKELETON.ACTIVE_INDEX * XMB_LAYOUT.CATEGORY_WIDTH }}
        >
            {Array.from({ length: MENU_SKELETON.CATEGORIES }, (_, cell) => {
                const isActive = cell === MENU_SKELETON.ACTIVE_INDEX;
                const distance = Math.abs(cell - MENU_SKELETON.ACTIVE_INDEX);
                return (
                    <div
                        key={cell}
                        className="relative flex h-full flex-col items-center justify-center"
                        style={{
                            width: XMB_LAYOUT.CATEGORY_WIDTH,
                            // Same distance falloff as the real row's inactive icons.
                            opacity: isActive ? 1 : Math.max(0.3, 1 - distance * 0.3),
                        }}
                    >
                        {/* Icon stand-ins at the rendered sizes: 48px icon at
                            1.2 scale active (≈56px), 40px at 0.8 inactive (32px). */}
                        <ShimmerBar
                            className={
                                isActive
                                    ? 'size-14 rounded-2xl shadow-[0_0_20px_var(--color-xmb-shadow-glow)]'
                                    : 'size-8 rounded-xl'
                            }
                        />
                        {/* Label line under the active icon — visible at boot
                            because itemIndex is -1. The real span sits top-14
                            md:top-16 below its auto-height cell (a 48px icon
                            box centered in the strip); this cell is h-full, so
                            the offsets add the centering gap: 8px at base
                            (h-16), 16px at md (h-20). */}
                        {isActive && (
                            <ShimmerBar className="absolute top-16 h-5 w-20 md:top-20" />
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

/**
 * Menu-shaped skeleton mirroring the home XMB at boot: real header, category
 * icon strip with the active cell enlarged + labeled, thumbnail/title rows
 * fading downward (nothing selected), and the command-bar pill. No frosted
 * backdrop and no XMBContentLayout gradient — the real menu sits directly on
 * the WebGL background, so the skeleton must too or the swap flashes. Used
 * by the root loading boundary and skeletonForHref('/') in LayoutWrapper.
 */
export const XMBMenuLoadingSkeleton = () => (
    <div className="fixed inset-0 overflow-hidden font-sans text-xmb-fg">
        {/* The real header, not a shimmer: XMBInterface renders this same
            component at the same offsets, so the masthead never jumps. Kept
            OUTSIDE the role=status region — the ticking clock would chatter
            inside an atomic live region. */}
        <XMBHeader />

        <div role="status" aria-label="Loading menu">
            <span className="sr-only">Loading menu</span>

            {/* Full layout — XMBInterface flips layouts with a ResizeObserver
                at 1024px; lg: matches that threshold statically. */}
            <div className="absolute left-[15%] top-[30%] hidden overflow-visible lg:block">
                <MenuSkeletonCategoryStrip />
                {/* VERTICAL_LIST_TOP (8rem) = the real list's top 4rem +
                    margin-top 4rem; width pinned like the real column. */}
                <div
                    className="absolute left-0"
                    style={{ top: XMB_LAYOUT.VERTICAL_LIST_TOP, width: XMB_LAYOUT.LIST_FULL_WIDTH_PX }}
                >
                    {Array.from({ length: MENU_SKELETON.ROWS }, (_, row) => (
                        <div
                            key={row}
                            className="mb-6 flex w-full items-center gap-3 rounded-lg px-3 py-3 md:mb-8 md:gap-4 md:px-4 md:py-4"
                            // Same downward falloff as XMBListItem with nothing selected.
                            style={{ opacity: Math.max(0.25, 0.7 - row * 0.1) }}
                        >
                            <ShimmerBar className="h-10 w-16 shrink-0 rounded border border-xmb-fg/10 md:h-14 md:w-24" />
                            <ShimmerBar className="h-6 w-2/3 md:h-7" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Paged layout — boot state is the centered categories stage
                (itemIndex -1, empty path), so no list here. */}
            <div className="absolute inset-x-0 top-[30%] flex justify-center lg:hidden">
                <MenuSkeletonCategoryStrip />
            </div>

            {/* Command-bar pill at XMBCommandBar's exact offsets and chrome;
                two hint groups matching the boot hints (Switch / Enter). */}
            <div className="absolute inset-x-0 bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-30 flex justify-center">
                <div className="flex items-center gap-5 rounded-full border border-xmb-fg/15 bg-xmb-fg/5 px-5 py-2.5 shadow-[0_8px_30px_var(--color-xmb-shadow-glow)] backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <ShimmerBar className="size-6 rounded-md" />
                            <ShimmerBar className="size-6 rounded-md" />
                        </div>
                        <ShimmerBar className="h-3 w-12" />
                    </div>
                    <div className="flex items-center gap-2">
                        <ShimmerBar className="size-6 rounded-md" />
                        <ShimmerBar className="h-3 w-10" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default XMBLoadingSkeleton;
