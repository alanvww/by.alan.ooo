// src/lib/xmb-constants.ts

import type { Transition } from 'motion/react';

export const XMB_LAYOUT = {
  CATEGORY_WIDTH: 120,
  VERTICAL_LIST_TOP: '8rem',
  TITLE_ROW_CLEARANCE_PX: 72,
  ABOVE_ROW_STACK_STEP_PX: 10,
  CAROUSEL_WIDTH: '70%',
  // Pinned width of the vertical list in full layout so rows don't reflow
  // when the selected row's content (description / ENTER hint) appears.
  LIST_FULL_WIDTH_PX: 380,
};

/**
 * XMB easing curves — tuned to match the PS3 XMB motion language.
 * Near-instant response with extended smooth deceleration ("glide").
 *
 * MOVE  — primary positional movement, aggressive ease-out
 * ENTER — elements arriving, near-instant kickoff
 * EXIT  — fast departure, clears the stage quickly
 * SOFT  — glows, highlights, subtle ambient state changes
 * FADE  — symmetric crossfades (motion's default easeInOut, made explicit)
 */
export const EASE = {
  MOVE:  [0.16, 1, 0.3, 1]     as [number, number, number, number],
  ENTER: [0.05, 0.7, 0.1, 1.0] as [number, number, number, number],
  EXIT:  [0.4, 0, 1, 1]        as [number, number, number, number],
  SOFT:  [0.25, 0.1, 0.25, 1]  as [number, number, number, number],
  FADE:  [0.42, 0, 0.58, 1]    as [number, number, number, number],
};

/**
 * The one XMB motion timing: a 300ms ease-out tween.
 *
 * DISCOVERY (motion 12.43.0, verified in the installed motion-dom source):
 * this used to be three "spring" configs (SPRING_CONFIG 380/30/0.8,
 * LIST_SPRING 500/32/0.4, ICON_SPRING 550/25/0.2) that all omitted
 * `type: 'spring'`. Every consumer — declarative transition props and
 * imperative animate() on motion values — resolves through motion's
 * animateMotionValue (animation/interfaces/motion-value.mjs), which seeds
 * `ease: "easeOut"` and, with no `type`, falls through to JSAnimation's
 * KEYFRAMES generator (JSAnimation.mjs `const { type = keyframes }`) and its
 * 300ms default duration (generators/keyframes.mjs `duration = 300`). The
 * stiffness/damping/mass numbers were read by nothing: all three configs had
 * ALWAYS shipped as this same 300ms ease-out tween.
 *
 * TWEEN is that shipped feel made honest. Do NOT "fix" it by adding
 * `type: 'spring'` — switching to real springs is a deliberate visual
 * decision that needs design review, not a refactor.
 */
const XMB_TWEEN = {
  type: 'keyframes',
  duration: 0.3,
  ease: 'easeOut',
} satisfies Transition;

export const XMB_ANIMATION = {
  /** For transition props and animate() calls — the animateMotionValue
      paths, whose durations are in SECONDS. */
  TWEEN: XMB_TWEEN,
  /** The SAME tween for useFollowValue/attachFollow followers (XMBCarousel).
      attachFollow builds a JSAnimation directly (value/follow-value.mjs),
      skipping animateMotionValue's seconds→milliseconds conversion, so its
      duration is in MILLISECONDS — and it spreads these options over a
      `type: "spring"` default, so the explicit `type` is load-bearing. */
  FOLLOW_TWEEN: {
    ...XMB_TWEEN,
    duration: XMB_TWEEN.duration * 1000,
  },
} satisfies Record<string, Transition>;

export const XMB_CAROUSEL = {
  VISIBLE_ITEMS: 4,
  ITEM_SPACING: 170,
  SCROLL_SENSITIVITY: 0.008,
};

/**
 * iOS-style "unavailable" deny shake, shared by the vertical-list rows and
 * carousel cards so restricted items feel identical everywhere: a quick
 * horizontal oscillation with decaying amplitude.
 */
export const XMB_SHAKE = {
  KEYFRAMES: [0, -10, 10, -7, 7, -4, 4, 0],
  TRANSITION: { duration: 0.4, ease: 'easeInOut' } as const,
};

/**
 * Touch gesture tuning. All thresholds for swipes, pans, flicks and
 * hold-to-repeat live here so the numbers stay next to EASE/XMB_ANIMATION
 * instead of scattering through components.
 */
export const XMB_GESTURE = {
  /** Minimum horizontal travel for a category/back swipe to commit. */
  SWIPE_THRESHOLD_PX: 50,
  /** Swipes must be this much more horizontal than vertical (|dx| > ratio·|dy|). */
  DIRECTION_LOCK_RATIO: 1.5,
  /** Pan travel (px) per one-row selection step. Gesture-feel constant —
      deliberately shorter than the visual row pitch (~88px mobile) so
      drags feel responsive; not derived from row geometry. */
  DETENT_PX: 64,
  /** Movement beyond this marks the gesture as a pan, not a tap. */
  PAN_SLOP_PX: 10,
  /** Minimum pan-end velocity (px/s) to grant bonus flick steps. */
  FLICK_VELOCITY: 600,
  /** One bonus row per this much velocity, capped at FLICK_MAX_STEPS. */
  FLICK_DIVISOR: 800,
  FLICK_MAX_STEPS: 3,
  /** Per-step delay when a flick commits several rows (staggered ticks). */
  STAGGER_TICK_MS: 40,
  /** Hold-to-repeat on ▲▼ paddles, emulating keyboard auto-repeat. */
  HOLD_REPEAT_DELAY_MS: 350,
  HOLD_REPEAT_INTERVAL_MS: 150,
  /** Swipes starting this close to the left screen edge are ignored so the
      in-folder swipe-back never races the browser's own edge-back gesture. */
  EDGE_GUARD_PX: 30,
  /** How long after a pan a stray trailing click is still swallowed. */
  TAP_SUPPRESS_WINDOW_MS: 150,
};

/**
 * Theme-aware className snippets for layered chrome (overlays, fades, etc.).
 * Kept as classNames, not CSS color tokens: the scrims are the *inverse* of
 * --color-xmb-fg (a dark scrim pairs with the white foreground of the dark
 * theme), so tokenizing them against the fg tokens would flip them.
 */
export const XMB_OVERLAY = {
  /** Full-screen frosted overlay used by post viewer / loading skeleton / 404. */
  FULLSCREEN: 'dark:bg-black/40 bg-white/70 backdrop-blur-2xl',
  /** Vertical fade-to-transparent used by bottom navs and image captions. */
  BOTTOM_FADE: 'bg-linear-to-t dark:from-black/80 from-white/80 to-transparent',
} as const;

export const XMB_ICON_NAMES = [
  'Gear',
  'User', 
  'Atom',
  'Notebook',
  'EnvelopeSimple',
  'Folder',
  'File',
  'CaretRight',
  'Link',
  'ArrowLeft',
  'Question',
  'GithubLogo',
  'InstagramLogo',
  'LinkedinLogo',
  'MastodonLogo',
  'XLogo',
  'Butterfly',
  'ReadCvLogo',
  'FilePdf',
  'ShareNetwork',
  'DownloadSimple',
  'Code',
  'CompassTool',
  'Cube',
  'VirtualReality',
  'Backpack',
  'Crab',
] as const;

export type XMBIconName = (typeof XMB_ICON_NAMES)[number];
