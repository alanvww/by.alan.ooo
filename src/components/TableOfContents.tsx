'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Heading = {
    id: string
    text: string
    level: number
}

export function TableOfContents() {
    const [headings, setHeadings] = useState<Heading[]>([])
    const [activeId, setActiveId] = useState<string>('')

    useEffect(() => {
        const elements = Array.from(document.querySelectorAll('h2, h3, h4'))
            .filter((element) => element.id)
            .map((element) => ({
                id: element.id,
                text: element.textContent || '',
                level: Number(element.tagName.substring(1))
            }))

        setHeadings(elements)

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: '0px 0px -80% 0px' }
        )

        elements.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) {
                observer.observe(element)
            }
        })

        return () => {
            elements.forEach(({ id }) => {
                const element = document.getElementById(id)
                if (element) {
                    observer.unobserve(element)
                }
            })
        }
    }, [])

    if (headings.length <= 1) {
        return null
    }

    return (
        <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-auto glass-effect p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium">Table of Contents</h3>
            <ul className="space-y-2 text-sm">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className={cn(
                            'transition-colors',
                            heading.level === 3 && 'pl-4',
                            heading.level === 4 && 'pl-8'
                        )}
                    >
                        <a
                            href={`#${heading.id}`}
                            className={cn(
                                'inline-block py-1 transition-colors hover:text-primary',
                                activeId === heading.id
                                    ? 'font-medium text-primary'
                                    : 'text-muted-foreground'
                            )}
                            onClick={(e) => {
                                e.preventDefault()
                                document.querySelector(`#${heading.id}`)?.scrollIntoView({
                                    behavior: 'smooth'
                                })
                                setActiveId(heading.id)
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
