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
import { normalizePathname, type StandaloneDocRoute } from '@/lib/xmb-routes';

/**
 * The overlay paints over the destination route's own loading boundary until
 * finishNavigation, so it must match the destination's shape. Doc routes are
 * matched on the normalized pathname (query/hash/trailing slash stripped);
 * keying the map by StandaloneDocRoute makes TypeScript demand a skeleton
 * whenever a route joins STANDALONE_DOC_ROUTES. Everything else the menu can
 * navigate to is a /[type]/[slug] post, which the article fallback covers.
 */
const DOC_SKELETONS: Record<StandaloneDocRoute, React.ComponentType> = {
  '/': XMBMenuLoadingSkeleton,
  '/cv': CVLoadingSkeleton,
  '/stack-and-gear': StackGearLoadingSkeleton,
};

const POST_PATHNAME = /^\/[^/]+\/[^/]+$/;

function skeletonForHref(pendingHref: string | null): React.ReactElement {
  const pathname = normalizePathname(pendingHref);
  const DocSkeleton = pathname && DOC_SKELETONS[pathname as StandaloneDocRoute];
  if (DocSkeleton) return <DocSkeleton />;
  if (process.env.NODE_ENV !== 'production' && pathname && !POST_PATHNAME.test(pathname)) {
    console.warn(
      `LayoutWrapper: no skeleton mapped for "${pathname}" — the article-shaped fallback will paint over that route's own loading.tsx. Register it in STANDALONE_DOC_ROUTES and DOC_SKELETONS.`,
    );
  }
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
