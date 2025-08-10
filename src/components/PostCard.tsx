'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Calendar } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PostCardProps {
    title: string
    excerpt: string
    date: string
    slug: string
    coverImage?: string
}

export default function PostCard({ title, excerpt, date, slug, coverImage }: PostCardProps) {
    return (
        <Link href={`/posts/${slug}`} className="block group h-full">
            <article className="h-full flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
                {coverImage && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
                        <Image
                            src={coverImage}
                            alt={`Cover image for ${title}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                )}

                <div className="space-y-3 flex-grow p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <time className="font-medium">{date}</time>
                    </div>
                    <h3 className="text-base font-semibold leading-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                        {excerpt}
                    </p>
                    <span className="text-sm underline underline-offset-4">Read more</span>
                </div>
            </article>
        </Link>
    )
}
