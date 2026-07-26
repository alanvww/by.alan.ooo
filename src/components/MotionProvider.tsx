'use client';

import { MotionConfig } from 'motion/react';

/**
 * App-wide prefers-reduced-motion support (WCAG 2.3.3): motion/react drops
 * transform and layout animations to instant snaps for users whose OS asks
 * for reduced motion, while opacity/color fades stay. Every animate target
 * in the app is its resting pose, so snapping is always layout-safe.
 * Imperative animate() calls on motion values don't read this config and
 * must gate themselves individually (see XMBVerticalList's entrance).
 */
export default function MotionProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
