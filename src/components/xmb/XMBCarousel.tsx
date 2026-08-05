// src/components/xmb/XMBCarousel.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  animate,
  useAnimationControls,
  useFollowValue,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { AnimationPlaybackControls, FollowValueOptions, MotionValue } from "motion/react";
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
  isPointerEvent?: () => boolean;
}

const XMBCarouselCard = React.memo(({ item, index, setSize, scrollOffset, isActive, onSelect, onRestricted, shakeNonce, startNavigation, isPointerEvent }: XMBCarouselCardProps) => {
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

  // The followers replace the old animate-prop retargeting one-for-one: the
  // same 300ms ease-out tween chases the same per-frame targets, so keyboard
  // jumps, the wheel trail and the settle snap keep the shipped motion. (The
  // useSpring followers these replace were REAL springs — the only consumers
  // of the old "spring" configs that ever sprang, since useSpring's
  // attachFollow path defaults type:'spring' — and settled visibly slower
  // than the shipped tween.) FOLLOW_TWEEN, not TWEEN: attachFollow takes
  // durations in milliseconds, and its explicit `type` is load-bearing
  // because attachFollow spreads options over a `type: "spring"` default
  // (see XMB_ANIMATION). A follower initializes at the source's current
  // value, so a card culled back into the mount window paints at its real
  // transform on first render — the same no-ghost guarantee initial={false}
  // gave the old animate props.
  //
  // MotionConfig reducedMotion="user" (MotionProvider) only governs animate
  // props — it can't see style-driven motion values — so the gate is manual,
  // same pattern as XMBVerticalList's entrance, and mirrors motion's
  // reducedMotion="user" split: transform channels (y/x/scale) snap via a
  // duration-0 follower (replacing the old raw-target style swap, and
  // sparing reduce users the cost of dead per-frame animations), while
  // opacity keeps the full tween. reduceMotion is constant for the life of
  // a mounted component, so the ternary picks one stable options object —
  // and useFollowValue re-attaches on JSON.stringify(options) changes, so
  // even an OS-level flip mid-session resolves correctly.
  const reduceMotion = useReducedMotion();
  const transformFollow: FollowValueOptions = reduceMotion
    ? { type: 'keyframes', duration: 0 }
    : XMB_ANIMATION.FOLLOW_TWEEN;
  const y = useFollowValue(yTarget, transformFollow);
  const x = useFollowValue(xTarget, transformFollow);
  const scale = useFollowValue(scaleTarget, transformFollow);
  const opacity = useFollowValue(opacityTarget, XMB_ANIMATION.FOLLOW_TWEEN);

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
    // Position is fully style-driven (motion values), so a card entering the
    // mount window paints at its current computed transform on first render —
    // no "ghost in the center". initial={false} is kept for its second job:
    // variant/initial propagation to children stays exactly as before.
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
  const snapAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  // Flips true when we initiate the parent commit ourselves, so the
  // activeIndex sync effect below knows not to overwrite scrollOffset
  // (the settle animation is already handling that transition smoothly).
  const selfCommittingRef = useRef<boolean>(false);

  // Smooth scroll position — floating point for continuous scrolling. A
  // motion value, NOT React state: wheel/touch/settle write it at frame
  // rate, and routing those writes through setState re-rendered the whole
  // carousel (recomputing the culling and busting every card's memo) on
  // every frame. Cards subscribe via useTransform/useFollowValue instead.
  const scrollOffset = useMotionValue(activeIndex);

  // Quantized mirror of scrollOffset for the few things that genuinely need
  // a React render — the cards' isActive styling/aria and the culling
  // window. Updated only when the rounded value actually changes, never per
  // frame.
  const [roundedIndex, setRoundedIndex] = useState<number>(activeIndex);
  const roundedIndexRef = useRef<number>(activeIndex);

  // Debounce timer for the settle commit, armed imperatively on each offset
  // write (the old implementation recreated a setTimeout effect per frame).
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The timer can fire up to 50ms after it was armed, so it reads its
  // inputs from a ref refreshed by a passive effect instead of a possibly
  // stale closure (the old effect re-armed on dep changes to stay fresh).
  const commitArgsRef = useRef({ itemCount: items.length, onSelect });
  useEffect(() => {
    commitArgsRef.current = { itemCount: items.length, onSelect };
  }, [items.length, onSelect]);

  // Smoothly ease scrollOffset to an integer index. Used after a
  // wheel/touch scroll settles so cards drift the last fractional step
  // instead of springing twice (once to the float rest, then back to the
  // rounded value when the parent re-syncs). The bezier (1/3, 1, 2/3, 1)
  // is the exact analytic form of the old hand-rolled ease-out cubic
  // 1-(1-t)^3 over the same 220ms. Like the old rAF loop, this imperative
  // animation deliberately runs under reduced motion too: it only moves the
  // offset, and reduced-motion users' cards snap along via their duration-0
  // followers.
  const snapScrollOffsetTo = useCallback((target: number) => {
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;
    if (scrollOffset.get() === target) return;
    snapAnimationRef.current = animate(scrollOffset, target, {
      duration: 0.22,
      ease: [1 / 3, 1, 2 / 3, 1],
    });
  }, [scrollOffset]);

  // Sync scrollOffset with activeIndex when it changes externally (keyboard
  // nav). The offset retargets instantly — each card's follower tween
  // carries the visible motion, exactly as it did when this was a setState.
  // Skip if the
  // change came from our own debounced commit — snapScrollOffsetTo is
  // already mid-flight and an instant reset would undo it.
  useEffect(() => {
    if (selfCommittingRef.current) {
      selfCommittingRef.current = false;
      lastCommittedIndexRef.current = activeIndex;
      return;
    }
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;
    scrollOffset.set(activeIndex);
    lastCommittedIndexRef.current = activeIndex;
  }, [activeIndex, scrollOffset]);

  // Every offset write lands here (wheel/touch rAF batches, the settle
  // animation's frames, external syncs): keep the quantized index fresh and
  // re-arm the 50ms settle debounce. When scroll settles, commit to parent +
  // smooth-snap our own scrollOffset together so the cards animate once.
  // The commit branch only runs for wheel/touch-originated moves (keyboard-
  // driven activeIndex changes update lastCommittedIndexRef before it
  // fires), so the tick below never double-plays on keyboard navigation.
  useMotionValueEvent(scrollOffset, "change", (latest) => {
    const rounded = Math.round(latest);
    if (rounded !== roundedIndexRef.current) {
      roundedIndexRef.current = rounded;
      setRoundedIndex(rounded);
    }

    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
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
      }
    }, 50);
  });

  // Cancel the in-flight settle animation and any pending commit on unmount
  useEffect(() => {
    return () => {
      snapAnimationRef.current?.stop();
      snapAnimationRef.current = null;
      if (commitTimerRef.current !== null) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
    };
  }, []);

  // Mouse wheel handler - smooth continuous scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // User is steering again — abort any settle-snap in progress so the
    // wheel input owns scrollOffset.
    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;

    wheelDeltaRef.current += e.deltaY * XMB_CAROUSEL.SCROLL_SENSITIVITY;

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const delta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      animationFrameRef.current = null;

      const newOffset = scrollOffset.get() + delta;
      scrollOffset.set(Math.max(0, Math.min(items.length - 1, newOffset)));
    });
  }, [items.length, scrollOffset]);

  // Touch handlers for mobile swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current) return;

    snapAnimationRef.current?.stop();
    snapAnimationRef.current = null;

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

      const newOffset = scrollOffset.get() + touchDelta;
      scrollOffset.set(Math.max(0, Math.min(items.length - 1, newOffset)));
    });
  }, [items.length, scrollOffset]);

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

  // Mount window is quantized to roundedIndex (culling shouldn't run per
  // frame) at ±(VISIBLE_ITEMS + 1): a superset of the old float-based
  // ±(VISIBLE_ITEMS + 1) window at every offset. For integer i,
  // |i − offset| ≤ V+1 implies |i − round(offset)| ≤ V+1.5, and since the
  // left side is an integer, ≤ V+1 — so a card can never pop in/out
  // mid-flight.
  const visibleEntries = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => Math.abs(index - roundedIndex) <= XMB_CAROUSEL.VISIBLE_ITEMS + 1);
  }, [items, roundedIndex]);

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
      // EASE.EXIT is deliberate here despite being an ease-in: its
      // near-opaque hold (~68% at the midpoint) covers the parent list's
      // concurrent entrance, so the handoff never opens a brightness hole.
      // Swapping in an ease-out would fix the curve and break the cover.
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
                isActive={index === roundedIndex}
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
