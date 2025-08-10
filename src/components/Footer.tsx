'use client'

import Link from 'next/link'
import { GithubLogo, LinkedinLogo, EnvelopeSimple, Heart } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t border-border/60 mt-16 bg-background/80 backdrop-blur">
            <div className="mx-auto max-w-3xl px-4 py-10">
                <div className="flex flex-col gap-6 text-sm">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="font-mono font-semibold">by/alan</Link>
                        <div className="text-muted-foreground">Brooklyn, NYC</div>
                    </div>
                    <div className="flex flex-wrap gap-6 text-muted-foreground">
                        <a href="mailto:hello@by.alan.ooo" className="underline underline-offset-4">hello@by.alan.ooo</a>
                        <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">GitHub</a>
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">X.com</a>
                    </div>
                    <div className="pt-4 text-xs text-muted-foreground flex items-center justify-between">
                        <span>© {currentYear} Alan</span>
                        <span>Availability: Fully booked</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
