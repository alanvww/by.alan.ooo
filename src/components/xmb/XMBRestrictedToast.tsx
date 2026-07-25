// src/components/xmb/XMBRestrictedToast.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE } from '@/lib/xmb-constants';
import XMBIcon from './XMBIcon';

const TOAST_VISIBLE_MS = 3000;

export interface RestrictedPing {
  /** Item that was denied — the matching row/card runs the shake. */
  id: string;
  /** Increments on every deny so repeat presses re-trigger both effects. */
  nonce: number;
}

interface XMBRestrictedToastProps {
  ping: RestrictedPing | null;
}

/**
 * Frosted pill that surfaces above the command bar when a restricted item
 * is activated, styled to match the command bar chrome. Re-pings reset the
 * auto-dismiss timer. The wrapper stays mounted as a polite live region so
 * screen readers announce the message when it appears.
 */
const XMBRestrictedToast = ({ ping }: XMBRestrictedToastProps) => {
  // Visibility is derived: a ping newer than the last dismissed nonce shows
  // the toast; the timer only ever records a dismissal. Re-pings replace the
  // timer, so the window naturally extends.
  const [dismissedNonce, setDismissedNonce] = useState(0);

  useEffect(() => {
    if (!ping) return;
    const timer = window.setTimeout(() => setDismissedNonce(ping.nonce), TOAST_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [ping]);

  const visible = !!ping && ping.nonce > dismissedNonce;

  return (
    <div
      role="status"
      className="absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] inset-x-0 z-40 pointer-events-none flex justify-center px-4"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="restricted-toast"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15, ease: EASE.EXIT } }}
            transition={{ duration: 0.25, ease: EASE.ENTER }}
            className="flex items-center gap-2.5 rounded-full backdrop-blur-md bg-xmb-fg/10 border border-xmb-fg/20 px-4 py-2 shadow-[0_8px_30px_var(--color-xmb-shadow-glow)]"
          >
            <XMBIcon name="Crab" size={18} />
            {/* Keyed by nonce: a repeat deny while the toast is up swaps the
                text node, so the role=status region re-announces to AT even
                though nothing changes visually. */}
            <span key={ping?.nonce} className="text-xs md:text-sm font-light tracking-wide text-xmb-fg/90">
              This work is under wraps — reach out to me for details.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XMBRestrictedToast;
