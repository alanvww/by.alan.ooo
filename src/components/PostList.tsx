'use client'

import PostCard from './PostCard'
import { cn } from '@/lib/utils'

interface Post {
    title: string
    excerpt: string
    date: string
    slug: string
    coverImage?: string
}

interface PostListProps {
    posts: Post[]
    className?: string
}

export default function PostList({ posts, className }: PostListProps) {
    if (!posts || posts.length === 0) {
        return (
            <div className={cn("text-center py-12", className)}>
                <p className="text-muted-foreground text-lg">No posts found.</p>
            </div>
        )
    }

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
            {posts.map((post) => (
                <PostCard
                    key={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    date={post.date}
                    slug={post.slug}
                    coverImage={post.coverImage}
                />
            ))}
        </div>
    )
}