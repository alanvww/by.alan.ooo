'use client';

import { AnimatePresence, motion } from 'motion/react';
import XMBContentTransition from './xmb/XMBContentTransition';
import XMBLoadingSkeleton from './xmb/XMBLoadingSkeleton';
import XMBLaunchFlash from './xmb/XMBLaunchFlash';
import { useXMBLoadingContext } from '@/lib/xmb-navigation-context';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useXMBLoadingContext();

  return (
    <main className="relative w-full h-dvh overflow-hidden">
      <XMBContentTransition>
        {children}
      </XMBContentTransition>
      <XMBLaunchFlash />
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="z-[100]"
          >
            <XMBLoadingSkeleton />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
