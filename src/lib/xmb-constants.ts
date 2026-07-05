// src/lib/xmb-constants.ts

export const XMB_LAYOUT = {
  CATEGORY_WIDTH: 120,
  VERTICAL_LIST_TOP: '8rem',
  TITLE_ROW_CLEARANCE_PX: 72,
  ABOVE_ROW_STACK_STEP_PX: 10,
  CAROUSEL_WIDTH: '70%',
  // Vertical list row geometry. Sliding container offset = -displayIndex * ROW_STEP_PX.
  LIST_ROW_HEIGHT_PX: 96,
  LIST_ROW_GAP_PX: 32,
  LIST_ROW_STEP_PX: 128, // = LIST_ROW_HEIGHT_PX + LIST_ROW_GAP_PX
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
] as const;

export type XMBIconName = (typeof XMB_ICON_NAMES)[number];
