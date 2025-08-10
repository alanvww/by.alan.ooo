import Hero from '@/components/Hero'
import ProjectList from '@/components/ProjectList'
import PostList from '@/components/PostList'
import { getAllProjects, getAllPosts } from '@/lib/mdx'

export default async function Home() {
    const projects = await getAllProjects()
    const posts = await getAllPosts()

    // Sample project data - you can replace this with actual data from your MDX files
    const featuredProjects = [
        {
            title: "Altify",
            description: "An AI-powered platform for creating and managing digital identities with advanced privacy controls and seamless integration.",
            image: "/assets/projects/altify/demo.png",
            link: "/projects/altify",
            tags: ["AI", "Privacy", "Web3"],
            featured: true
        },
        {
            title: "Gestura",
            description: "A gesture-based interface system that transforms how users interact with digital devices through intuitive hand movements.",
            image: "/assets/projects/gestura/image.png",
            link: "/projects/gestura",
            tags: ["Computer Vision", "UX", "Hardware"],
            featured: true
        },
        {
            title: "Shared Minds",
            description: "A collaborative platform that enables real-time brainstorming and idea sharing with AI-powered insights and organization.",
            image: "/assets/projects/shared-minds/CleanShot 2024-10-01 at 23.50.04@2x.png",
            link: "/projects/shared-minds",
            tags: ["Collaboration", "AI", "Real-time"],
            featured: true
        }
    ]

    // Sample post data - you can replace this with actual data from your MDX files
    const recentPosts = posts.slice(0, 3).map((post: any) => ({
        title: post.title || post.slug,
        excerpt: post.excerpt || "A fascinating exploration of modern web development and creative coding techniques.",
        date: post.date || "2024",
        slug: post.slug,
        coverImage: post.coverImage
    }))

    return (
        <div className="min-h-screen">
            <Hero />
            <section className="px-4 py-12">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-sm font-medium text-muted-foreground mb-4">Selected Work</h2>
                    <ProjectList projects={featuredProjects} showFeatured={true} />
                </div>
            </section>

            <section className="px-4 py-12">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-sm font-medium text-muted-foreground mb-4">Latest Writing</h2>
                    <PostList posts={recentPosts} />
                    <div className="mt-6">
                        <a href="/posts" className="text-sm underline underline-offset-4">View all posts</a>
                    </div>
                </div>
            </section>
        </div>
    )
}
