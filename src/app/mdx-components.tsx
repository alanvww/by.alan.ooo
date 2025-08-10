import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TableOfContents } from '@/components/TableOfContents'
import type { MDXComponents } from 'mdx/types'
import { Alert } from '@/components/mdx/Alert'
import { Badge } from '@/components/mdx/Badge'
import { Card } from '@/components/mdx/Card'
import { Callout } from '@/components/mdx/Callout'
import { Figure } from '@/components/mdx/Figure'
import { CodeBlock } from '@/components/mdx/CodeBlock'
import { Demo } from '@/components/mdx/Demo'
import { Tabs, Tab } from '@/components/mdx/Tabs'

// Export the enhanced components for use with MDXRemote
export const mdxComponents: MDXComponents = {
    // HTML elements with improved styling
    h1: ({ children, ...props }) => (
        <h1 className="scroll-mt-20 text-4xl font-bold text-foreground mb-6 mt-8 first:mt-0" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }) => (
        <h2 className="scroll-mt-20 text-3xl font-semibold text-foreground mb-4 mt-8 first:mt-0" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="scroll-mt-20 text-2xl font-semibold text-foreground mb-3 mt-6 first:mt-0" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }) => (
        <h4 className="scroll-mt-20 text-xl font-medium text-foreground mb-2 mt-4 first:mt-0" {...props}>
            {children}
        </h4>
    ),
    p: ({ children, ...props }) => {
        const childrenArray = React.Children.toArray(children)

        // Inline HTML tags and known inline React components
        const inlineHtmlTags = new Set(['a', 'em', 'strong', 'code', 'span', 'small', 'sup', 'sub', 'kbd', 'i', 'b', 'u'])
        const blockHtmlTags = new Set(['p', 'div', 'pre', 'blockquote', 'table', 'ul', 'ol', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

        // Whitelist custom inline components that are safe inside <p>
        const inlineComponents = new Set<any>([Badge])

        const containsNonInlineContent = childrenArray.some((child) => {
            // Text nodes are always inline
            if (typeof child === 'string' || typeof child === 'number') return false

            if (!React.isValidElement(child)) return false

            const childType: any = child.type

            // Native HTML elements
            if (typeof childType === 'string') {
                if (blockHtmlTags.has(childType)) return true
                return !inlineHtmlTags.has(childType)
            }

            // React components (mapped MDX or custom)
            // If not explicitly marked inline, treat as block to avoid invalid <p> nesting
            return !inlineComponents.has(childType)
        })

        if (containsNonInlineContent) {
            return (
                <div className="mb-4 text-foreground leading-relaxed" {...props}>
                    {children}
                </div>
            )
        }

        return (
            <p className="mb-4 text-foreground leading-relaxed" {...props}>
                {children}
            </p>
        )
    },
    ul: ({ children, ...props }) => (
        <ul className="mb-4 list-disc list-inside space-y-2 text-foreground" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="mb-4 list-decimal list-inside space-y-2 text-foreground" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="text-foreground" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ children, ...props }) => (
        <blockquote className="my-6 border-l-4 border-primary/30 pl-4 italic text-muted-foreground" {...props}>
            {children}
        </blockquote>
    ),
    hr: ({ ...props }) => (
        <hr className="my-8 border-border" {...props} />
    ),
    table: ({ children, ...props }) => (
        <div className="my-6 overflow-x-auto">
            <table className="w-full border-collapse border border-border" {...props}>
                {children}
            </table>
        </div>
    ),
    th: ({ children, ...props }) => (
        <th className="border border-border bg-muted px-4 py-2 text-left font-medium text-foreground" {...props}>
            {children}
        </th>
    ),
    td: ({ children, ...props }) => (
        <td className="border border-border px-4 py-2 text-foreground" {...props}>
            {children}
        </td>
    ),

    // Links with enhanced styling
    a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        if (href?.startsWith('/')) {
            return <Link href={href} className="text-primary hover:underline transition-colors" {...props} />
        }

        if (href?.startsWith('#')) {
            return <a {...props} href={href} className="text-primary hover:underline transition-colors" />
        }

        return <a target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-colors" {...props} href={href} />
    },

    // Enhanced code blocks with syntax highlighting
    pre: ({ children }: { children: any }) => {
        return children
    },
    code: ({ children, className, ...props }: { children: string, className?: string, [key: string]: any }) => {
        const isInlineCode = !className

        if (isInlineCode) {
            return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground" {...props}>
                    {children}
                </code>
            )
        }

        return <CodeBlock className={className} {...props}>{children}</CodeBlock>
    },

    // Next.js components
    Image,

    // Custom components - ensure they are all properly defined
    TableOfContents,
    Callout,
    Figure,
    Demo,
    Alert,
    Card,
    Badge,
    Tabs,
    Tab,
}

// This file is required for Next.js to import MDX files
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  }
}
