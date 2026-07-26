// src/hooks/useCoarsePointer.ts
'use client';

import { useSyncExternalStore } from 'react';

/**
 * Matches touch-first devices (phones, tablets — including iPads in the full
 * XMB layout). `hover: none` filters out touch-capable laptops where a mouse
 * is still the primary pointer.
 */
const COARSE_QUERY = '(hover: none) and (pointer: coarse)';

function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(COARSE_QUERY).matches;
}

// Server snapshot: assume fine pointer so SSR/first paint matches the
// desktop markup; touch chrome appears right after hydration on devices.
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Single source of truth for "is this a touch-first device". Used to swap
 * display-only keyboard hints (keycaps, hover-revealed labels) for their
 * pressable equivalents.
 */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
