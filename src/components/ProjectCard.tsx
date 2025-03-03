// Basic structure for PostCard.tsx
import Link from 'next/link'
import Image from 'next/image'

type PostCardProps = {
    title: string
    excerpt: string
    date: string
    slug: string
    coverImage?: string
}

export default function ProjectCard({ title, excerpt, date, slug, coverImage }: PostCardProps) {
    return (
        <Link href={`/posts/${slug}`} className="block group">
            <article className="space-y-4 transition-all duration-200 hover:translate-y-[-4px]">
                {coverImage && (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                        <Image
                            src={coverImage}
                            alt={`Cover image for ${title}`}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <time className="text-sm text-gray-500">{date}</time>
                    <h3 className="text-xl font-medium">{title}</h3>
                    <p className="text-gray-700">{excerpt}</p>
                </div>
            </article>
        </Link>
    )
}