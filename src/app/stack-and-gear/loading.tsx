import XMBContentLayout from '@/components/xmb/XMBContentLayout';
import { StackGearLoadingSkeleton } from '@/components/xmb/XMBLoadingSkeleton';

/**
 * Card-grid-shaped fallback: the article skeleton's featured image and
 * prev/next footer don't exist on /stack-and-gear, so falling back to the
 * root loading boundary caused a visible layout jump. LayoutWrapper's
 * navigation overlay renders the same skeleton (via pendingHref), so menu
 * entry and hard loads show one continuous shape until the page lands.
 * Registered in LayoutWrapper's DOC_SKELETONS via STANDALONE_DOC_ROUTES
 * (src/lib/xmb-routes.ts).
 */
export default function Loading(): React.ReactElement {
  return (
    <XMBContentLayout shouldFinishLoading={false}>
      <StackGearLoadingSkeleton />
    </XMBContentLayout>
  );
}
