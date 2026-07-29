import { XMBMenuLoadingSkeleton } from '@/components/xmb/XMBLoadingSkeleton';

/**
 * Menu-shaped fallback for the home XMB: the article skeleton's title bars,
 * featured image, and prev/next footer don't exist on the menu, so hard
 * loads used to flash the wrong shape. No XMBContentLayout wrapper — its
 * corner gradient isn't rendered by XMBInterface and would shift on swap;
 * the skeleton draws its own header and transparent shell instead.
 * Registered in LayoutWrapper's DOC_SKELETONS via STANDALONE_DOC_ROUTES
 * (src/lib/xmb-routes.ts).
 */
export default function Loading(): React.ReactElement {
  return <XMBMenuLoadingSkeleton />;
}
