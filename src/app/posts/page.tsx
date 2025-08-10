import { getAllPosts } from '@/lib/mdx'
import PostList from '@/components/PostList'

export const metadata = {
    title: 'Blog Posts',
    description: 'Read my latest thoughts and insights on design, development, and technology.',
}

export default async function PostsPage() {
    const posts = await getAllPosts()

    return (
        <div className="px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-2xl font-semibold mb-2">Blog Posts</h1>
                <p className="text-sm text-muted-foreground mb-8">Read my latest thoughts and insights on design, development, and technology.</p>
                {posts.length > 0 ? (
                    <PostList
                        posts={posts.map(p => ({
                            title: p.title,
                            excerpt: p.excerpt,
                            date: p.date,
                            slug: p.slug,
                            coverImage: p.coverImage
                        }))}
                    />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No posts found. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
