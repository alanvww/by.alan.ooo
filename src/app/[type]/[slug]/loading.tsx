import XMBLoadingSkeleton from '@/components/xmb/XMBLoadingSkeleton';

/**
 * Article-shaped fallback rendered inside the persistent [type] layout while
 * the next post's payload streams in — the frame, header, and back button
 * stay put; only the content area shimmers.
 */
export default function Loading() {
  return <XMBLoadingSkeleton variant="content" />;
}
