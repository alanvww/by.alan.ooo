import { notFound } from 'next/navigation';
import { getContentTypes } from '@/lib/mdx';
import XMBContentLayout from '@/components/xmb/XMBContentLayout';
import XMBPostFrame from '@/components/xmb/XMBPostFrame';

/**
 * Shared shell for all posts of a content type. Because the [type] segment
 * value is identical for sibling posts, this layout (header, frosted frame,
 * back button) persists across prev/next navigation — only the [slug] page
 * below it remounts, so the article area is the only thing that swaps.
 */
export default async function ContentTypeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ type: string }>;
}): Promise<React.ReactElement> {
  const { type } = await params;

  if (!getContentTypes().includes(type)) {
    return notFound();
  }

  return (
    <XMBContentLayout>
      <XMBPostFrame>{children}</XMBPostFrame>
    </XMBContentLayout>
  );
}
