import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getAllPosts, getFileData, PostFrontmatter } from '@/lib/mdx'
import { TableOfContents } from '@/components/TableOfContents'
import { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { mdxComponents } from '@/app/mdx-components'
import { Suspense } from 'react'
import type { ReactNode } from 'react'

// Force dynamic rendering to avoid build-time MDX processing issues
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    const posts = await getAllPosts()

    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const post = await getFileData('posts', slug) as PostFrontmatter

    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.date,
            ...(post.coverImage && {
                images: [post.coverImage],
            }),
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            ...(post.coverImage && {
                images: [post.coverImage],
            }),
        },
    }
}

// Loading component for MDX content
function MDXContentLoader() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
    )
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params
        const post = await getFileData('posts', slug) as PostFrontmatter
        
        // Define server-safe components to ensure MDX has them available at render time
        function Alert({ children, variant = 'default', title }: { children: ReactNode, variant?: 'default' | 'destructive' | 'success', title?: string }) {
            return (
                <div className={`my-6 rounded-lg border p-4 ${
                    variant === 'destructive' 
                        ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : variant === 'success'
                        ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'border-border bg-muted/50 text-foreground'
                }`}>
                    {title && (
                        <h4 className="font-semibold mb-2">{title}</h4>
                    )}
                    <div>{children}</div>
                </div>
            )
        }

        function Badge({ children, variant = 'default' }: { children: ReactNode, variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' }) {
            const variants: Record<string, string> = {
                default: 'bg-primary text-primary-foreground',
                secondary: 'bg-secondary text-secondary-foreground',
                outline: 'border border-border bg-background text-foreground',
                success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            }
            return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
                    {children}
                </span>
            )
        }

        function Callout({ children, type = 'info', title }: { children: ReactNode, type?: 'info' | 'warning' | 'success' | 'error' | 'note', title?: string }) {
            const typeStyles: Record<string, string> = {
                info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300',
                success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
                error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
                note: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
            }
            return (
                <div className={`p-4 border-l-4 rounded-r-lg my-6 flex ${typeStyles[type]}`}>
                    <div className="flex-1">
                        {title && <h4 className="font-semibold mb-2">{title}</h4>}
                        <div>{children}</div>
                    </div>
                </div>
            )
        }

        // Get the MDX source content with better error handling
        const fs = await import('fs')
        const path = await import('path')
        const matter = await import('gray-matter')
        
        const filePath = path.join(process.cwd(), 'src/content/posts', `${slug}.mdx`)
        
        if (!fs.existsSync(filePath)) {
            console.error(`Post file not found: ${filePath}`)
            return notFound()
        }
        
        const source = fs.readFileSync(filePath, 'utf8')
        const { content } = matter.default(source)

        return (
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <article className="prose prose-lg dark:prose-invert mx-auto prose-headings:scroll-mt-20">
                    {/* Post Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold mb-4 text-foreground">{post.title}</h1>
                        <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
                            <time dateTime={post.date}>
                                {new Date(post.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </time>
                            {post.readTime && (
                                <span>• {post.readTime} min read</span>
                            )}
                            {post.author && (
                                <span>• By {post.author}</span>
                            )}
                        </div>
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                {post.tags.map((tag) => (
                                    <span key={tag} className="bg-secondary px-3 py-1 rounded-full text-sm text-secondary-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cover Image */}
                    {post.coverImage && (
                        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
                            <Image
                                src={post.coverImage}
                                alt={`Cover image for ${post.title}`}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 65ch"
                            />
                        </div>
                    )}

                    {/* Post Content with Table of Contents */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_250px]">
                        <div className="min-w-0">
                            <Suspense fallback={<MDXContentLoader />}>
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                    <MDXRemote source={content} components={{ ...mdxComponents, Alert, Badge, Callout }} />
                                </div>
                            </Suspense>
                        </div>
                        <aside className="hidden lg:block">
                            <div className="sticky top-8">
                                <Suspense fallback={<div className="h-64 bg-muted/50 rounded-lg animate-pulse"></div>}>
                                    <TableOfContents />
                                </Suspense>
                            </div>
                        </aside>
                    </div>
                </article>
            </div>
        )
    } catch (error) {
        console.error('Error rendering post:', error)
        
        // Provide more specific error handling
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return notFound()
            }
        }
        
        // Fallback error UI
        return (
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-4">
                        Error Loading Post
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Sorry, there was an error loading this post. Please try again later.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }
}
