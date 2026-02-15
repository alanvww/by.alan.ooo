import { notFound } from 'next/navigation';
import { getFileData, getFiles, getContentTypes, BaseFrontmatter } from '@/lib/mdx';
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

  try {
    const data = await getFileData(type, slug);
    const siblings = await getContentSiblings(type, slug);

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
  } catch (error) {
    console.error(`Error rendering ${type}/${slug}:`, error);
    return notFound();
  }
}
