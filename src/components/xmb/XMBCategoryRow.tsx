// src/components/xmb/XMBCategoryRow.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { XMBCategory } from '@/lib/xmb-types';
import XMBIcon from './XMBIcon';
import { XMB_LAYOUT, XMB_ANIMATION, EASE } from '@/lib/xmb-constants';
import { playNavigate } from '@/hooks/useKeyAudioFx';

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
    <motion.div
      className="relative z-10 h-16 md:h-20 overflow-visible"
      role="tablist"
      aria-label="XMB Categories"
      // Idle vertical drift — gentle ambient sway so the row feels alive at rest
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
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
              style={{ 
                width: `${XMB_LAYOUT.CATEGORY_WIDTH}px`,
                // @ts-ignore - CSS Anchor API
                anchorName: isActive ? '--active-category' : undefined,
              }}
              onClick={() => {
                playNavigate();
                onCategorySelect(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onCategorySelect(idx);
                }
              }}
            >
              {/* Glow effect for active category — outer carries FLIP between categories,
                  inner carries the slow breathing pulse so neither animation fights the other */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="category-glow"
                    className="absolute inset-0 rounded-full pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE.SOFT }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-xmb-fg) 18%, transparent), transparent 55%)' }}
                      animate={{ scale: [1, 1.15, 1], opacity: [1, 0.65, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon with individual scale animation */}
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 0.8,
                  opacity: isActive ? 1 : Math.max(0.3, 1 - distance * 0.3)
                }}
                transition={XMB_ANIMATION.ICON_SPRING}
                className={`relative z-10 transition-shadow duration-150 ${isActive ? 'drop-shadow-[0_0_15px_var(--color-xmb-glow)]' : ''}`}
                style={{ willChange: 'transform, opacity' }}
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
    </motion.div>
  );
});

XMBCategoryRow.displayName = 'XMBCategoryRow';

export default XMBCategoryRow;
