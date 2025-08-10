'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GithubLogo, LinkedinLogo, EnvelopeSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export default function Hero() {
    const [mounted, setMounted] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Small delay to trigger animation after mount
        const timer = setTimeout(() => setIsVisible(true), 50)
        return () => clearTimeout(timer)
    }, [])

    return (
        <section className="relative py-20">
            <div className="mx-auto max-w-3xl px-4">
                <div className={cn(
                    "space-y-6 transition-all duration-700",
                    mounted && isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                    <h1 className="text-2xl md:text-3xl font-semibold leading-snug">
                        Hello! I’m Alan, a web developer & creative coder building thoughtful digital experiences.
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Based in Brooklyn. Availability: <span className="text-foreground">Fully booked</span>.
                        {' '}Email <a href="mailto:hello@by.alan.ooo" className="underline underline-offset-4">hello@by.alan.ooo</a>
                    </p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/projects" className="underline underline-offset-4">Work</Link>
                        <Link href="/posts" className="underline underline-offset-4">Feed</Link>
                        <Link href="/about" className="underline underline-offset-4">About</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
