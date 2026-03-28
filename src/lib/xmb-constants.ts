// src/lib/xmb-constants.ts

export const XMB_LAYOUT = {
  CATEGORY_WIDTH: 120,
  VERTICAL_LIST_TOP: '8rem',
  TITLE_ROW_CLEARANCE_PX: 72,
  ABOVE_ROW_STACK_STEP_PX: 10,
  CAROUSEL_WIDTH: '70%',
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
