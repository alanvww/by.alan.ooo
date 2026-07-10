// src/components/xmb/XMBCategoryRow.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { XMBCategory } from '@/lib/xmb-types';
import XMBIcon from './XMBIcon';
import { XMB_LAYOUT, XMB_ANIMATION, EASE } from '@/lib/xmb-constants';

interface XMBCategoryRowProps {
  categories: XMBCategory[];
  categoryIndex: number;
  itemIndex: number;
  onCategorySelect: (index: number) => void;
}

const XMBCategoryRow = React.memo(({
  categories,
  categoryIndex,
  itemIndex,
  onCategorySelect,
}: XMBCategoryRowProps) => {
  // Calculate the container offset to center the active category
  const containerOffset = -categoryIndex * XMB_LAYOUT.CATEGORY_WIDTH;

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
        {categories.map((category, idx) => {
          const isActive = idx === categoryIndex;
          const distance = Math.abs(idx - categoryIndex);

          return (
            <div
              key={category.id}
              role="tab"
              aria-selected={isActive}
              aria-label={category.title}
              tabIndex={isActive ? 0 : -1}
              className="flex flex-col items-center gap-2 cursor-pointer relative focus-visible:outline-none"
              style={{ width: `${XMB_LAYOUT.CATEGORY_WIDTH}px` }}
              onClick={() => {
                // Sound is owned by handleCategorySelect (navigate on switch,
                // confirm when entering the active category's list).
                onCategorySelect(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onCategorySelect(idx);
                }
              }}
            >
              {/* Icon with individual scale animation. transition-[filter]
                  fades the active drop-shadow in/out (filter interpolates
                  from none via zeroed drop-shadow values) instead of popping
                  it discretely on the switch frame. */}
              <motion.div
                animate={{
                  scale: isActive ? 1.2 : 0.8,
                  opacity: isActive ? 1 : Math.max(0.3, 1 - distance * 0.3)
                }}
                transition={XMB_ANIMATION.ICON_SPRING}
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
                {isActive && itemIndex === -1 && (
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
        })}
      </motion.div>
    </div>
  );
});

XMBCategoryRow.displayName = 'XMBCategoryRow';

export default XMBCategoryRow;
