// src/components/xmb/XMBCarousel.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from 'next/image';
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import { navigateToLink } from "@/lib/xmb-navigation";
import type { XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import { XMB_CAROUSEL, XMB_ANIMATION, EASE } from "@/lib/xmb-constants";

interface XMBCarouselProps {
  items: XMBItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

interface XMBCarouselCardProps {
  item: XMBItem;
  index: number;
  scrollOffset: number;
  onSelect: (index: number) => void;
  onNavigate: (link: string) => void;
}

const XMBCarouselCard = React.memo(({ item, index, scrollOffset, onSelect, onNavigate }: XMBCarouselCardProps) => {
  const distance = index - scrollOffset;
  const absDistance = Math.abs(distance);
  const isActive = Math.round(scrollOffset) === index;
  const isVisible = absDistance <= XMB_CAROUSEL.VISIBLE_ITEMS;
  const yOffset = distance * XMB_CAROUSEL.ITEM_SPACING;
  const scale = isActive ? 1 : Math.max(0.6 - absDistance * 0.05, 0.42);
  const opacity = isActive ? 1 : Math.max(0.3 - absDistance * 0.1, 0.08);
  const zIndex = 100 - Math.floor(absDistance);

  return (
    <motion.div
      role="option"
      aria-selected={isActive}
      id={`carousel-item-${index}`}
      className="absolute left-0 w-full cursor-pointer focus-visible:outline-none"
      style={{
        top: '50%',
        zIndex,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      animate={{
        y: yOffset,
        opacity,
        x: isActive ? 24 : 0,
        scale,
      }}
      transition={XMB_ANIMATION.SPRING_CONFIG}
      onClick={() => {
        if (isActive) {
          if (item.link) {
            onNavigate(item.link);
          }
        } else {
          onSelect(index);
        }
      }}
    >
      <div
        className="flex flex-col md:flex-row items-center gap-6 md:gap-12 px-4 md:px-6"
        style={{
          transform: 'translateY(-50%)',
        }}
      >
        <div
          className={`
            w-64 h-36 sm:w-[24rem] sm:h-[14rem] md:w-[28rem] md:h-[16rem] shrink-0 rounded-xl overflow-hidden border shadow-2xl bg-black/85
            transition-all duration-200
            ${isActive
              ? 'border-white/80 ring-1 ring-white/50 shadow-[0_0_35px_rgba(255,255,255,0.35)] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]'
              : 'border-white/20'
            }
          `}
        >
          {item.image ? (
            <div className="relative w-full h-full">
              <Image src={item.image} alt="" fill sizes="(max-width: 768px) 16rem, 28rem" className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <XMBIcon name="File" size={isActive ? 80 : 40} className="text-white/30" />
            </div>
          )}
        </div>

        <div className="flex flex-col drop-shadow-2xl max-w-2xl text-center md:text-left">
          <h2           className={`text-2xl sm:text-3xl md:text-4xl font-extralight tracking-wide transition-colors duration-150 leading-tight ${isActive ? 'text-white' : 'text-white/35'}`}>
            {item.title}
          </h2>
          <AnimatePresence mode="popLayout">
            {isActive && item.description && (
              <motion.p
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 0.75, height: 'auto', marginTop: '1rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.15, ease: EASE.MOVE }}
                className="text-sm sm:text-base md:text-lg text-white/65 line-clamp-2 md:line-clamp-3 leading-relaxed"
              >
                {item.description}
              </motion.p>
            )}
          </AnimatePresence>
          {isActive && item.meta?.tags && (item.meta.tags as string[]).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.2, ease: EASE.ENTER }}
              className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-2.5 mt-4 md:mt-5"
            >
              {(item.meta.tags as string[]).slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] md:text-xs font-mono uppercase tracking-wider px-2 md:px-3 py-1 md:py-1.5 bg-white/15 rounded-lg border border-white/25"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

XMBCarouselCard.displayName = 'XMBCarouselCard';

const XMBCarousel = ({ items, activeIndex, onSelect }: XMBCarouselProps) => {
  const router = useRouter();
  const { startNavigation } = useXMBLoadingContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef<number>(0);
  const lastCommittedIndexRef = useRef<number>(activeIndex);
  
  // Smooth scroll position - floating point for continuous scrolling
  const [scrollOffset, setScrollOffset] = useState<number>(activeIndex);
  
  // Sync scrollOffset with activeIndex when it changes externally (keyboard nav)
  useEffect(() => {
    setScrollOffset(activeIndex);
    lastCommittedIndexRef.current = activeIndex;
  }, [activeIndex]);
  
  // Debounced sync: update parent's activeIndex when scroll settles
  useEffect(() => {
    const timer = setTimeout(() => {
      const roundedIndex = Math.round(scrollOffset);
      if (
        roundedIndex !== lastCommittedIndexRef.current &&
        roundedIndex >= 0 &&
        roundedIndex < items.length
      ) {
        lastCommittedIndexRef.current = roundedIndex;
        onSelect(roundedIndex);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [scrollOffset, activeIndex, items.length, onSelect]);
  
  // Mouse wheel handler - smooth continuous scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    wheelDeltaRef.current += e.deltaY * XMB_CAROUSEL.SCROLL_SENSITIVITY;

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const delta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      animationFrameRef.current = null;

      setScrollOffset((prev) => {
        const newOffset = prev + delta;
        return Math.max(0, Math.min(items.length - 1, newOffset));
      });
    });
  }, [items.length]);
  
  // Touch handlers for mobile swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    touchStartY.current = currentY;
    
    // Convert touch movement to scroll offset
    const delta = deltaY * 0.01; // Sensitivity for touch
    
    wheelDeltaRef.current += delta;

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const touchDelta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      animationFrameRef.current = null;

      setScrollOffset((prev) => {
        const newOffset = prev + touchDelta;
        return Math.max(0, Math.min(items.length - 1, newOffset));
      });
    });
  }, [items.length]);
  
  const handleTouchEnd = useCallback(() => {
    touchStartY.current = 0;
  }, []);

  const handleNavigate = useCallback((link: string) => {
    navigateToLink(link, router, startNavigation);
  }, [router, startNavigation]);
  
  // Attach wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const wheelHandler = (e: WheelEvent) => handleWheel(e);
    
    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      container.removeEventListener('wheel', wheelHandler);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [handleWheel]);

  const visibleEntries = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => Math.abs(index - scrollOffset) <= XMB_CAROUSEL.VISIBLE_ITEMS + 1);
  }, [items, scrollOffset]);

  return (
    <motion.div 
      ref={containerRef}
      role="listbox"
      aria-label="Folder contents"
      className="absolute top-0 right-0 w-full md:w-[70%] h-screen flex items-center justify-center pointer-events-auto overflow-clip"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.25, ease: EASE.ENTER }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-6xl h-full px-6 md:pl-12">
          {visibleEntries.map(({ item, index }) => {
            return (
              <XMBCarouselCard
                key={item.id}
                item={item}
                index={index}
                scrollOffset={scrollOffset}
                onSelect={onSelect}
                onNavigate={handleNavigate}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default XMBCarousel;
