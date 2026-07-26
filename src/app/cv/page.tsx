import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { MDXRemote, type MDXRemoteProps } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { xmbMdxComponents } from '@/components/xmb/XMBMdxComponents';
import XMBContentLayout from '@/components/xmb/XMBContentLayout';
import XMBPostFrame from '@/components/xmb/XMBPostFrame';
import { CVEntry } from '@/components/mdx/CVEntry';

export const metadata: Metadata = {
  title: 'CV',
  description: 'Curriculum vitae of Alan Yam — creative technologist and design engineer.',
};

export default function CVPage(): React.ReactElement {
  // Standalone document: cv.mdx lives at the root of src/content (not inside
  // a type folder), so it never appears in the XMB menu or the [type] routes.
  // No wikilinks here — the file is compiled on its own, outside src/lib/mdx.
  const source = fs.readFileSync(path.join(process.cwd(), 'src/content/cv.mdx'), 'utf8');

  const mdxOptions: NonNullable<MDXRemoteProps['options']>['mdxOptions'] = {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  };

  // XMBPostFrame supplies the frosted backdrop, back button, and
  // Escape-to-home handling — only the scrollable article shell lives here,
  // mirroring the XMBPostViewer layout minus the per-post extras.
  return (
    <XMBContentLayout>
      <XMBPostFrame>
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          {/* Scrollable Content — a real tab stop (2.1.1): there is no keydown
              handler on this page, so a focusable scroll region is the ONLY
              way keyboard users can scroll the CV (native arrow/page keys).
              Its Tab-focus hairline lives in globals.css (the
              [role="region"][tabindex] rule) so the silent-focus gate can
              suppress it — utilities here would out-cascade the gate. */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Curriculum vitae content"
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-32 pb-48 px-6 md:px-0 scroll-smooth motion-reduce:scroll-auto select-text"
          >
            <div className="max-w-4xl mx-auto">
              {/* Header Section */}
              <header className="mb-16 text-center">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className="px-3 py-1 rounded-lg border border-xmb-fg/10 bg-xmb-fg/5 text-[10px] font-mono uppercase tracking-widest text-xmb-fg/40">
                    Curriculum Vitae
                  </span>
                </div>

                <h1 className="text-4xl md:text-7xl font-extralight tracking-tight mb-8 leading-tight">
                  Alan Yam
                </h1>

                {/* Download PDF button temporarily hidden — the PDF is not
                    checked in, so the link 404s. To restore: drop the file at
                    public/assets/cv.pdf, re-import XMBIcon, and bring back:

                    <a
                      href="/assets/cv.pdf"
                      download
                      className="rounded-full border border-xmb-fg/20 bg-xmb-fg/5 px-6 py-3 inline-flex items-center gap-3 text-sm font-mono uppercase tracking-widest hover:bg-xmb-fg/10 hover:border-xmb-fg/40 transition-all"
                    >
                      <XMBIcon name="DownloadSimple" size={18} />
                      Download PDF
                    </a> */}
              </header>

              {/* MDX Content */}
              <div className="prose-container">
                {/* blockJS: false — next-mdx-remote v6 strips JSX attribute
                    expressions (CVEntry's links={[...]}) by default; cv.mdx is
                    trusted local content, and blockDangerousJS stays on. */}
                <MDXRemote
                  source={source}
                  components={{ ...xmbMdxComponents, CVEntry }}
                  options={{ mdxOptions, blockJS: false }}
                />
              </div>
            </div>
          </div>
        </div>
      </XMBPostFrame>
    </XMBContentLayout>
  );
}
