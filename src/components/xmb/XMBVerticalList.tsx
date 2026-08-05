// src/components/xmb/XMBVerticalList.tsx
"use client";

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { motion, animate, useAnimationControls, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRouter } from "next/navigation";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import type { XMBCategory, XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import XMBBackPill from "./XMBBackPill";
import { XMB_LAYOUT, XMB_ANIMATION, EASE, XMB_SHAKE } from "@/lib/xmb-constants";
import { activateItem, isExternalLink } from "@/lib/xmb-navigation";
import { isStandaloneDocRoute } from "@/lib/xmb-routes";
import { focusListSibling } from "@/lib/focus";
import { playNavigate, playConfirm } from "@/hooks/useKeyAudioFx";
import type { RestrictedPing } from "./XMBRestrictedToast";

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
    /** Restricted item activated by click: shake + toast owner. */
    onRestricted?: (item: XMBItem, index: number) => void;
    /** Latest deny ping — the matching row runs the shake. */
    restrictedPing?: RestrictedPing | null;
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
    /** Continuous selection cursor — rows derive lift/opacity from
        (index − cursor) via useTransform, so cursor motion writes straight
        to the DOM and never re-renders them. */
    cursor: MotionValue<number>;
    /** 1 while some row is selected, 0 at category level (itemIndex −1).
        Animated by the parent with the same transition as the cursor so the
        row-0 crossfade (1 ⇄ 0.7) keeps its old animate-prop timing. */
    selection: MotionValue<number>;
    isItemSelected: boolean;
    /** False only at category level (itemIndex −1). */
    hasSelection: boolean;
    /** In-folder context sidebar: rows are inert and unfocusable. */
    isContextView: boolean;
    /** First click / keyboard focus: move the cursor to this row. */
    onRowSelect: (index: number) => void;
    /** Second click on the selected row (folders/actions): activate it. */
    onRowActivate: (index: number) => void;
    /** Keyboard/AT focus landed on this row: sync the selection cursor. */
    onRowFocus: (index: number) => void;
    /** Registers/unregisters this row's DOM node for offset measurement. */
    onRowNode: (id: string, node: HTMLElement | null) => void;
    /** 0 when this row isn't the deny target; bumps to re-run the shake. */
    shakeNonce: number;
    /** Shows the loading skeleton ahead of internal link navigation. */
    startNavigation: (href?: string) => void;
}

// ---------------------------------------------------------------------------
// Row pose falloffs.
//
// Every row's lift and opacity are pure functions of (index − selectedIndex),
// so instead of retargeting one animation per row per property on every
// cursor move (~2N per keypress), the list animates ONE `cursor` motion value
// and each row maps it through these falloffs with useTransform.
//
// The *At functions are the old discrete per-row targets, verbatim, defined
// at integer deltas; `sampleRowSteps` interpolates linearly between adjacent
// integer samples. That linearity is what keeps single-step moves
// pixel-identical to the old per-row retargets: the old animation moved each
// property as v(t) = a + (b − a)·p(t) for the shared transition's progress
// p, and the cursor — driven by that same transition over a distance of one
// step — makes d(t) sweep so a linear segment reproduces exactly
// a + (b − a)·p(t). (A closed-form continuous falloff would drift mid-flight
// wherever the discrete map is non-linear: the 0.62^n above-fade and both
// opacity floors.)

/** Discrete lift (px) at an integer delta — rows above the selection rise
    into the narrow lane above the active row so they don't collide with its
    highlight / description (72px clearance + 10px per additional step). */
function rowLiftAt(delta: number): number {
    return delta < 0
        ? XMB_LAYOUT.TITLE_ROW_CLEARANCE_PX + Math.max(0, -delta - 1) * XMB_LAYOUT.ABOVE_ROW_STACK_STEP_PX
        : 0;
}

/** Discrete opacity at an integer delta while a row is selected: 1 on the
    selection, 0.42·0.62^(n−1) (floored at 0.1) above it, 0.7 − 0.1n
    (floored at 0.25) below it. Opacity falloff carries the depth cue; we
    deliberately skip per-item scale / x-shift so the only motion between
    selections is the container slide, the above-row lift, and the highlight
    crossfade. */
function rowSelectedOpacityAt(delta: number): number {
    if (delta === 0) return 1;
    return delta < 0
        ? Math.max(0.1, 0.42 * Math.pow(0.62, -delta - 1))
        : Math.max(0.25, 0.7 - delta * 0.1);
}

/** Discrete opacity at an integer delta with NO selection (itemIndex −1, the
    cursor parked on row 0): the old code fell into the "below" branch for
    every row — 0.7 on row 0 itself, then 0.6, 0.5, … (The max(0, delta)
    clamp only guards transient sub-zero deltas mid-flight; at rest no row
    sits above the parked cursor.) */
function rowIdleOpacityAt(delta: number): number {
    return Math.max(0.25, 0.7 - Math.max(0, delta) * 0.1);
}

/** Piecewise-linear read of a discrete integer-delta map at a continuous
    cursor position. */
function sampleRowSteps(at: (delta: number) => number, delta: number): number {
    const floor = Math.floor(delta);
    const from = at(floor);
    const t = delta - floor;
    return t === 0 ? from : from + (at(floor + 1) - from) * t;
}

const XMBListItem = React.memo(
    ({ item, index, cursor, selection, isItemSelected, hasSelection, isContextView, onRowSelect, onRowActivate, onRowFocus, onRowNode, shakeNonce, startNavigation }: XMBListItemProps) => {
        const [imgError, setImgError] = useState(false);
        const reduceMotion = useReducedMotion();
        const isFolder = item.type === 'folder';

        // Rows that navigate render as real links (SPA <Link> internally,
        // <a target=_blank> externally) so middle-click, context menus, and
        // assistive tech all get genuine link semantics; folders and action
        // items render as <button>. Restricted rows must NOT be anchors —
        // activation denies instead of navigating, and an anchor would
        // follow its href natively.
        const isLinkRow = !!item.link && !item.action && !isFolder && !item.restricted;
        const isExternal = isLinkRow && isExternalLink(item.link!);
        // Standalone doc routes are tiny static payloads — keep Next's default
        // viewport prefetch so their loading skeleton never shows in production.
        // Post links stay opted out so a list can't bulk-fetch every
        // /[type]/[slug] payload (prefetch={false} also disables hover).
        const prefetch = isLinkRow && !isExternal && isStandaloneDocRoute(item.link!) ? undefined : false;

        // Deny shake: replays whenever the parent bumps this row's nonce.
        // Edge-triggered — the ref starts at the mount value, so a row that
        // remounts with a stale ping (folder exit/re-entry, layout switch)
        // never replays a ghost shake.
        const shakeControls = useAnimationControls();
        const lastShakeNonceRef = useRef(shakeNonce);
        useEffect(() => {
            if (shakeNonce === lastShakeNonceRef.current) return;
            lastShakeNonceRef.current = shakeNonce;
            if (shakeNonce > 0 && !reduceMotion) {
                shakeControls.start({ x: XMB_SHAKE.KEYFRAMES }, XMB_SHAKE.TRANSITION);
            }
        }, [shakeNonce, reduceMotion, shakeControls]);

        // Roving tabindex: the selected row is the list's one tab stop; with
        // nothing selected yet, row 0 is the Tab entry point (focusing it
        // selects it via onRowFocus). Context-view rows are never tabbable.
        const tabIndex = isContextView
            ? -1
            : isItemSelected || (!hasSelection && index === 0)
            ? 0
            : -1;

        // Stable-identity node registrar: an inline callback ref from the
        // parent would mint a new identity every parent render, and memo's
        // bailout also compares the ref — voiding it on every keypress.
        const registerNode = useCallback((node: HTMLElement | null) => {
            onRowNode(item.id, node);
        }, [onRowNode, item.id]);

        // Pose = falloff(index − cursor), read via useTransform so cursor
        // motion updates the DOM directly — this row never re-renders while
        // the cursor is in flight. `selection` blends between the idle and
        // selected opacity maps (and gates the lift) so entering/leaving the
        // list (itemIndex −1 ⇄ 0) crossfades row 0 exactly as the old
        // animate-prop retarget did. Visual treatment is identical
        // regardless of `isContextView` — that prop only controls
        // interactivity (pointer-events) so the in-folder parent list reuses
        // the same look as the top-level list.
        const y = useTransform([cursor, selection], (latest: number[]) => {
            const [c, s] = latest;
            return -sampleRowSteps(rowLiftAt, index - c) * s;
        });
        const opacity = useTransform([cursor, selection], (latest: number[]) => {
            const [c, s] = latest;
            const delta = index - c;
            const idle = sampleRowSteps(rowIdleOpacityAt, delta);
            return idle + (sampleRowSteps(rowSelectedOpacityAt, delta) - idle) * s;
        });

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
            if (item.restricted) {
                // Deny: activateItem routes to the restricted handler, which
                // owns the sound, shake, and toast — no confirm bloom.
                e.preventDefault();
                onRowActivate(index);
                return;
            }
            playConfirm();
            if (isLinkRow) {
                // The anchor performs the navigation natively: <Link> pushes
                // the route, external <a> opens its tab. No preventDefault.
                if (!isExternal) {
                    startNavigation(item.link!);
                }
                return;
            }
            e.preventDefault();
            onRowActivate(index);
        };

        const handleFocus = (): void => onRowFocus(index);

        // Tab walks the list: the adjacent row takes focus loudly (ring
        // shows — browser-style traversal) and selection follows via
        // onFocus; at either end the default action exits the list so
        // keyboard users are never trapped (2.1.2). Arrows remain the
        // silent, selection-styled path.
        const handleTabKeyDown = (e: React.KeyboardEvent<HTMLElement>): void => {
            if (e.key !== 'Tab') return;
            if (focusListSibling('xmb-item-', index, e.shiftKey ? -1 : 1)) {
                e.preventDefault();
                playNavigate();
            }
        };

        // Tab (above) is the one element-level key handler. No Enter/Space
        // handler: links and buttons activate natively (the window
        // dispatcher's guard stands down for them), so exactly one
        // activation fires per keypress.
        const rowClassName = 'relative block w-full cursor-pointer mb-6 md:mb-8 focus-visible:outline-none overflow-visible';
        const sharedProps: React.HTMLAttributes<HTMLElement> = {
            role: 'option',
            'aria-selected': isItemSelected,
            id: `xmb-item-${index}`,
            className: rowClassName,
            style: { contain: 'layout style' },
            onClick: handleClick,
            onFocus: handleFocus,
            onKeyDown: handleTabKeyDown,
            tabIndex,
        };

        const content = (
            <motion.div animate={shakeControls}>
                {/* Item lift/opacity are cursor-driven motion values (see the
                    falloffs above) with the highlight chrome swapped by
                    class. */}
                <motion.div
                    className={`flex items-center gap-3 md:gap-4 w-full py-3 md:py-4 px-3 md:px-4 rounded-lg xmb-row-chrome ${
                        isItemSelected
                            ? "bg-xmb-fg/20 ring-1 ring-xmb-fg/40 shadow-[0_0_20px_var(--color-xmb-shadow-glow)]"
                            : "hover:bg-xmb-fg/5"
                    }`}
                    style={{ y, opacity }}
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
                            {/* Pre-activation cue for AT: restricted rows
                                otherwise announce identically to openable
                                ones (WCAG 4.1.2 name/role clarity). */}
                            {item.restricted && (
                                <span className="sr-only"> — under wraps, activate for info</span>
                            )}
                            {/* External rows carry a chain-link badge; the
                                caret matches the folder affordance (in the
                                title line while unselected, parked on the
                                card edge while selected). The sr-only span
                                on the anchor announces "opens in new tab" —
                                these are decorative. */}
                            {isExternal && <XMBIcon name="Link" size={18} />}
                            {(isFolder || isExternal) && !isItemSelected && (
                                <XMBIcon name="CaretRight" size={18} />
                            )}
                        </div>
                        {/* Deliberately unanimated: an entrance would tween
                            height 0→auto, forcing a column reflow per frame
                            right when the list mounts with row 0 selected,
                            and the paged back-out unmount is already covered
                            by the stage's 0.12s fade. Plain element opacity:
                            stacking 0.6 on the /60 color token landed at
                            ~0.36 effective (~3.2:1, a WCAG AA failure); /70
                            alone is ~9.7:1. */}
                        {isItemSelected && item.description && (
                            <p className="text-xs md:text-sm text-xmb-fg/70 mt-1 line-clamp-2">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* Selected folders and external links park the
                        disclosure caret on the card's right edge (it leaves
                        the title line while selected so the title keeps the
                        width). No AnimatePresence/exit: both caret slots hang
                        off the same isItemSelected boolean, so the swap must
                        land in one commit — an exit kept this caret in flex
                        flow (sync mode) while the title-line caret had already
                        mounted, and the double-caret row squeezed the truncate
                        span into a transient ellipsis. The mount glide
                        (initial → animate) still runs. */}
                    {isItemSelected && (isFolder || isExternal) && (
                        <motion.div
                            key="drill-caret"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18, ease: EASE.ENTER }}
                            className="shrink-0 pr-1"
                            aria-hidden="true"
                        >
                            {/* CSS keyframe (xmb-caret-nudge, reduced-motion
                                gated in globals.css) — the old motion loop
                                held the entire frameloop awake whenever a
                                folder/external row sat selected. */}
                            <div className="xmb-caret-nudge">
                                <XMBIcon name="CaretRight" size={18} />
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        );

        if (isLinkRow && !isExternal) {
            return (
                <Link href={item.link!} prefetch={prefetch} ref={registerNode} {...sharedProps}>
                    {content}
                </Link>
            );
        }
        if (isLinkRow) {
            return (
                <a href={item.link} target="_blank" rel="noopener noreferrer" ref={registerNode} {...sharedProps}>
                    {content}
                    <span className="sr-only"> (opens in new tab)</span>
                </a>
            );
        }
        return (
            <button type="button" ref={registerNode} {...sharedProps} className={`${rowClassName} text-left`}>
                {content}
            </button>
        );
    },
);

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
        onRestricted,
        restrictedPing,
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
                onRestricted,
            });
        }, [currentItems, onFolderDrill, onRestricted, router, startNavigation]);

        // Keyboard/AT focus landed on a row: sync the selection cursor.
        // Pointer-driven focus defers to onClick (the two-click model); the
        // idempotence check keeps the index→focus sync from echoing back.
        // The check reads itemIndex through a ref so this callback keeps ONE
        // identity for the life of the list — closing over itemIndex would
        // mint a new callback per keypress and re-render every memoized row
        // just to refresh a guard value.
        const itemIndexRef = useRef(itemIndex);
        useLayoutEffect(() => {
            itemIndexRef.current = itemIndex;
        });
        const handleRowFocus = useCallback((idx: number) => {
            if (isPointerEvent?.()) return;
            if (idx !== itemIndexRef.current) onItemSelect(idx);
        }, [isPointerEvent, onItemSelect]);

        const hasSelection = itemIndex !== -1;
        const displayIndex = itemIndex === -1 ? 0 : itemIndex;

        // Row DOM nodes, keyed by item.id. Index keys would alias across
        // content swaps (category switches replace the item set in place),
        // letting a measurement read a stale node from the previous list.
        // Written only from callback refs (React Compiler safe); entries are
        // deleted on the null cleanup call so the map never holds unmounted
        // nodes.
        const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
        const columnRef = useRef<HTMLDivElement | null>(null);

        // Single stable registrar the rows call from their own callback
        // refs. (An inline ref attached here would change identity every
        // render and void the rows' memo bailout — memo compares the ref
        // alongside props.)
        const handleRowNode = useCallback((id: string, node: HTMLElement | null) => {
            if (node) {
                rowRefs.current.set(id, node);
            } else {
                rowRefs.current.delete(id);
            }
        }, []);

        // Measured slide offset for the column. Row pitch is content-driven
        // (responsive padding/margins, description expansion), so it must be
        // read from the DOM rather than a constant — a fixed per-row step
        // drifts further from the focus anchor with every index. offsetTop
        // ignores CSS transforms, so the above-row lift translate (rowLiftAt)
        // on earlier rows never pollutes the measurement.
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
        // resizes AND the selected row's description mounting/unmounting
        // (it appears and collapses instantly, shifting lower rows).
        // Retargeting the y tween mid-flight is fine in motion.
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

        // The column's slide is a motion value for the same reason as the
        // entrance above: animate-prop retargeting is applied from motion's
        // rAF loop AFTER the swap commit paints, so even with the snap
        // phase's duration-0 transition a category switch painted the
        // incoming list for a frame or two at the outgoing list's scroll
        // offset. jump() lands the reset in the same commit. Selection
        // moves within a list keep the shared TWEEN; imperative animate()
        // bypasses MotionConfig's reducedMotion, so this gates itself.
        const columnY = useMotionValue(containerOffset);
        useLayoutEffect(() => {
            if (columnPhase === 'snap' || reduceMotion) {
                columnY.jump(containerOffset);
                return;
            }
            animate(columnY, containerOffset, { ...XMB_ANIMATION.TWEEN });
        }, [columnPhase, columnY, containerOffset, reduceMotion]);

        // ONE cursor motion value drives every row's lift/opacity (each row
        // maps it through the falloffs at the top of this file), so a
        // selection move retargets a single animation instead of one per row
        // per property — and rows don't re-render at all while it's in
        // flight. `selectionLevel` (1 = a row is selected, 0 = category
        // level) rides the same transition so the row-0 idle⇄selected
        // crossfade keeps its old animate-prop timing.
        const cursor = useMotionValue(displayIndex);
        const selectionLevel = useMotionValue(hasSelection ? 1 : 0);

        // Category id + folder path identifies the rendered level: category
        // switches AND folder drills/backs change it. (Item ids are NOT
        // globally unique — type-slug ids repeat across the Featured/tag/
        // Recent/All folders — so keying on the first item's id could alias
        // two different levels and let the cursor sweep across freshly
        // remounted rows.)
        const prevListKeyRef = useRef<string | null>(null);
        const listKey = `${activeCategory.id}:${navigationPath.join('/')}`;

        // A level swap must land the cursor pose DURING RENDER, not in the
        // layout effect below. The swap commit mounts fresh rows (new
        // item.id keys), and each row bakes its initial style from
        // cursor/selectionLevel synchronously in its own render — so the
        // values have to be at their targets before the rows render, which
        // parent-before-child render order gives us here. A jump() deferred
        // to the layout effect never reaches those rows: their useTransform
        // subscriptions are created in the same commit and the scheduled
        // recompute is dropped (verified: cursor/selectionLevel land on
        // their targets while every new row's derived pose stays stale), so
        // the incoming list sat permanently in the outgoing list's pose —
        // row 0 lifted and dimmed as if the old selection still existed —
        // until the next selection change re-rendered the rows. Idempotent
        // under StrictMode's double render: the ref only advances in the
        // layout effect, after both renders.
        if (prevListKeyRef.current !== listKey) {
            cursor.jump(displayIndex);
            selectionLevel.jump(hasSelection ? 1 : 0);
        }

        // Both values are retargeted with the shared TWEEN — the honest
        // form of the 300ms ease-out these values have always shipped with
        // (the old LIST_SPRING config never sprang; see XMB_ANIMATION).
        // Imperative animate() and the old per-row transition prop share
        // motion's animateMotionValue resolution, so the cursor moves
        // exactly like the rows used to. Imperative animate() bypasses
        // MotionConfig's reducedMotion (see the entrance above), so reduced
        // motion jumps here instead.
        useLayoutEffect(() => {
            const isListSwap = prevListKeyRef.current !== listKey;
            prevListKeyRef.current = listKey;
            const selectionTarget = hasSelection ? 1 : 0;
            if (isListSwap || reduceMotion) {
                // The render-phase jump above already landed the swap pose;
                // re-asserting is a no-op there. This branch is load-bearing
                // only for reduced motion, where in-list moves snap too.
                cursor.jump(displayIndex);
                selectionLevel.jump(selectionTarget);
                return;
            }
            animate(cursor, displayIndex, { ...XMB_ANIMATION.TWEEN });
            animate(selectionLevel, selectionTarget, { ...XMB_ANIMATION.TWEEN });
        }, [cursor, displayIndex, hasSelection, listKey, reduceMotion, selectionLevel]);

        // Halt any in-flight cursor animation when the list unmounts.
        useEffect(() => () => {
            cursor.stop();
            selectionLevel.stop();
            columnY.stop();
        }, [columnY, cursor, selectionLevel]);

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
                                // Tokened: without a transition these chrome
                                // fades fell to motion's ~0.3s defaults and
                                // visibly lagged the stage's 0.12s entrance.
                                transition={{ duration: 0.15, ease: EASE.MOVE }}
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
                                transition={{ duration: 0.15, ease: EASE.MOVE }}
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
                            y: columnY,
                        }}
                    >
                        {currentItems.map((item, idx) => (
                            <XMBListItem
                                key={item.id}
                                index={idx}
                                item={item}
                                cursor={cursor}
                                selection={selectionLevel}
                                isItemSelected={idx === itemIndex}
                                hasSelection={hasSelection}
                                isContextView={isContextView}
                                onRowSelect={handleRowSelect}
                                onRowActivate={handleRowActivate}
                                onRowFocus={handleRowFocus}
                                onRowNode={handleRowNode}
                                shakeNonce={restrictedPing?.id === item.id ? restrictedPing.nonce : 0}
                                startNavigation={startNavigation}
                            />
                        ))}
                    </motion.div>
                    </div>
                </div>
            </motion.div>
        );
    },
);

XMBVerticalList.displayName = "XMBVerticalList";

export default XMBVerticalList;
