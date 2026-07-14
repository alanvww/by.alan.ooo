'use client';

import { AnimatePresence, motion } from 'motion/react';
import XMBContentTransition from './xmb/XMBContentTransition';
import XMBLoadingSkeleton, {
  CVLoadingSkeleton,
  StackGearLoadingSkeleton,
} from './xmb/XMBLoadingSkeleton';
import XMBLaunchFlash from './xmb/XMBLaunchFlash';
import { useXMBLoadingContext } from '@/lib/xmb-navigation-context';

/**
 * The overlay paints over the destination route's own loading boundary until
 * finishNavigation, so it must match the destination's shape — the standalone
 * document pages get their own skeletons; everything else is article-shaped.
 */
function skeletonForHref(pendingHref: string | null): React.ReactElement {
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
