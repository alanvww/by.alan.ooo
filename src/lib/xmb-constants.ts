// src/lib/xmb-constants.ts

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
 */
export const EASE = {
  MOVE:  [0.16, 1, 0.3, 1]     as [number, number, number, number],
  ENTER: [0.05, 0.7, 0.1, 1.0] as [number, number, number, number],
  EXIT:  [0.4, 0, 1, 1]        as [number, number, number, number],
  SOFT:  [0.25, 0.1, 0.25, 1]  as [number, number, number, number],
};

export const XMB_ANIMATION = {
  // ~150-200ms settle, ~90% critical damping → tiny bounce
  SPRING_CONFIG: {
    stiffness: 380,
    damping: 30,
    mass: 0.8,
  },
  // ~100-150ms settle — list scroll feels instant
  LIST_SPRING: {
    stiffness: 500,
    damping: 32,
    mass: 0.4,
  },
  // ~80-120ms settle — icon scale snaps with micro-bounce
  ICON_SPRING: {
    stiffness: 550,
    damping: 25,
    mass: 0.2,
  },
};

export const XMB_CAROUSEL = {
  VISIBLE_ITEMS: 4,
  ITEM_SPACING: 170,
  SCROLL_SENSITIVITY: 0.008,
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
 * Kept as classNames rather than CSS color tokens so they don't add to the
 * animated @property set on <html> (each animated token paints all consumers
 * for the 300ms transition).
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
] as const;

export type XMBIconName = (typeof XMB_ICON_NAMES)[number];
