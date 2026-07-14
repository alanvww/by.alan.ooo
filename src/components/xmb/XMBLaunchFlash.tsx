'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useXMBLoadingContext } from '@/lib/xmb-navigation-context';
import { EASE } from '@/lib/xmb-constants';

/**
 * Brief radial glow flash rendered while a route navigation is in flight.
 * Layered above the page transition and below the loading skeleton so the
 * moment of selection reads as a "launch" rather than a "load".
 */
export default function XMBLaunchFlash() {
  const { isNavigating } = useXMBLoadingContext();

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          key="launch-flash"
          className="absolute inset-0 z-[90] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, times: [0, 0.18, 1], ease: EASE.SOFT }}
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--color-xmb-fg) 20%, transparent), transparent 55%)',
          }}
        />
      )}
    </AnimatePresence>
  );
}
