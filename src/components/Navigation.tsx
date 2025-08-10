'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { List, X, Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '@/lib/theme-context'

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/posts', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' }
]

export default function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { theme, toggleTheme } = useTheme()
    const pathname = usePathname()
    
    useEffect(() => {
        setMounted(true)
    }, [])
    
    const isDarkMode = theme === 'dark'

    return (
        <nav className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-sm font-mono font-semibold tracking-tight hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                >
                    by/alan
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm text-muted-foreground hover:text-foreground",
                                pathname === link.href && "text-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {mounted && (
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded hover:bg-muted/40"
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}
                </div>

                {/* Mobile */}
                <div className="md:hidden flex items-center gap-2">
                    {mounted && (
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded hover:bg-muted/40"
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded hover:bg-muted/40"
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMenuOpen ? <X size={18} /> : <List size={18} />}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t border-border/60 bg-background/95">
                    <div className="mx-auto max-w-3xl px-4 py-2 flex flex-col">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "py-3 text-sm",
                                    pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    )
}
