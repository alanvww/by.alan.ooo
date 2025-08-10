'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Link as LinkIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
    title: string
    description: string
    image: string
    link: string
    tags: string[]
    featured?: boolean
}

export default function ProjectCard({ 
    title, 
    description, 
    image, 
    link, 
    tags, 
    featured = false 
}: ProjectCardProps) {
    return (
        <Link
            href={link}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-colors duration-200 hover:border-foreground/40",
                featured && "border-foreground/40"
            )}
        >
            {/* Image Container */}
            <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
                <h3 className="text-base font-semibold leading-tight">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag, index) => (
                        <span key={index} className="text-xs text-muted-foreground">#{tag}</span>
                    ))}
                </div>
            </div>
        </Link>
    )
}
