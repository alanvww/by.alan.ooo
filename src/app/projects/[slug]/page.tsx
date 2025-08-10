import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getAllProjects, getFileData, ProjectFrontmatter } from '@/lib/mdx';
import { TableOfContents } from '@/components/TableOfContents';
import { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/app/mdx-components';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

// Force dynamic rendering to avoid build-time MDX processing issues
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    const projects = await getAllProjects();
    return projects.map((project) => ({
        slug: project.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const project = await getFileData('projects', slug) as ProjectFrontmatter;

    return {
        title: project.title,
        description: project.excerpt,
        openGraph: {
            title: project.title,
            description: project.excerpt,
            type: 'website',
            ...(project.coverImage && {
                images: [project.coverImage],
            }),
        },
        twitter: {
            card: 'summary_large_image',
            title: project.title,
            description: project.excerpt,
            ...(project.coverImage && {
                images: [project.coverImage],
            }),
        },
    };
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
    );
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const project = await getFileData('projects', slug) as ProjectFrontmatter;
        
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
            );
        }

        function Badge({ children, variant = 'default' }: { children: ReactNode, variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' }) {
            const variants: Record<string, string> = {
                default: 'bg-primary text-primary-foreground',
                secondary: 'bg-secondary text-secondary-foreground',
                outline: 'border border-border bg-background text-foreground',
                success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            };
            return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
                    {children}
                </span>
            );
        }

        function Callout({ children, type = 'info', title }: { children: ReactNode, type?: 'info' | 'warning' | 'success' | 'error' | 'note', title?: string }) {
            const typeStyles: Record<string, string> = {
                info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300',
                success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
                error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
                note: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
            };
            return (
                <div className={`p-4 border-l-4 rounded-r-lg my-6 flex ${typeStyles[type]}`}>
                    <div className="flex-1">
                        {title && <h4 className="font-semibold mb-2">{title}</h4>}
                        <div>{children}</div>
                    </div>
                </div>
            );
        }

        // Get the MDX source content with better error handling
        const fs = await import('fs');
        const path = await import('path');
        const matter = await import('gray-matter');
        
        const filePath = path.join(process.cwd(), 'src/content/projects', `${slug}.mdx`);
        
        if (!fs.existsSync(filePath)) {
            console.error(`Project file not found: ${filePath}`);
            return notFound();
        }
        
        const source = fs.readFileSync(filePath, 'utf8');
        const { content } = matter.default(source);

        return (
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <article className="prose prose-lg dark:prose-invert mx-auto prose-headings:scroll-mt-20">
                    {/* Project Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold mb-4 text-foreground">{project.title}</h1>
                        <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm mb-4">
                            {project.date && (
                                <time dateTime={project.date}>
                                    {new Date(project.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </time>
                            )}
                            {project.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                }`}>
                                    {project.status.replace('-', ' ')}
                                </span>
                            )}
                        </div>
                        
                        {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center mb-6">
                                {project.tags.map((tag) => (
                                    <span key={tag} className="bg-secondary px-3 py-1 rounded-full text-sm text-secondary-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cover Image */}
                    {project.coverImage && (
                        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
                            <Image
                                src={project.coverImage}
                                alt={`Cover image for ${project.title}`}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 65ch"
                            />
                        </div>
                    )}

                    {/* Project Actions */}
                    <div className="mb-8 flex flex-wrap gap-4 justify-center">
                        {project.projectUrl && (
                            <a
                                href={project.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <svg
                                    className="mr-2 h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                                View Live Project
                            </a>
                        )}
                        
                        {project.githubUrl && (
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 text-foreground hover:bg-accent transition-colors"
                            >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                View Source
                            </a>
                        )}
                        
                        {project.demoUrl && (
                            <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 text-foreground hover:bg-accent transition-colors"
                            >
                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Demo
                            </a>
                        )}
                    </div>

                    {/* Project Content with Sidebar */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
                        <div className="min-w-0">
                            <Suspense fallback={<MDXContentLoader />}>
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                    <MDXRemote source={content} components={{ ...mdxComponents, Alert, Badge, Callout }} />
                                </div>
                            </Suspense>
                        </div>
                        
                        <aside className="hidden lg:block">
                            <div className="sticky top-8 space-y-6">
                                {/* Project Overview */}
                                <div className="rounded-lg border bg-card p-6">
                                    <h3 className="mb-4 text-lg font-medium">Project Overview</h3>
                                    <p className="text-muted-foreground">{project.excerpt}</p>
                                </div>

                                {/* Technologies */}
                                {project.technologies && project.technologies.length > 0 && (
                                    <div className="rounded-lg border bg-card p-6">
                                        <h3 className="mb-4 text-lg font-medium">Technologies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {project.technologies.map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Table of Contents */}
                                <div className="rounded-lg border bg-card p-6">
                                    <Suspense fallback={<div className="h-32 bg-muted/50 rounded animate-pulse"></div>}>
                                        <TableOfContents />
                                    </Suspense>
                                </div>
                            </div>
                        </aside>
                    </div>
                </article>
            </div>
        );
    } catch (error) {
        console.error('Error rendering project:', error);
        
        // Provide more specific error handling
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return notFound();
            }
        }
        
        // Fallback error UI
        return (
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-4">
                        Error Loading Project
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Sorry, there was an error loading this project. Please try again later.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
}
