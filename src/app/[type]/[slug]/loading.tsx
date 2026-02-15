import XMBLoadingSkeleton from '@/components/xmb/XMBLoadingSkeleton';
import XMBContentLayout from '@/components/xmb/XMBContentLayout';

export default function Loading() {
  return (
    <XMBContentLayout shouldFinishLoading={false}>
      <XMBLoadingSkeleton />
    </XMBContentLayout>
  );
}
