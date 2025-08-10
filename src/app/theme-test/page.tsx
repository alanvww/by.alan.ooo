'use client'

import { useTheme } from '@/lib/theme-context'
import { Sun, Moon, Check, X, Info, Warning } from '@phosphor-icons/react'

export default function ThemeTestPage() {
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="min-h-screen p-8 space-y-12">
            {/* Theme Toggle Section */}
            <div className="flex items-center justify-between max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-foreground">Theme Color Test</h1>
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span>Toggle to {theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Background and Foreground Test */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Background & Text Colors</h2>
                    <div className="p-6 rounded-lg bg-background border border-border">
                        <p className="text-foreground mb-2">This is foreground text on background.</p>
                        <p className="text-muted-foreground">This is muted foreground text for secondary content.</p>
                    </div>
                </section>

                {/* Card Components */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Card Components</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-lg bg-card border border-border">
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">Card Title</h3>
                            <p className="text-card-foreground">This is a card with proper contrast between background and text.</p>
                        </div>
                        <div className="p-6 rounded-lg bg-secondary text-secondary-foreground">
                            <h3 className="text-lg font-semibold mb-2">Secondary Card</h3>
                            <p>Secondary background with appropriate text color.</p>
                        </div>
                    </div>
                </section>

                {/* Accent and Muted Elements */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Accent & Muted Elements</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-lg bg-accent text-accent-foreground">
                            <h3 className="text-lg font-semibold mb-2">Accent Background</h3>
                            <p>Text on accent background with good readability.</p>
                        </div>
                        <div className="p-6 rounded-lg bg-muted text-muted-foreground">
                            <h3 className="text-lg font-semibold mb-2">Muted Background</h3>
                            <p>Subtle background for less prominent content.</p>
                        </div>
                    </div>
                </section>

                {/* Buttons */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Button Styles</h2>
                    <div className="flex flex-wrap gap-4">
                        <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                            Primary Button
                        </button>
                        <button className="px-6 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
                            Secondary Button
                        </button>
                        <button className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                            Outline Button
                        </button>
                        <button className="px-6 py-2 rounded-lg text-foreground hover:bg-muted transition-colors">
                            Ghost Button
                        </button>
                    </div>
                </section>

                {/* Status Colors */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Status Colors</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-success text-success-foreground flex items-center gap-2">
                            <Check size={20} />
                            <span>Success</span>
                        </div>
                        <div className="p-4 rounded-lg bg-destructive text-destructive-foreground flex items-center gap-2">
                            <X size={20} />
                            <span>Error</span>
                        </div>
                        <div className="p-4 rounded-lg bg-warning text-warning-foreground flex items-center gap-2">
                            <Warning size={20} />
                            <span>Warning</span>
                        </div>
                        <div className="p-4 rounded-lg bg-info text-info-foreground flex items-center gap-2">
                            <Info size={20} />
                            <span>Info</span>
                        </div>
                    </div>
                </section>

                {/* Form Elements */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Form Elements</h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Input field with proper contrast"
                            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <textarea
                            placeholder="Textarea with theme-aware colors"
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </section>

                {/* Glass Effects */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Glass Effects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 rounded-lg glass-effect">
                            <h3 className="text-lg font-semibold text-foreground mb-2">Glass Effect</h3>
                            <p className="text-foreground">Standard glass morphism</p>
                        </div>
                        <div className="p-6 rounded-lg glass-effect-strong">
                            <h3 className="text-lg font-semibold text-foreground mb-2">Strong Glass</h3>
                            <p className="text-foreground">Enhanced glass effect</p>
                        </div>
                        <div className="p-6 rounded-lg glass-effect-premium">
                            <h3 className="text-lg font-semibold text-foreground mb-2">Premium Glass</h3>
                            <p className="text-foreground">Premium glass styling</p>
                        </div>
                    </div>
                </section>

                {/* Typography Hierarchy */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">Typography Hierarchy</h2>
                    <div className="p-6 rounded-lg bg-card border border-border space-y-3">
                        <h1 className="text-4xl font-bold text-card-foreground">Heading 1</h1>
                        <h2 className="text-3xl font-semibold text-card-foreground">Heading 2</h2>
                        <h3 className="text-2xl font-semibold text-card-foreground">Heading 3</h3>
                        <h4 className="text-xl font-medium text-card-foreground">Heading 4</h4>
                        <p className="text-card-foreground">Regular paragraph text with proper contrast for readability in both light and dark themes.</p>
                        <p className="text-muted-foreground text-sm">Small muted text for secondary information.</p>
                    </div>
                </section>
            </div>
        </div>
    )
}
