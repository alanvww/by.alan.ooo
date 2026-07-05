'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which keys are currently held down on the window.
 * Returns the same Set reference when nothing changed so consumers
 * don't trigger spurious renders.
 */
export function usePressedKeys(): Set<string> {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      setPressedKeys((prev) => {
        if (prev.has(event.key)) return prev;
        const next = new Set(prev);
        next.add(event.key);
        return next;
      });
    };
    const onUp = (event: KeyboardEvent) => {
      setPressedKeys((prev) => {
        if (!prev.has(event.key)) return prev;
        const next = new Set(prev);
        next.delete(event.key);
        return next;
      });
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  return pressedKeys;
}
