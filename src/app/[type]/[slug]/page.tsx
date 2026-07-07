import { notFound } from 'next/navigation';
import { getFileData, getContentManifest, getContentTypes, getWikilinkIndex } from '@/lib/mdx';
import { getContentSiblings } from '@/lib/get-content-siblings';
import { remarkWikilinks } from '@/lib/remark-wikilinks';
import { MDXRemote, type MDXRemoteProps } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypePrettyCode from 'rehype-pretty-code';
import { xmbMdxComponents } from '@/components/xmb/XMBMdxComponents';
import XMBPostViewer from '@/components/xmb/XMBPostViewer';
import XMBContentLayout from '@/components/xmb/XMBContentLayout';

interface PageParams {
  type: string;
  slug: string;
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const manifest = await getContentManifest();

  return Object.entries(manifest).flatMap(([type, entries]) => {
    return entries.map((entry) => ({ type, slug: entry.slug }));
  });
}

export default async function ContentPage({ params }: { params: Promise<PageParams> }) {
  const { type, slug } = await params;

  // Validate type exists
  const validTypes = getContentTypes();
  if (!validTypes.includes(type)) {
    return notFound();
  }

  let data;
  let siblings;
  let wikilinkIndex;
  try {
    data = await getFileData(type, slug);
    siblings = await getContentSiblings(type, slug);
    wikilinkIndex = await getWikilinkIndex();
  } catch (error) {
    console.error(`Error loading ${type}/${slug}:`, error);
    return notFound();
  }

  const mdxOptions: NonNullable<MDXRemoteProps['options']>['mdxOptions'] = {
    // .md files are plain markdown: no JSX semantics, so prose with { or <
    // written in Obsidian/Zed can never crash the compile. .mdx keeps full power.
    format: data.extension === 'md' ? 'md' : 'mdx',
    remarkPlugins: [
      remarkGfm,
      [
        remarkWikilinks,
        {
          resolve: (key: string) => wikilinkIndex.get(key),
          assetBase: data.basePath,
        },
      ],
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: 'heading-anchor', ariaHidden: true, tabIndex: -1 },
          content: { type: 'text', value: '#' },
        },
      ],
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light-default', dark: 'github-dark-default' },
          keepBackground: false,
          defaultLang: 'plaintext',
        },
      ],
      [
        rehypeExternalLinks,
        { target: '_blank', rel: ['noopener', 'noreferrer'] },
      ],
    ],
  };

  return (
    <XMBContentLayout>
      <XMBPostViewer
        type={type}
        slug={slug}
        frontmatter={data.frontmatter}
        siblings={siblings}
      >
        <MDXRemote
          source={data.content}
          components={xmbMdxComponents}
          options={{ mdxOptions }}
        />
      </XMBPostViewer>
    </XMBContentLayout>
  );
}
