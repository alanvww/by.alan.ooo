// src/lib/xmb-constants.ts

export const XMB_LAYOUT = {
  CATEGORY_WIDTH: 120,
  VERTICAL_LIST_TOP: '8rem',
  CAROUSEL_WIDTH: '70%',
};

export const XMB_ANIMATION = {
  SPRING_CONFIG: {
    stiffness: 220,
    damping: 40,
    mass: 1,
  },
  LIST_SPRING: {
    stiffness: 300,
    damping: 35,
    mass: 0.5,
  },
  ICON_SPRING: {
    stiffness: 350,
    damping: 30,
    mass: 0.3,
  }
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
