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
import { XMB_OVERLAY } from '@/lib/xmb-constants'

// XMB-styled MDX components (theme-aware: xmb-fg token works in both light and dark mode)
export const mdxComponents: MDXComponents = {
    h1: ({ children, ...props }) => (
        <h1 className="text-3xl md:text-4xl font-extralight text-xmb-fg mb-8 mt-12 first:mt-0 tracking-tight leading-tight" {...props}>
            {children}
        </h1>
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
        const inlineComponents = new Set<any>([Badge])

        const containsNonInlineContent = childrenArray.some((child) => {
            if (typeof child === 'string' || typeof child === 'number') return false
            if (!React.isValidElement(child)) return false
            const childType: any = child.type
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
    a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const className = "text-xmb-fg/90 underline underline-offset-4 decoration-xmb-fg/20 hover:decoration-xmb-fg/60 transition-all duration-300"
        if (href?.startsWith('/')) {
            return <Link href={href} className={className} {...props} />
        }
        return <a target="_blank" rel="noopener noreferrer" className={className} {...props} href={href} />
    },
    pre: ({ children }: { children: any }) => {
        return children
    },
    code: ({ children, className, ...props }: { children: string, className?: string, [key: string]: any }) => {
        const isInlineCode = !className
        if (isInlineCode) {
            return (
                <code className="rounded bg-xmb-fg/10 px-1.5 py-0.5 font-mono text-sm text-xmb-fg/90 border border-xmb-fg/10" {...props}>
                    {children}
                </code>
            )
        }
        return (
            <div className="my-8 rounded-xl overflow-hidden border border-xmb-fg/10 shadow-2xl">
                <CodeBlock className={className} {...props}>{children}</CodeBlock>
            </div>
        )
    },
    img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        <div className="my-10 group relative rounded-xl overflow-hidden border border-xmb-fg/10 bg-xmb-fg/5 shadow-2xl transition-all duration-500 hover:border-xmb-fg/30">
            {typeof src === 'string' ? (
                <Image
                    src={src}
                    alt={alt ?? ''}
                    width={1600}
                    height={900}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 65rem"
                    className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
            ) : null}
            {alt && (
                <div className={`absolute bottom-0 inset-x-0 p-4 ${XMB_OVERLAY.BOTTOM_FADE}`}>
                    <p className="text-xs font-mono text-xmb-fg/40 tracking-widest uppercase">{alt}</p>
                </div>
            )}
        </div>
    ),
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

// This file is required for Next.js to import MDX files
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  }
}
