// src/components/xmb/XMBCategoryRow.tsx
'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import type { XMBCategory } from '@/lib/xmb-types';
import XMBIcon from './XMBIcon';
import { XMB_LAYOUT, XMB_ANIMATION, EASE } from '@/lib/xmb-constants';

interface XMBCategoryRowProps {
  categories: XMBCategory[];
  categoryIndex: number;
  onCategorySelect: (index: number) => void;
  /** True during a pointer press: focus events it causes must not drive selection. */
  isPointerEvent?: () => boolean;
}

// ---------------------------------------------------------------------------
// Icon pose falloffs.
//
// Scale and opacity of every cell are pure functions of
// (index − categoryIndex) at rest. On a category switch each cell CROSSFADES
// from its previous rest pose to its new one, driven by ONE `progress`
// motion value (0 → 1) that the row animates — so a switch still costs a
// single animation instead of one per icon per property, and cells whose
// pose doesn't change (from == to) derive a constant and hold perfectly
// still.
//
// An earlier model swept a continuous cursor through these falloffs, which
// made every icon BETWEEN the old and new selection pulse 0.8→1.2→0.8 on
// multi-step switches (routine: ArrowLeft at index 0 wraps to the far end).
// The crossfade instead reproduces the old per-icon animate-prop retargets:
// only the outgoing and incoming icons move, tweening over the same 300ms.

/** Discrete scale at an integer delta: 1.2 on the active cell, 0.8 elsewhere. */
function iconScaleAt(delta: number): number {
  return delta === 0 ? 1.2 : 0.8;
}

/** Discrete opacity at an integer delta: 1 on the active cell (the falloff
    itself lands there — the old isActive branch was the same value), fading
    0.3 per step of distance down to a 0.3 floor. */
function iconOpacityAt(delta: number): number {
  return Math.max(0.3, 1 - Math.abs(delta) * 0.3);
}

interface XMBCategoryCellProps {
  category: XMBCategory;
  index: number;
  /** Crossfade progress (0 → 1) of the latest category switch — cells
      derive scale/opacity from it via useTransform, so the blend writes
      straight to the DOM and never re-renders them mid-flight. */
  progress: MotionValue<number>;
  /** Rest-pose pair being blended: the cell sits at poseAt(index − prevIndex)
      at progress 0 and poseAt(index − activeIndex) at progress 1. */
  prevIndex: number;
  activeIndex: number;
  /** Active cell: show the floating title (persistent — it stays up while
      an item is selected; the item lane sits below it). */
  showTitle: boolean;
  onCategorySelect: (index: number) => void;
  /** True during a pointer press: focus events it causes must not drive selection. */
  isPointerEvent?: () => boolean;
}

const XMBCategoryCell = React.memo(({
  category,
  index,
  progress,
  prevIndex,
  activeIndex,
  showTitle,
  onCategorySelect,
  isPointerEvent,
}: XMBCategoryCellProps) => {
  const isActive = index === activeIndex;
  // Linear blend between the two rest poses. At progress 1 this equals the
  // discrete pose map exactly; when from == to (every icon not part of the
  // switch) the blend is constant, so intermediate icons never ripple.
  const scaleFrom = iconScaleAt(index - prevIndex);
  const scaleTo = iconScaleAt(index - activeIndex);
  const opacityFrom = iconOpacityAt(index - prevIndex);
  const opacityTo = iconOpacityAt(index - activeIndex);
  const scale = useTransform(progress, (p: number) => scaleFrom + (scaleTo - scaleFrom) * p);
  const opacity = useTransform(progress, (p: number) => opacityFrom + (opacityTo - opacityFrom) * p);

  return (
    <div
      role="tab"
      aria-selected={isActive}
      aria-label={category.title}
      id={`xmb-category-${index}`}
      tabIndex={isActive ? 0 : -1}
      className="flex flex-col items-center gap-2 cursor-pointer relative focus-visible:outline-none"
      style={{ width: `${XMB_LAYOUT.CATEGORY_WIDTH}px` }}
      onClick={() => {
        // Sound is owned by handleCategorySelect (navigate on switch,
        // confirm when entering the active category's list).
        onCategorySelect(index);
      }}
      // No element-level Enter/Space handler: the window dispatcher in
      // useXMBNavigation owns those keys (this div is not a native
      // activation target, so its guard lets them through).
      onFocus={() => {
        // Pointer-driven focus (Chrome focuses on mousedown) defers to
        // onClick, which owns sounds and the enter-list behavior on
        // the active tab; keyboard/AT focus syncs the selection.
        if (isPointerEvent?.()) return;
        if (!isActive) onCategorySelect(index);
      }}
    >
      {/* Icon scale/opacity are cursor-driven motion values (falloffs
          above). transition-[filter] fades the active drop-shadow in/out
          (filter interpolates from none via zeroed drop-shadow values)
          instead of popping it discretely on the switch frame. */}
      <motion.div
        style={{ scale, opacity }}
        className={`relative z-10 transition-[filter] duration-150 ${isActive ? 'drop-shadow-[0_0_15px_var(--color-xmb-glow)]' : ''}`}
      >
        <XMBIcon
          name={category.iconName}
          size={isActive ? 48 : 40}
          className={`transition-colors duration-150 ${isActive ? 'text-xmb-fg' : 'text-xmb-fg/70 hover:text-xmb-fg/90'}`}
        />
      </motion.div>

      {/* Category title — always up for the active cell (XMB keeps the
          column's name visible while browsing its items); enters/exits only
          on category switches via this AnimatePresence. */}
      <AnimatePresence>
        {showTitle && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.12, ease: EASE.ENTER }}
            className="text-base md:text-lg font-medium whitespace-nowrap absolute top-14 md:top-16 pointer-events-none"
          >
            {category.title}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});

XMBCategoryCell.displayName = 'XMBCategoryCell';

const XMBCategoryRow = React.memo(({
  categories,
  categoryIndex,
  onCategorySelect,
  isPointerEvent,
}: XMBCategoryRowProps) => {
  // Calculate the container offset to center the active category
  const containerOffset = -categoryIndex * XMB_LAYOUT.CATEGORY_WIDTH;

  // (prevIndex, activeIndex) rest-pose pair for the cells' crossfade,
  // adjusted during render (React's derive-state-from-props pattern) so the
  // commit that changes categoryIndex delivers a coherent pair to every
  // cell — a ref can't do this, since refs must not be read mid-render.
  const [indices, setIndices] = useState({ prev: categoryIndex, active: categoryIndex });
  if (indices.active !== categoryIndex) {
    setIndices({ prev: indices.active, active: categoryIndex });
  }

  // ONE `progress` motion value drives every cell's scale/opacity crossfade
  // (each cell blends its previous → active rest pose through it, see the
  // falloff block above), so a category switch retargets a single animation
  // instead of one per icon per property — cells re-render once per switch
  // to receive the new pose pair, then the blend runs without them. TWEEN
  // is the shipped 300ms ease-out made honest (the old ICON_SPRING config
  // never sprang — see XMB_ANIMATION): imperative animate() and the old
  // per-icon transition prop share motion's animateMotionValue resolution,
  // so the two icons that move tween exactly like they used to. Accepted
  // micro-delta: interrupting a switch mid-flight restarts the blend from
  // the previous REST pose rather than the mid-flight value (the old
  // per-icon retargets continued from the current value). Imperative
  // animate() bypasses MotionConfig's reducedMotion, so it gates itself:
  // reduced motion jumps straight to the new pose.
  const progress = useMotionValue(1);
  const reduceMotion = useReducedMotion();
  const blendedIndicesRef = useRef(indices);
  useLayoutEffect(() => {
    const isNewBlend = blendedIndicesRef.current !== indices;
    blendedIndicesRef.current = indices;
    if (reduceMotion) {
      progress.jump(1);
      return;
    }
    // Not a switch (e.g. reduce-motion flipped off mid-session): stay at rest.
    if (!isNewBlend) return;
    progress.jump(0);
    animate(progress, 1, { ...XMB_ANIMATION.TWEEN });
  }, [indices, progress, reduceMotion]);

  // Halt any in-flight crossfade when the row unmounts.
  useEffect(() => () => progress.stop(), [progress]);

  return (
    // Idle vertical drift lives in CSS (xmb-row-sway) so the 8s ambient loop
    // runs on the compositor instead of motion's rAF loop — and so the sway
    // transform can't fight the strip's motion-driven x spring below.
    <div
      className="relative z-10 h-16 md:h-20 overflow-visible xmb-row-sway"
      role="tablist"
      aria-label="XMB Categories"
      // One cell wide, so centering wrappers (paged layout) center the
      // ACTIVE cell — the sliding strip is absolute and would otherwise
      // give this element zero width, landing the active icon ~half a
      // cell right of screen center.
      style={{ width: XMB_LAYOUT.CATEGORY_WIDTH }}
    >
      {/* Glow behind the active category. The active cell always lands at this
          wrapper's own box (the strip translates beneath it), so one persistent
          element here replaces the per-cell layoutId FLIP — no layout
          measurement inside the transform-animating strip on switch. h-12
          matches the active icon's 48px cell content box. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-full pointer-events-none"
      >
        {/* Breathing pulse as a CSS keyframe animation (opacity/scale only)
            so it stays on the compositor; reduced-motion gating in globals.css */}
        <div
          className="absolute inset-0 rounded-full xmb-glow-pulse"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-xmb-fg) 18%, transparent), transparent 55%)' }}
        />
      </div>

      {/* Sliding container - only ONE animation instead of N */}
      <motion.div
        className="absolute left-0 top-0 flex items-center h-full"
        animate={{ x: containerOffset }}
        transition={XMB_ANIMATION.TWEEN}
        style={{ willChange: 'transform' }}
      >
        {categories.map((category, idx) => (
          <XMBCategoryCell
            key={category.id}
            category={category}
            index={idx}
            progress={progress}
            prevIndex={indices.prev}
            activeIndex={indices.active}
            showTitle={idx === categoryIndex}
            onCategorySelect={onCategorySelect}
            isPointerEvent={isPointerEvent}
          />
        ))}
      </motion.div>
    </div>
  );
});

XMBCategoryRow.displayName = 'XMBCategoryRow';

export default XMBCategoryRow;
