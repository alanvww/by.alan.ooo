// src/components/xmb/XMBCategoryRow.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { XMBCategory } from '@/lib/xmb-types';
import XMBIcon from './XMBIcon';
import { XMB_LAYOUT, XMB_ANIMATION } from '@/lib/xmb-constants';

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
    <div className="relative h-16 md:h-20 overflow-visible" role="tablist" aria-label="XMB Categories">
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
                anchorName: isActive ? '--active-category' : undefined,
              }}
              onClick={() => onCategorySelect(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onCategorySelect(idx);
                }
              }}
            >
              {/* Glow effect for active category */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="category-glow"
                    className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
                    style={{ filter: 'blur(40px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with individual scale animation */}
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 0.8,
                  opacity: isActive ? 1 : Math.max(0.3, 1 - distance * 0.3)
                }}
                transition={XMB_ANIMATION.ICON_SPRING}
                className={`relative z-10 transition-shadow duration-300 ${isActive ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}`}
                style={{ willChange: 'transform, opacity' }}
              >
                <XMBIcon 
                  name={category.iconName} 
                  size={isActive ? 48 : 40} 
                  className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/70 hover:text-white/90'}`}
                />
              </motion.div>

              {/* Category title - only show when active and no item selected */}
              <AnimatePresence>
                {isActive && itemIndex === -1 && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
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
