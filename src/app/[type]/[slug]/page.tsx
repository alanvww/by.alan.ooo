import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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

// Per-post document titles (WCAG 2.4.2): without this, every post shares the
// root default and prev/next swaps are invisible in the tab title and to AT.
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { type, slug } = await params;
  if (!getContentTypes().includes(type)) {
    return {};
  }
  try {
    const { frontmatter } = await getFileData(type, slug);
    return {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      openGraph: {
        title: frontmatter.title,
        description: frontmatter.excerpt,
        images: frontmatter.coverImage ? [frontmatter.coverImage] : undefined,
      },
    };
  } catch {
    // The page itself resolves this to notFound() with full logging.
    return {};
  }
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
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
          // Screen readers get told about the new tab (3.2.5); visually
          // hidden so prose styling is untouched.
          content: {
            type: 'element',
            tagName: 'span',
            properties: { className: ['sr-only'] },
            children: [{ type: 'text', value: ' (opens in new tab)' }],
          },
        },
      ],
    ],
  };

  // The surrounding shell (header, frosted frame, back button) comes from the
  // persistent [type] layout — this page renders only the per-post content.
  return (
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
  );
}
