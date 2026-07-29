// src/components/xmb/XMBCarousel.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from "motion/react";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import { isExternalLink } from "@/lib/xmb-navigation";
import { isStandaloneDocRoute } from "@/lib/xmb-routes";
import { focusListSibling } from "@/lib/focus";
import type { XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import XMBBackPill from "./XMBBackPill";
import { XMB_CAROUSEL, XMB_ANIMATION, EASE, XMB_SHAKE } from "@/lib/xmb-constants";
import { playNavigate, playConfirm } from "@/hooks/useKeyAudioFx";
import type { RestrictedPing } from "./XMBRestrictedToast";

// motion-wrapped next/link so internal link cards keep SPA navigation while
// being genuine anchors (middle-click, context menu, AT link semantics).
const MotionLink = motion.create(Link);

interface XMBCarouselProps {
  items: XMBItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Exit the folder (mouse/touch equivalent of Escape). */
  onBack?: () => void;
  /** Restricted item activated by click: shake + toast owner. */
  onRestricted?: (item: XMBItem, index: number) => void;
  /** Latest deny ping — the matching card runs the shake. */
  restrictedPing?: RestrictedPing | null;
  /** True during a pointer press: focus events it causes must not drive selection. */
  isPointerEvent?: () => boolean;
}

interface XMBCarouselCardProps {
  item: XMBItem;
  index: number;
  /** Total item count — aria-setsize keeps "n of N" correct despite culling. */
  setSize: number;
  scrollOffset: number;
  onSelect: (index: number) => void;
  /** Restricted item activated by click: shake + toast owner. */
  onRestricted?: (item: XMBItem, index: number) => void;
  /** 0 when this card isn't the deny target; bumps to re-run the shake. */
  shakeNonce: number;
  /** Shows the loading skeleton ahead of internal link navigation. */
  startNavigation: (href?: string) => void;
  isPointerEvent?: () => boolean;
}

const XMBCarouselCard = React.memo(({ item, index, setSize, scrollOffset, onSelect, onRestricted, shakeNonce, startNavigation, isPointerEvent }: XMBCarouselCardProps) => {
  const distance = index - scrollOffset;
  const absDistance = Math.abs(distance);
  const isActive = Math.round(scrollOffset) === index;
  const isVisible = absDistance <= XMB_CAROUSEL.VISIBLE_ITEMS;
  const yOffset = distance * XMB_CAROUSEL.ITEM_SPACING;

  // Continuous falloff so cards don't snap their scale/opacity/x when the
  // rounded `isActive` flips at half-integer scroll positions. `near` covers
  // the first step away from center (smooth scale + opacity drop), `far`
  // handles items further out with a gentler decay.
  const near = Math.min(absDistance, 1);
  const far = Math.max(0, absDistance - 1);
  const scale = Math.max(0.42, 1 - near * 0.45 - far * 0.05);
  const opacity = Math.max(0.08, 1 - near * 0.7 - far * 0.1);
  const xShift = 24 * (1 - near);
  const zIndex = 100 - Math.floor(absDistance);

  // Link cards render as real anchors (SPA <Link> internally, <a target=
  // _blank> externally); folders/actions stay divs so the window dispatcher
  // owns their Enter (a native button click would swallow the drill).
  // Restricted cards must NOT be anchors — Enter/click deny instead of
  // navigating, and an anchor would follow its href natively.
  const isLinkCard = !!item.link && !item.action && item.type !== 'folder' && !item.restricted;
  const isExternal = isLinkCard && isExternalLink(item.link!);
  // Standalone doc routes are tiny static payloads — keep Next's default
  // viewport prefetch so their loading skeleton never shows in production.
  // Post links stay opted out so the carousel can't bulk-fetch every
  // /[type]/[slug] payload (prefetch={false} also disables hover).
  const prefetch = isLinkCard && !isExternal && isStandaloneDocRoute(item.link!) ? undefined : false;

  // Deny shake: replays whenever the parent bumps this card's nonce.
  // Edge-triggered — the ref starts at the mount value, so a card that
  // remounts with a stale ping (folder exit/re-entry, culling, layout
  // switch) never replays a ghost shake.
  const shakeControls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const lastShakeNonceRef = useRef(shakeNonce);
  useEffect(() => {
    if (shakeNonce === lastShakeNonceRef.current) return;
    lastShakeNonceRef.current = shakeNonce;
    if (shakeNonce > 0 && !reduceMotion) {
      shakeControls.start({ x: XMB_SHAKE.KEYFRAMES }, XMB_SHAKE.TRANSITION);
    }
  }, [shakeNonce, reduceMotion, shakeControls]);

  const handleClick = (e: React.MouseEvent<HTMLElement>): void => {
    // Modified clicks on links (cmd/ctrl/shift/middle) are pure browser
    // affordances — no selection change, no preventDefault.
    if (isLinkCard && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
      return;
    }
    if (!isActive) {
      // First click centers the card, never activates.
      e.preventDefault();
      playNavigate();
      onSelect(index);
      return;
    }
    if (item.restricted) {
      // Deny: the handler owns the sound, shake, and toast.
      onRestricted?.(item, index);
      return;
    }
    if (isLinkCard) {
      // The anchor navigates natively; skeleton for internal routes only.
      playConfirm();
      if (!isExternal) {
        startNavigation(item.link!);
      }
    }
    // Non-link cards (nested folders / actions): Enter drills via the window
    // dispatcher; clicking the active card keeps its status-quo no-op.
  };

  const handleFocus = (): void => {
    // Keyboard/AT focus centers the card; pointer focus defers to onClick.
    if (isPointerEvent?.()) return;
    if (!isActive) {
      onSelect(index);
    }
  };

  // Tab walks the carousel: the adjacent card takes focus loudly (ring
  // shows — browser-style traversal) and selection follows via onFocus; at
  // either end the default action exits the list so keyboard users are
  // never trapped (2.1.2). Adjacent cards are always mounted (culling only
  // drops cards beyond the visibility window), so the sibling lookup only
  // fails at the true boundaries.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLElement>): void => {
    if (e.key !== 'Tab') return;
    if (focusListSibling('carousel-item-', index, e.shiftKey ? -1 : 1)) {
      e.preventDefault();
      playNavigate();
    }
  };

  const sharedProps = {
    role: 'option',
    'aria-selected': isActive,
    // Culling mounts only cards near the scroll offset; setsize/posinset keep
    // screen readers announcing the true "n of N" position regardless.
    'aria-setsize': setSize,
    'aria-posinset': index + 1,
    id: `carousel-item-${index}`,
    tabIndex: isActive ? 0 : -1,
    // This element is a full-width positioning strip anchored at top:50%;
    // the visible card is a child pulled up with translateY(-50%). A focus
    // ring here outlines the strip's untransformed box (offset below and far
    // wider than the card), so the ring is suppressed and re-drawn on the
    // card box itself via group-focus-visible.
    className: "group absolute left-0 block w-full cursor-pointer outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
    style: {
      top: '50%',
      zIndex,
      pointerEvents: isVisible ? 'auto' : 'none',
    } as React.CSSProperties,
    // Cards entering the visibility window (after being culled by
    // `visibleEntries`) would otherwise mount at identity (center,
    // full scale, full opacity) and animate to their real position —
    // a brief "ghost in the center" before they fly out. `initial=false`
    // paints them at the computed target on first render instead.
    initial: false,
    animate: {
      y: yOffset,
      opacity,
      x: xShift,
      scale,
    },
    transition: XMB_ANIMATION.SPRING_CONFIG,
    onClick: handleClick,
    onFocus: handleFocus,
    onKeyDown: handleTabKeyDown,
  };

  const cardContent = (
      <motion.div
        className="flex flex-col md:flex-row items-center gap-6 md:gap-12 px-4 md:px-6"
        style={{ y: '-50%' }}
        animate={shakeControls}
      >
        <div
          className={`
            w-64 h-36 sm:w-[24rem] sm:h-[14rem] md:w-[28rem] md:h-[16rem] shrink-0 rounded-xl overflow-hidden border shadow-2xl dark:bg-black/85 bg-white/90
            transition-[border-color,box-shadow,transform] duration-200
            group-focus-visible:ring-2 group-focus-visible:ring-ring
            ${isActive
              ? 'border-xmb-fg/80 ring-1 ring-xmb-fg/50 shadow-[0_0_35px_var(--color-xmb-shadow-glow)] hover:scale-[1.02] hover:shadow-[0_0_50px_var(--color-xmb-shadow-glow)]'
              : 'border-xmb-fg/20'
            }
          `}
        >
          {item.image ? (
            <div className="relative w-full h-full">
              <Image src={item.image} alt="" fill sizes="(max-width: 768px) 16rem, 28rem" className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <XMBIcon name="File" size={isActive ? 80 : 40} className="text-xmb-fg/30" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center drop-shadow-2xl max-w-2xl text-center md:text-left md:h-[16rem] sm:h-[14rem] h-36 overflow-hidden">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extralight tracking-wide transition-colors duration-150 leading-tight ${isActive ? 'text-xmb-fg' : 'text-xmb-fg/35'}`}>
            {item.title}
            {/* Pre-activation cue for AT: restricted cards otherwise
                announce identically to openable ones. */}
            {item.restricted && (
              <span className="sr-only"> — under wraps, activate for info</span>
            )}
          </h2>
          <AnimatePresence mode="popLayout">
            {isActive && item.description && (
              <motion.p
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 0.75, height: 'auto', marginTop: '1rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.15, ease: EASE.MOVE }}
                className="text-sm sm:text-base md:text-lg text-xmb-fg/65 line-clamp-2 md:line-clamp-3 leading-relaxed"
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
                  className="text-[10px] md:text-xs font-mono uppercase tracking-wider px-2 md:px-3 py-1 md:py-1.5 bg-xmb-fg/15 rounded-lg border border-xmb-fg/25"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
  );

  if (isLinkCard && !isExternal) {
    return (
      <MotionLink href={item.link!} prefetch={prefetch} {...sharedProps}>
        {cardContent}
      </MotionLink>
    );
  }
  if (isLinkCard) {
    return (
      <motion.a href={item.link} target="_blank" rel="noopener noreferrer" {...sharedProps}>
        {cardContent}
        <span className="sr-only"> (opens in new tab)</span>
      </motion.a>
    );
  }
  return <motion.div {...sharedProps}>{cardContent}</motion.div>;
});

XMBCarouselCard.displayName = 'XMBCarouselCard';

const XMBCarousel = ({ items, activeIndex, onSelect, onBack, onRestricted, restrictedPing, isPointerEvent }: XMBCarouselProps) => {
  const { startNavigation } = useXMBLoadingContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef<number>(0);
  const lastCommittedIndexRef = useRef<number>(activeIndex);
  const snapFrameRef = useRef<number | null>(null);
  // Flips true when we initiate the parent commit ourselves, so the
  // activeIndex sync effect below knows not to overwrite scrollOffset
  // (the rAF snap is already handling that transition smoothly).
  const selfCommittingRef = useRef<boolean>(false);

  // Smooth scroll position - floating point for continuous scrolling
  const [scrollOffset, setScrollOffset] = useState<number>(activeIndex);
  const scrollOffsetRef = useRef<number>(activeIndex);
  // eslint-disable-next-line react-hooks/refs -- render-phase mirror so wheel/rAF handlers read the latest committed offset without re-subscribing
  scrollOffsetRef.current = scrollOffset;

  // Smoothly ease scrollOffset to an integer index via rAF. Used after a
  // wheel/touch scroll settles so cards drift the last fractional step
  // instead of springing twice (once to the float rest, then back to the
  // rounded value when the parent re-syncs).
  const snapScrollOffsetTo = useCallback((target: number) => {
    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }
    const start = scrollOffsetRef.current;
    if (start === target) return;

    const startTime = performance.now();
    const duration = 220;

    const step = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setScrollOffset(start + (target - start) * eased);
      if (t < 1) {
        snapFrameRef.current = requestAnimationFrame(step);
      } else {
        snapFrameRef.current = null;
      }
    };
    snapFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Sync scrollOffset with activeIndex when it changes externally (keyboard nav).
  // Skip if the change came from our own debounced commit — snapScrollOffsetTo
  // is already mid-flight and an instant reset would undo it.
  useEffect(() => {
    if (selfCommittingRef.current) {
      selfCommittingRef.current = false;
      lastCommittedIndexRef.current = activeIndex;
      return;
    }
    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }
    setScrollOffset(activeIndex);
    lastCommittedIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Debounced sync: commit to parent + smooth-snap our own scrollOffset
  // when scroll settles. Both happen together so the cards animate once.
  // This branch only runs for wheel/touch-originated moves (keyboard-driven
  // activeIndex changes update lastCommittedIndexRef before it fires), so
  // the tick below never double-plays on keyboard navigation.
  useEffect(() => {
    const timer = setTimeout(() => {
      const roundedIndex = Math.round(scrollOffset);
      if (
        roundedIndex !== lastCommittedIndexRef.current &&
        roundedIndex >= 0 &&
        roundedIndex < items.length
      ) {
        lastCommittedIndexRef.current = roundedIndex;
        selfCommittingRef.current = true;
        playNavigate();
        onSelect(roundedIndex);
        snapScrollOffsetTo(roundedIndex);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [scrollOffset, activeIndex, items.length, onSelect, snapScrollOffsetTo]);

  // Cancel any in-flight snap frame on unmount
  useEffect(() => {
    return () => {
      if (snapFrameRef.current !== null) {
        cancelAnimationFrame(snapFrameRef.current);
        snapFrameRef.current = null;
      }
    };
  }, []);
  
  // Mouse wheel handler - smooth continuous scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // User is steering again — abort any settle-snap in progress so the
    // wheel input owns scrollOffset.
    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }

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

    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }

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
      className="absolute top-0 right-0 w-full md:w-[70%] h-dvh flex items-center justify-center pointer-events-auto overflow-clip touch-none"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      // Exit is opacity-only and faster than the entrance: sliding this
      // 70%-viewport subtree of glowing cards out concurrently with a
      // category switch's springs causes jank, so it just fades.
      exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE.EXIT } }}
      transition={{ duration: 0.25, ease: EASE.ENTER }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-6xl h-full px-6 md:pl-12">
          {/* Back pill above the folder's item list — sits over the faded
              outermost cards, never the active one. */}
          {onBack && (
            <motion.div
              className="absolute top-[8%] left-6 md:left-12 z-[110]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: EASE.ENTER }}
            >
              <XMBBackPill onBack={onBack} />
            </motion.div>
          )}
          {visibleEntries.map(({ item, index }) => {
            return (
              <XMBCarouselCard
                key={item.id}
                item={item}
                index={index}
                setSize={items.length}
                scrollOffset={scrollOffset}
                onSelect={onSelect}
                onRestricted={onRestricted}
                shakeNonce={restrictedPing?.id === item.id ? restrictedPing.nonce : 0}
                startNavigation={startNavigation}
                isPointerEvent={isPointerEvent}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default XMBCarousel;
