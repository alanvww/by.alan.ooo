// src/components/xmb/XMBCarousel.tsx
"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  animate,
  useAnimationControls,
  useFollowValue,
  useIsPresent,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { AnimationPlaybackControls, FollowValueOptions, MotionValue } from "motion/react";
import { useXMBLoadingContext } from "@/lib/xmb-navigation-context";
import { isExternalLink, isActivatable } from "@/lib/xmb-navigation";
import { isStandaloneDocRoute } from "@/lib/xmb-routes";
import { normalizeWheelDelta } from "@/lib/wheel";
import { isChromeTarget } from "@/lib/xmb-chrome";
import { focusListSibling } from "@/lib/focus";
import type { XMBItem } from "@/lib/xmb-types";
import XMBIcon from "./XMBIcon";
import { XMB_CAROUSEL, XMB_ANIMATION, EASE, XMB_SHAKE, XMB_GESTURE } from "@/lib/xmb-constants";
import { playNavigate, playConfirm, playDeny } from "@/hooks/useKeyAudioFx";
import type { RestrictedPing } from "./XMBRestrictedToast";

// motion-wrapped next/link so internal link cards keep SPA navigation while
// being genuine anchors (middle-click, context menu, AT link semantics).
const MotionLink = motion.create(Link);

const isUnoptimizedImage = (src: string): boolean =>
  !src.startsWith('/') || src.startsWith('//') || /\.(svg|gif)($|[?#])/i.test(src);

interface XMBCarouselProps {
  items: XMBItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Restricted item activated by click: shake + toast owner. */
  onRestricted?: (item: XMBItem, index: number) => void;
  /** Latest deny ping — the matching card runs the shake. */
  restrictedPing?: RestrictedPing | null;
  /** True during a pointer press: focus events it causes must not drive selection. */
  isPointerEvent?: () => boolean;
  /**
   * Element the wheel listener attaches to. XMBInterface passes its
   * `fixed inset-0` root so the whole screen steers the cards (the way the
   * arrow keys already do) — on its own 70%-wide container the inert
   * context list on the left was a wheel-dead zone. Defaults to the
   * carousel's own container.
   */
  wheelSurfaceRef?: React.RefObject<HTMLElement | null>;
  /** Shared live index ref so Enter/arrows during a wheel/touch gesture act on the highlighted card. */
  liveIndexRef?: React.RefObject<number | null>;
  /** Shared wheel abort ref so keyboard navigation cancels in-flight carousel settle timers. */
  wheelAbortRef?: React.RefObject<(() => void) | null>;
  /** Accessible name of the listbox — the folder's title, so AT names
      which folder is open rather than a generic "Folder contents". */
  label?: string;
}

interface XMBCarouselCardProps {
  item: XMBItem;
  index: number;
  /** Total item count — aria-setsize keeps "n of N" correct despite culling. */
  setSize: number;
  /**
   * Frame-rate scroll position as a motion value. Cards subscribe via
   * useTransform/useFollowValue, so wheel/touch/snap writes never re-render
   * them.
   */
  scrollOffset: MotionValue<number>;
  /** Quantized selection: true when Math.round(scrollOffset) === index. */
  isActive: boolean;
  onSelect: (index: number) => void;
  /** Restricted item activated by click: shake + toast owner. */
  onRestricted?: (item: XMBItem, index: number) => void;
  /** 0 when this card isn't the deny target; bumps to re-run the shake. */
  shakeNonce: number;
  /** Shows the loading skeleton ahead of internal link navigation. */
  startNavigation: (href?: string) => void;
  /** Keyboard/AT focus landed on this card: sync the selection (parent-owned
      so it compares against a layout-effect-fresh index, not this card's
      render-stale isActive). */
  onCardFocus: (index: number) => void;
}

const XMBCarouselCard = React.memo(({ item, index, setSize, scrollOffset, isActive, onSelect, onRestricted, shakeNonce, startNavigation, onCardFocus }: XMBCarouselCardProps) => {
  // Every positional channel is a pure function of (index − scrollOffset),
  // computed as motion-value transforms so frame-rate scrolling stays out of
  // React entirely. Continuous falloff so cards don't snap their
  // scale/opacity/x when the rounded `isActive` flips at half-integer scroll
  // positions. `near` covers the first step away from center (smooth scale +
  // opacity drop), `far` handles items further out with a gentler decay.
  const yTarget = useTransform(scrollOffset, (offset) =>
    (index - offset) * XMB_CAROUSEL.ITEM_SPACING
  );
  const xTarget = useTransform(scrollOffset, (offset) =>
    24 * (1 - Math.min(Math.abs(index - offset), 1))
  );
  const scaleTarget = useTransform(scrollOffset, (offset) => {
    const absDistance = Math.abs(index - offset);
    const near = Math.min(absDistance, 1);
    const far = Math.max(0, absDistance - 1);
    return Math.max(0.42, 1 - near * 0.45 - far * 0.05);
  });
  const opacityTarget = useTransform(scrollOffset, (offset) => {
    const absDistance = Math.abs(index - offset);
    const near = Math.min(absDistance, 1);
    const far = Math.max(0, absDistance - 1);
    return Math.max(0.08, 1 - near * 0.7 - far * 0.1);
  });
  const zIndex = useTransform(scrollOffset, (offset) =>
    100 - Math.floor(Math.abs(index - offset))
  );
  // Same float-accurate hit-test window as before (±VISIBLE_ITEMS), tracked
  // per frame — the widened *mount* window below never widens hit targets.
  const pointerEvents = useTransform(scrollOffset, (offset) =>
    Math.abs(index - offset) <= XMB_CAROUSEL.VISIBLE_ITEMS ? 'auto' : 'none'
  );

  const reduceMotion = useReducedMotion();
  const transformFollow: FollowValueOptions = reduceMotion
    ? { type: 'keyframes', duration: 0 }
    : XMB_ANIMATION.FOLLOW_TWEEN;
  const y = useFollowValue(yTarget, transformFollow);
  const x = useFollowValue(xTarget, transformFollow);
  const scale = useFollowValue(scaleTarget, transformFollow);
  const opacity = useFollowValue(opacityTarget, XMB_ANIMATION.FOLLOW_TWEEN);

  const isLinkCard = !!item.link && !item.action && item.type !== 'folder' && !item.restricted;
  const isExternal = isLinkCard && isExternalLink(item.link!);
  const prefetch = isLinkCard && !isExternal && isStandaloneDocRoute(item.link!) ? undefined : false;

  const shakeControls = useAnimationControls();
  const lastShakeNonceRef = useRef(shakeNonce);
  useEffect(() => {
    if (shakeNonce === lastShakeNonceRef.current) return;
    lastShakeNonceRef.current = shakeNonce;
    if (shakeNonce > 0 && !reduceMotion) {
      shakeControls.start({ x: XMB_SHAKE.KEYFRAMES }, XMB_SHAKE.TRANSITION);
    }
  }, [shakeNonce, reduceMotion, shakeControls]);

  const handleClick = (e: React.MouseEvent<HTMLElement>): void => {
    if (isLinkCard && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
      return;
    }
    if (!isActive) {
      e.preventDefault();
      playNavigate();
      onSelect(index);
      return;
    }
    if (item.restricted) {
      onRestricted?.(item, index);
      return;
    }
    if (!isActivatable(item)) {
      e.preventDefault();
      playDeny();
      return;
    }
    if (isLinkCard) {
      playConfirm();
      if (!isExternal) {
        startNavigation(item.link!);
      }
    }
  };

  const handleFocus = (): void => onCardFocus(index);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLElement>): void => {
    if (e.key !== 'Tab') return;
    if (focusListSibling('carousel-item-', index, e.shiftKey ? -1 : 1)) {
      e.preventDefault();
    }
  };

  const sharedProps = {
    role: 'option',
    'aria-selected': isActive,
    draggable: false,
    'aria-setsize': setSize,
    'aria-posinset': index + 1,
    id: `carousel-item-${index}`,
    tabIndex: isActive ? 0 : -1,
    className: "group absolute left-0 block w-full cursor-pointer outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
    style: {
      top: '50%',
      zIndex,
      pointerEvents,
      y,
      x,
      scale,
      opacity,
    },
    initial: false,
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
            relative xmb-card-chrome w-64 h-36 sm:w-[24rem] sm:h-[14rem] md:w-[28rem] md:h-[16rem] shrink-0 rounded-xl overflow-hidden border shadow-2xl dark:bg-black/75 bg-white/85
            transition-[border-color,box-shadow,transform] duration-200
            group-focus-visible:ring-2 group-focus-visible:ring-ring
            ${isActive
              ? 'border-xmb-fg/45 shadow-[0_0_32px_var(--color-xmb-shadow-glow)] motion-safe:hover:scale-[1.02] hover:border-xmb-fg/65 hover:shadow-[0_0_44px_var(--color-xmb-shadow-glow)]'
              : 'border-xmb-fg/15'
            }
          `}
        >
          {item.image ? (
            <div className="relative w-full h-full">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 768px) 16rem, 28rem"
                unoptimized={isUnoptimizedImage(item.image)}
                className="object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-xmb-fg/15 rounded-xl pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <XMBIcon name="File" size={64} className={isActive ? 'text-xmb-fg/45 xmb-row-icon-active' : 'text-xmb-fg/25'} />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center drop-shadow-2xl max-w-2xl text-center md:text-left md:h-[16rem] sm:h-[14rem] h-36 overflow-hidden">
          <div className={`text-2xl sm:text-3xl md:text-4xl font-extralight tracking-wide transition-colors duration-150 leading-tight ${isActive ? 'text-xmb-fg' : 'text-xmb-fg/35'}`}>
            {item.title}
            {/* Pre-activation cue for AT: restricted cards otherwise
                announce identically to openable ones. */}
            {item.restricted && (
              <span className="sr-only"> — under wraps, activate for info</span>
            )}
          </div>
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

const XMBCarousel = ({
  items,
  activeIndex,
  onSelect,
  onRestricted,
  restrictedPing,
  isPointerEvent,
  wheelSurfaceRef,
  liveIndexRef,
  wheelAbortRef,
  label,
}: XMBCarouselProps) => {
  const { startNavigation } = useXMBLoadingContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchTravelRef = useRef<number>(0);
  const touchConsumedRef = useRef<boolean>(false);
  const touchEndedAtRef = useRef<number>(0);
  const gestureActiveRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef<number>(0);
  const lastCommittedIndexRef = useRef<number>(activeIndex);
  const snapAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const selfCommittingRef = useRef<boolean>(false);

  const scrollOffset = useMotionValue(activeIndex);

  const [roundedIndex, setRoundedIndex] = useState<number>(activeIndex);
  const roundedIndexRef = useRef<number>(activeIndex);

  const activeIndexRef = useRef(activeIndex);
  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
  });
  const handleCardFocus = useCallback((index: number) => {
    if (isPointerEvent?.()) return;
    if (index === activeIndexRef.current) return;
    playNavigate();
    onSelect(index);
  }, [isPointerEvent, onSelect]);

  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitArgsRef = useRef({ itemCount: items.length, onSelect });
  useEffect(() => {
    commitArgsRef.current = { itemCount: items.length, onSelect };
  }, [items.length, onSelect]);

  const abortGesture = useCallback(() => {
    gestureActiveRef.current = false;
    if (liveIndexRef) {
      liveIndexRef.current = null;
    }
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    wheelDeltaRef.current = 0;
  }, [liveIndexRef]);

  useLayoutEffect(() => {
    if (!wheelAbortRef) return;
    wheelAbortRef.current = abortGesture;
    return () => {
      if (wheelAbortRef.current === abortGesture) {
        wheelAbortRef.current = null;
      }
      if (liveIndexRef) {
        liveIndexRef.current = null;
      }
    };
  }, [abortGesture, liveIndexRef, wheelAbortRef]);

  const isPresent = useIsPresent();
  const isPresentRef = useRef(true);
  useEffect(() => {
    isPresentRef.current = isPresent;
    if (isPresent) return;
    abortGesture();
  }, [abortGesture, isPresent]);

  const snapScrollOffsetTo = useCallback((target: number) => {
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;
    if (scrollOffset.get() === target) return;
    snapAnimationRef.current = animate(scrollOffset, target, {
      duration: 0.22,
      ease: [1 / 3, 1, 2 / 3, 1],
    });
  }, [scrollOffset]);

  const armSettleTimer = useCallback(() => {
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      gestureActiveRef.current = false;
      if (liveIndexRef) {
        liveIndexRef.current = null;
      }
      if (!isPresentRef.current) return;
      const { itemCount, onSelect: commitSelect } = commitArgsRef.current;
      const settledIndex = Math.round(scrollOffset.get());
      if (
        settledIndex !== lastCommittedIndexRef.current &&
        settledIndex >= 0 &&
        settledIndex < itemCount
      ) {
        lastCommittedIndexRef.current = settledIndex;
        selfCommittingRef.current = true;
        playNavigate();
        commitSelect(settledIndex);
        snapScrollOffsetTo(settledIndex);
      } else if (settledIndex >= 0 && settledIndex < itemCount) {
        snapScrollOffsetTo(settledIndex);
      }
    }, 50);
  }, [liveIndexRef, scrollOffset, snapScrollOffsetTo]);

  useEffect(() => {
    if (selfCommittingRef.current) {
      selfCommittingRef.current = false;
      lastCommittedIndexRef.current = activeIndex;
      return;
    }
    gestureActiveRef.current = false;
    if (liveIndexRef) {
      liveIndexRef.current = null;
    }
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;
    scrollOffset.set(activeIndex);
    lastCommittedIndexRef.current = activeIndex;
  }, [activeIndex, liveIndexRef, scrollOffset]);

  useMotionValueEvent(scrollOffset, "change", (latest) => {
    const rounded = Math.round(latest);
    if (rounded !== roundedIndexRef.current) {
      roundedIndexRef.current = rounded;
      setRoundedIndex(rounded);
    }
    if (gestureActiveRef.current && liveIndexRef) {
      liveIndexRef.current = rounded;
    }
  });

  useEffect(() => {
    return () => {
      abortGesture();
    };
  }, [abortGesture]);

  // Mouse wheel handler - smooth continuous scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    if (!isPresentRef.current) return;
    if (e.defaultPrevented) return;
    e.preventDefault();

    gestureActiveRef.current = true;
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;

    const { dy } = normalizeWheelDelta(e, containerRef.current);
    wheelDeltaRef.current += dy * XMB_CAROUSEL.SCROLL_SENSITIVITY;

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const delta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      animationFrameRef.current = null;

      const newOffset = scrollOffset.get() + delta;
      const clamped = Math.max(0, Math.min(items.length - 1, newOffset));
      scrollOffset.set(clamped);
      if (liveIndexRef) {
        liveIndexRef.current = Math.round(clamped);
      }
      armSettleTimer();
    });
  }, [armSettleTimer, items.length, liveIndexRef, scrollOffset]);

  // Touch handlers for mobile swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isChromeTarget(e.target)) {
      touchStartY.current = null;
      touchStartX.current = null;
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchTravelRef.current = 0;
    touchConsumedRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null || e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = touchStartY.current - currentY;
    const deltaX = touchStartX.current - currentX;
    touchStartY.current = currentY;
    touchStartX.current = currentX;

    touchTravelRef.current += Math.hypot(deltaX, deltaY);
    if (touchTravelRef.current > XMB_GESTURE.PAN_SLOP_PX) {
      touchConsumedRef.current = true;
    }
    if (!touchConsumedRef.current) return;

    gestureActiveRef.current = true;
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;

    const delta = deltaY * 0.01;
    wheelDeltaRef.current += delta;

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const touchDelta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      animationFrameRef.current = null;

      const newOffset = scrollOffset.get() + touchDelta;
      const clamped = Math.max(0, Math.min(items.length - 1, newOffset));
      scrollOffset.set(clamped);
      if (liveIndexRef) {
        liveIndexRef.current = Math.round(clamped);
      }
      armSettleTimer();
    });
  }, [armSettleTimer, items.length, liveIndexRef, scrollOffset]);

  const handleTouchEnd = useCallback(() => {
    if (touchConsumedRef.current) {
      touchEndedAtRef.current = performance.now();
    }
    touchStartY.current = null;
    touchStartX.current = null;
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (
      touchConsumedRef.current &&
      performance.now() - touchEndedAtRef.current <= XMB_GESTURE.TAP_SUPPRESS_WINDOW_MS
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
    touchConsumedRef.current = false;
  }, []);

  useEffect(() => {
    const container = wheelSurfaceRef?.current ?? containerRef.current;
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
  }, [handleWheel, wheelSurfaceRef]);

  const visibleEntries = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => Math.abs(index - roundedIndex) <= XMB_CAROUSEL.VISIBLE_ITEMS + 1);
  }, [items, roundedIndex]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute top-0 right-0 w-full md:w-[70%] h-dvh flex items-center justify-center pointer-events-auto overflow-clip touch-pinch-zoom"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE.EXIT } }}
      transition={{ duration: 0.25, ease: EASE.ENTER }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClickCapture={handleClickCapture}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-6xl h-full px-6 md:pl-12">
          <div role="listbox" aria-label={label ?? 'Folder contents'} className="absolute inset-0">
          {visibleEntries.map(({ item, index }) => {
            return (
              <XMBCarouselCard
                key={item.id}
                item={item}
                index={index}
                setSize={items.length}
                scrollOffset={scrollOffset}
                isActive={index === roundedIndex}
                onSelect={onSelect}
                onRestricted={onRestricted}
                shakeNonce={restrictedPing?.id === item.id ? restrictedPing.nonce : 0}
                startNavigation={startNavigation}
                onCardFocus={handleCardFocus}
              />
            );
          })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default XMBCarousel;
