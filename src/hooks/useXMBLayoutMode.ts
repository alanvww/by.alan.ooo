// src/hooks/useXMBLayoutMode.ts
'use client';

import { useSyncExternalStore } from 'react';

export type XMBLayoutMode = 'full' | 'paged';

/**
 * Tailwind's `lg` breakpoint. The loading skeleton (XMBLoadingSkeleton)
 * switches layouts statically with `lg:` utilities, so the two must agree.
 */
const FULL_LAYOUT_QUERY = '(min-width: 1024px)';

function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(FULL_LAYOUT_QUERY);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getSnapshot(): XMBLayoutMode {
  return window.matchMedia(FULL_LAYOUT_QUERY).matches ? 'full' : 'paged';
}

// Server snapshot: the skeleton and SSR markup assume the full layout; when
// the client snapshot disagrees React re-renders synchronously during
// hydration, before the first paint — unlike a post-paint ResizeObserver
// effect, which painted the desktop layout on every phone and then swapped.
function getServerSnapshot(): XMBLayoutMode {
  return 'full';
}

/**
 * Which XMB layout the viewport gets: the three-panel 'full' layout at lg
 * and up, the single-stage 'paged' layout below. The menu root is
 * `fixed inset-0`, so the viewport IS the container width.
 */
export function useXMBLayoutMode(): XMBLayoutMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
