// src/components/xmb/XMBCategoryRow.tsx
'use client';

import React, { useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import type { XMBCategory } from '@/lib/xmb-types';
import XMBIcon from './XMBIcon';
import { XMB_LAYOUT, XMB_ANIMATION, EASE } from '@/lib/xmb-constants';

interface XMBCategoryRowProps {
  categories: XMBCategory[];
  categoryIndex: number;
  itemIndex: number;
  onCategorySelect: (index: number) => void;
  /** True during a pointer press: focus events it causes must not drive selection. */
  isPointerEvent?: () => boolean;
}

// ---------------------------------------------------------------------------
// Icon pose falloffs.
//
// Scale and opacity of every cell are pure functions of
// (index − categoryIndex), so instead of retargeting one animation per icon
// per property on every switch, the row animates ONE `cursor` motion value
// and each cell maps it through these falloffs with useTransform.
//
// The *At functions are the old discrete per-icon targets, verbatim, at
// integer deltas; `sampleIconSteps` interpolates linearly between adjacent
// integer samples, which keeps a one-step switch pixel-identical to the old
// per-icon retargets (the same linearity argument spelled out in
// XMBVerticalList's falloff block).

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

/** Piecewise-linear read of a discrete integer-delta map at a continuous
    cursor position. */
function sampleIconSteps(at: (delta: number) => number, delta: number): number {
  const floor = Math.floor(delta);
  const from = at(floor);
  const t = delta - floor;
  return t === 0 ? from : from + (at(floor + 1) - from) * t;
}

interface XMBCategoryCellProps {
  category: XMBCategory;
  index: number;
  /** Continuous category cursor — cells derive scale/opacity from
      (index − cursor) via useTransform, so cursor motion writes straight to
      the DOM and never re-renders them. */
  cursor: MotionValue<number>;
  isActive: boolean;
  /** Active cell with no item selected: show the floating title. */
  showTitle: boolean;
  onCategorySelect: (index: number) => void;
  /** True during a pointer press: focus events it causes must not drive selection. */
  isPointerEvent?: () => boolean;
}

const XMBCategoryCell = React.memo(({
  category,
  index,
  cursor,
  isActive,
  showTitle,
  onCategorySelect,
  isPointerEvent,
}: XMBCategoryCellProps) => {
  const scale = useTransform(cursor, (c: number) => sampleIconSteps(iconScaleAt, index - c));
  const opacity = useTransform(cursor, (c: number) => sampleIconSteps(iconOpacityAt, index - c));

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

      {/* Category title - only show when active and no item selected */}
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
  itemIndex,
  onCategorySelect,
  isPointerEvent,
}: XMBCategoryRowProps) => {
  // Calculate the container offset to center the active category
  const containerOffset = -categoryIndex * XMB_LAYOUT.CATEGORY_WIDTH;

  // ONE cursor motion value drives every cell's scale/opacity (each cell
  // maps it through the falloffs above), so a category switch retargets a
  // single animation instead of one per icon per property — and cells don't
  // re-render at all while it's in flight. ICON_SPRING is passed VERBATIM
  // (no added `type`): imperative animate() and the old per-icon transition
  // prop share motion's animateMotionValue resolution, so whatever that
  // config resolves to, the cursor moves exactly like the icons used to.
  // Imperative animate() bypasses MotionConfig's reducedMotion, so it gates
  // itself: reduced motion jumps instead of animating.
  const cursor = useMotionValue(categoryIndex);
  const reduceMotion = useReducedMotion();
  useLayoutEffect(() => {
    if (reduceMotion) {
      cursor.jump(categoryIndex);
      return;
    }
    animate(cursor, categoryIndex, { ...XMB_ANIMATION.ICON_SPRING });
  }, [categoryIndex, cursor, reduceMotion]);

  // Halt any in-flight cursor animation when the row unmounts.
  useEffect(() => () => cursor.stop(), [cursor]);

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
        transition={XMB_ANIMATION.LIST_SPRING}
        style={{ willChange: 'transform' }}
      >
        {categories.map((category, idx) => (
          <XMBCategoryCell
            key={category.id}
            category={category}
            index={idx}
            cursor={cursor}
            isActive={idx === categoryIndex}
            showTitle={idx === categoryIndex && itemIndex === -1}
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
