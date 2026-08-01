'use client';

import { useSyncExternalStore } from 'react';

// Module-level key-press store shared by all useKeyPressed subscribers: the
// window listeners attach once (on first subscribe) and every subscriber is
// notified on any key change, but useSyncExternalStore bails out when the
// per-key boolean snapshot is unchanged — so only the keycap whose key
// actually toggled re-renders, never its ancestors.
const heldKeys = new Set<string>();
const storeListeners = new Set<() => void>();

const notifyStore = (): void => {
  for (const listener of storeListeners) listener();
};

const onStoreKeyDown = (event: KeyboardEvent): void => {
  if (heldKeys.has(event.key)) return;
  heldKeys.add(event.key);
  notifyStore();
};

const onStoreKeyUp = (event: KeyboardEvent): void => {
  if (!heldKeys.has(event.key)) return;
  heldKeys.delete(event.key);
  notifyStore();
};

// Focus loss (Cmd+Tab, OS dialogs) swallows the matching keyups, which would
// leave keys stuck "pressed" — long-lived subscribers like XMBPostFrame keep
// the store alive across navigations, so stale state would persist visibly.
const onStoreBlur = (): void => {
  if (heldKeys.size === 0) return;
  heldKeys.clear();
  notifyStore();
};

const subscribeToStore = (listener: () => void): (() => void) => {
  if (storeListeners.size === 0) {
    window.addEventListener('keydown', onStoreKeyDown);
    window.addEventListener('keyup', onStoreKeyUp);
    window.addEventListener('blur', onStoreBlur);
  }
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
    if (storeListeners.size === 0) {
      window.removeEventListener('keydown', onStoreKeyDown);
      window.removeEventListener('keyup', onStoreKeyUp);
      window.removeEventListener('blur', onStoreBlur);
      // With no listeners attached we'd miss keyups, so drop any held state
      // rather than resurrect it as stale "pressed" for the next subscriber.
      heldKeys.clear();
    }
  };
};

/**
 * Whether a single key is currently held down. Subscribing at the leaf
 * keeps keydown/keyup from re-rendering large ancestors (e.g. the command
 * bar's backdrop-blurred pill, where a mid-animation re-render caused
 * jank) — every consumer subscribes per-key through this hook.
 */
export function useKeyPressed(key: string): boolean {
  return useSyncExternalStore(
    subscribeToStore,
    () => heldKeys.has(key),
    // Nothing can be held during SSR/hydration.
    () => false,
  );
}
