'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ReactNode } from 'react';
import { EASE } from '@/lib/xmb-constants';

/**
 * Route-transition wrapper. Incoming page zooms from 0.94 with a soft fade,
 * outgoing scales up to 1.08 — together they sell the XMB scene-launch.
 */
export default function XMBContentTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.08 }}
        transition={{ duration: 0.4, ease: EASE.MOVE }}
        className="w-full h-full origin-center"
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
