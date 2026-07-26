'use client';

import { AnimatePresence, motion } from 'motion/react';
import XMBContentTransition from './xmb/XMBContentTransition';
import XMBLoadingSkeleton, {
  CVLoadingSkeleton,
  StackGearLoadingSkeleton,
  XMBMenuLoadingSkeleton,
} from './xmb/XMBLoadingSkeleton';
import XMBLaunchFlash from './xmb/XMBLaunchFlash';
import { useXMBLoadingContext } from '@/lib/xmb-navigation-context';

/**
 * The overlay paints over the destination route's own loading boundary until
 * finishNavigation, so it must match the destination's shape. Every internal
 * href the menu can start a navigation for is the home menu, a standalone
 * document page, or a /[type]/[slug] post — so the article fallback is
 * correct by exhaustion, not a wrong-shape catch-all.
 */
function skeletonForHref(pendingHref: string | null): React.ReactElement {
  if (pendingHref === '/') return <XMBMenuLoadingSkeleton />;
  if (pendingHref === '/cv') return <CVLoadingSkeleton />;
  if (pendingHref === '/stack-and-gear') return <StackGearLoadingSkeleton />;
  return <XMBLoadingSkeleton />;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isNavigating, pendingHref } = useXMBLoadingContext();

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
            {skeletonForHref(pendingHref)}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
