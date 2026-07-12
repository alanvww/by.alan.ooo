import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'
import { Badge } from '@/components/mdx/Badge'
import { CodeBlock } from '@/components/mdx/CodeBlock'
import { Alert } from '@/components/mdx/Alert'
import { Callout } from '@/components/mdx/Callout'
import { Card } from '@/components/mdx/Card'
import { Figure } from '@/components/mdx/Figure'
import { Demo } from '@/components/mdx/Demo'
import { Tabs, Tab } from '@/components/mdx/Tabs'
import { MDXImage } from '@/components/mdx/MDXImage'
import { getLocalImageDimensions } from '@/lib/content-assets'

const LINK_CLASS = 'text-xmb-fg/90 underline underline-offset-4 decoration-xmb-fg/20 hover:decoration-xmb-fg/60 transition-all duration-300'

// XMB-styled MDX components (theme-aware: xmb-fg token works in both light and dark mode)
export const mdxComponents: MDXComponents = {
    // Rendered as an h2 (same visual treatment): the frontmatter title in the
    // page header is the document's single h1, so a body `#` heading would
    // otherwise create a second one. rehype-slug ids pass through in props,
    // keeping heading anchors working.
    h1: ({ children, ...props }) => (
        <h2 className="text-3xl md:text-4xl font-extralight text-xmb-fg mb-8 mt-12 first:mt-0 tracking-tight leading-tight" {...props}>
            {children}
        </h2>
    ),
    h2: ({ children, ...props }) => (
        <h2 className="text-2xl md:text-3xl font-light text-xmb-fg/90 mb-6 mt-10 first:mt-0 tracking-tight" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="text-xl md:text-2xl font-light text-xmb-fg/80 mb-4 mt-8 first:mt-0" {...props}>
            {children}
        </h3>
    ),
    p: ({ children, ...props }) => {
        const childrenArray = React.Children.toArray(children)
        const inlineHtmlTags = new Set(['a', 'em', 'strong', 'code', 'span', 'small', 'sup', 'sub', 'kbd', 'i', 'b', 'u'])
        const blockHtmlTags = new Set(['p', 'div', 'pre', 'blockquote', 'table', 'ul', 'ol', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        const inlineComponents = new Set<unknown>([Badge])

        const containsNonInlineContent = childrenArray.some((child) => {
            if (typeof child === 'string' || typeof child === 'number') return false
            if (!React.isValidElement(child)) return false
            const childType: unknown = child.type
            if (typeof childType === 'string') {
                if (blockHtmlTags.has(childType)) return true
                return !inlineHtmlTags.has(childType)
            }
            return !inlineComponents.has(childType)
        })

        const className = "mb-6 text-xmb-fg/70 leading-relaxed font-light text-lg md:text-xl"

        if (containsNonInlineContent) {
            return <div className={className} {...props}>{children}</div>
        }

        return <p className={className} {...props}>{children}</p>
    },
    ul: ({ children, ...props }) => (
        <ul className="mb-6 list-disc list-outside ml-6 space-y-3 text-xmb-fg/70 font-light text-lg" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="mb-6 list-decimal list-outside ml-6 space-y-3 text-xmb-fg/70 font-light text-lg" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="pl-2" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ children, ...props }) => (
        <blockquote className="my-10 border-l-2 border-xmb-fg/20 pl-8 py-2 italic text-xmb-fg/60 bg-xmb-fg/5 rounded-r-lg backdrop-blur-sm" {...props}>
            {children}
        </blockquote>
    ),
    hr: ({ ...props }) => (
        <hr className="my-12 border-xmb-fg/10" {...props} />
    ),
    table: ({ children, ...props }) => (
        <div className="my-8 overflow-x-auto rounded-xl border border-xmb-fg/10">
            <table className="w-full text-left text-base text-xmb-fg/70 font-light" {...props}>
                {children}
            </table>
        </div>
    ),
    th: ({ children, ...props }) => (
        <th className="px-4 py-3 bg-xmb-fg/5 border-b border-xmb-fg/10 font-medium text-xmb-fg/80 text-sm uppercase tracking-wider" {...props}>
            {children}
        </th>
    ),
    td: ({ children, ...props }) => (
        <td className="px-4 py-3 border-b border-xmb-fg/5" {...props}>
            {children}
        </td>
    ),
    a: ({ href, className, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        // Heading anchors injected by rehype-autolink-headings style themselves via globals.css.
        if (className?.includes('heading-anchor')) {
            return <a href={href} className={className} {...props}>{children}</a>
        }
        // Unresolved [[wikilinks]] render as inert, visibly-unlinked text.
        if (className?.includes('wikilink-missing')) {
            return (
                <span
                    className="text-xmb-fg/50 border-b border-dashed border-xmb-fg/30 cursor-help"
                    title={props.title}
                >
                    {children}
                </span>
            )
        }
        const mergedClass = className ? `${className} ${LINK_CLASS}` : LINK_CLASS
        if (href?.startsWith('#')) {
            return <a href={href} className={mergedClass} {...props}>{children}</a>
        }
        if (href?.startsWith('/')) {
            return <Link href={href} className={mergedClass} {...props}>{children}</Link>
        }
        // External links: target/rel are set by rehype-external-links.
        return <a className={mergedClass} href={href} {...props}>{children}</a>
    },
    // Code blocks are highlighted by rehype-pretty-code; CodeBlock adds the
    // frame, language label, and copy button around the highlighted <pre>.
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => <CodeBlock {...props} />,
    code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { 'data-language'?: string }) => {
        const isBlockCode = props['data-language'] !== undefined || className?.includes('language-')
        if (isBlockCode) {
            return <code className={className} {...props}>{children}</code>
        }
        return (
            <code className="rounded bg-xmb-fg/10 px-1.5 py-0.5 font-mono text-sm text-xmb-fg/90 border border-xmb-fg/10" {...props}>
                {children}
            </code>
        )
    },
    img: ({ src, alt, title }: React.ImgHTMLAttributes<HTMLImageElement>) => {
        if (typeof src !== 'string' || !src) return null

        // ![alt](src "caption") — the quoted title renders as a visible caption;
        // alt stays purely for accessibility. Dimensions are probed server-side
        // so the dot-wave placeholder occupies the exact final box.
        const dimensions = src.startsWith('/') ? getLocalImageDimensions(src) : null

        return (
            <MDXImage
                src={src}
                alt={alt ?? ''}
                caption={title?.trim() || undefined}
                width={dimensions?.width}
                height={dimensions?.height}
            />
        )
    },
    // Custom MDX components
    Alert,
    Callout,
    Card,
    Figure,
    Demo,
    Tabs,
    Tab,
    Badge,
    Image,
}
