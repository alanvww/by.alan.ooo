import { notFound } from 'next/navigation';
import { getFileData, getFiles, getContentTypes } from '@/lib/mdx';
import { getContentSiblings } from '@/lib/get-content-siblings';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { xmbMdxComponents } from '@/components/xmb/XMBMdxComponents';
import XMBPostViewer from '@/components/xmb/XMBPostViewer';
import XMBContentLayout from '@/components/xmb/XMBContentLayout';

interface PageParams {
  type: string;
  slug: string;
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const types = getContentTypes();
  const params: PageParams[] = [];
  
  for (const type of types) {
    const slugs = await getFiles(type);
    for (const slug of slugs) {
      params.push({ type, slug });
    }
  }
  
  return params;
}

export default async function ContentPage({ params }: { params: Promise<PageParams> }) {
  const { type, slug } = await params;
  
  // Validate type exists
  const validTypes = getContentTypes();
  if (!validTypes.includes(type)) {
    return notFound();
  }

  // Load data inside try/catch, but construct JSX outside of it: errors thrown
  // while rendering the components below would never be caught here anyway.
  let data: Awaited<ReturnType<typeof getFileData>>;
  let siblings: Awaited<ReturnType<typeof getContentSiblings>>;
  try {
    data = await getFileData(type, slug);
    siblings = await getContentSiblings(type, slug);
  } catch (error) {
    console.error(`Error loading ${type}/${slug}:`, error);
    return notFound();
  }

  return (
    <XMBContentLayout>
      <XMBPostViewer
        type={type}
        slug={slug}
        frontmatter={data.frontmatter}
        siblings={siblings}
      >
        <MDXRemote source={data.content} components={xmbMdxComponents} />
      </XMBPostViewer>
    </XMBContentLayout>
  );
}
