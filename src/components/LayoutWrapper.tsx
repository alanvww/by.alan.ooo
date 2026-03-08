'use client';

import { AnimatePresence, motion } from 'motion/react';
import WebGLBackground from './WebGLBackground';
import XMBContentTransition from './xmb/XMBContentTransition';
import XMBLoadingSkeleton from './xmb/XMBLoadingSkeleton';
import { useXMBNavigationContext } from '@/lib/xmb-navigation-context';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useXMBNavigationContext();

  return (
    <main className="relative w-full h-full overflow-hidden">
      <WebGLBackground />
      <XMBContentTransition>
        {children}
      </XMBContentTransition>
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
