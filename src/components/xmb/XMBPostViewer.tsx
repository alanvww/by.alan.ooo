'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { XMB_ANIMATION } from '@/lib/xmb-constants';
import { useXMBNavigationContext } from '@/lib/xmb-navigation-context';
import XMBIcon from './XMBIcon';
import type { PostFrontmatter, ProjectFrontmatter } from '@/lib/mdx';
import type { SiblingInfo } from '@/lib/get-content-siblings';

interface XMBPostViewerProps {
    type: string; // Content type folder name (e.g., 'posts', 'projects')
    slug: string;
    frontmatter: PostFrontmatter | ProjectFrontmatter;
    children: React.ReactNode;
    siblings: SiblingInfo;
}

const XMBPostViewer = ({ type, slug, frontmatter, children, siblings }: XMBPostViewerProps) => {
    const router = useRouter();
    const { startNavigation } = useXMBNavigationContext();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const container = scrollContainerRef.current;
            const SCROLL_AMOUNT = 150;
            const PAGE_SCROLL_AMOUNT = 500;
            setPressedKeys(prev => {
                const next = new Set(prev);
                next.add(e.key);
                return next;
            });

            switch (e.key) {
                case 'Escape':
                case 'Backspace':
                    // Prevent backspace from navigating back if focused on an input
                    if (e.key === 'Backspace' && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                        return;
                    }
                    router.push('/');
                    break;
                case 'ArrowLeft':
                    if (siblings.prev) {
                        startNavigation();
                        router.push(`/${type}/${siblings.prev.slug}`);
                    }
                    break;
                case 'ArrowRight':
                    if (siblings.next) {
                        startNavigation();
                        router.push(`/${type}/${siblings.next.slug}`);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (container) {
                        container.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (container) {
                        container.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });
                    }
                    break;
                case 'PageUp':
                    e.preventDefault();
                    if (container) {
                        container.scrollBy({ top: -PAGE_SCROLL_AMOUNT, behavior: 'smooth' });
                    }
                    break;
                case 'PageDown':
                    e.preventDefault();
                    if (container) {
                        container.scrollBy({ top: PAGE_SCROLL_AMOUNT, behavior: 'smooth' });
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    if (container) {
                        container.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    break;
                case 'End':
                    e.preventDefault();
                    if (container) {
                        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                    }
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            setPressedKeys(prev => {
                const next = new Set(prev);
                next.delete(e.key);
                return next;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [router, siblings, type, startNavigation]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-2xl text-white overflow-hidden"
        >
            {/* Background Image (Blurred) */}
            {frontmatter.coverImage && (
                <div className="absolute inset-0 -z-10 opacity-20 overflow-hidden">
                    <Image
                        src={frontmatter.coverImage}
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover blur-3xl scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/80" />
                </div>
            )}

            {/* Close Button / Back (Top Left) */}
            <div className="absolute top-8 left-12 z-50">
                <button 
                    onClick={() => {
                        router.push('/');
                    }}
                    className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-300 focus:outline-none"
                >
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-all group-hover:border-white/30 group-hover:bg-white/10">
                        <XMBIcon name="ArrowLeft" size={18} />
                        <motion.span
                            className={`px-1.5 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all duration-150 hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] ${
                                pressedKeys.has('Escape')
                                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                    : 'border border-white/20 bg-white/5 text-white/70'
                            }`}
                            animate={{ scale: pressedKeys.has('Escape') ? 1.05 : 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            ESC
                        </motion.span>
                    </div>
                    <span className="text-xs font-mono uppercase tracking-[0.2em] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Back to Menu
                    </span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden pt-32 pb-48 px-6 md:px-0 scroll-smooth"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <motion.header 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ...XMB_ANIMATION.SPRING_CONFIG }}
                        className="mb-16 text-center"
                    >
                        <div className="flex items-center justify-center gap-4 mb-8">
                             <span className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40">
                                {type}
                            </span>
                            <div className="h-px w-12 bg-white/10" />
                            <time className="text-xs font-mono text-white/40 uppercase tracking-widest">
                                {new Date(frontmatter.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </time>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-extralight tracking-tight mb-8 leading-tight">
                            {frontmatter.title}
                        </h1>

                        {frontmatter.tags && (
                            <div className="flex flex-wrap justify-center gap-3">
                                {frontmatter.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-white/60">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.header>

                    {/* Featured Image */}
                    {frontmatter.coverImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)] mb-24"
                        >
                            <Image
                                src={frontmatter.coverImage}
                                alt={frontmatter.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 1024px"
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl" />
                        </motion.div>
                    )}

                    {/* MDX Content */}
                    <div className="prose-container">
                        {children}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Controls */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-linear-to-t from-black/80 to-transparent pointer-events-none z-40">
                <div className="h-full max-w-6xl mx-auto px-12 flex items-center justify-between pointer-events-auto">
                    {/* Previous */}
                    <div className="flex-1 flex justify-start">
                        {siblings.prev && (
                            <button 
                                onClick={() => {
                                    startNavigation();
                                    router.push(`/${type}/${siblings.prev!.slug}`);
                                }}
                                className="group flex flex-col items-start gap-1 text-white/40 hover:text-white transition-all"
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Previous</span>
                                <span className="text-sm font-light tracking-wide flex items-center gap-2">
                                    <XMBIcon name="ArrowLeft" size={12} className="group-hover:-translate-x-1 transition-transform" />
                                    <motion.span
                                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all duration-150 hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] ${
                                            pressedKeys.has('ArrowLeft')
                                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                                : 'border border-white/20 bg-white/5 text-white/70'
                                        }`}
                                        animate={{ scale: pressedKeys.has('ArrowLeft') ? 1.05 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    >
                                        ←
                                    </motion.span>
                                    {siblings.prev.title}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Next */}
                    <div className="flex-1 flex justify-end text-right">
                        {siblings.next && (
                            <button 
                                onClick={() => {
                                    startNavigation();
                                    router.push(`/${type}/${siblings.next!.slug}`);
                                }}
                                className="group flex flex-col items-end gap-1 text-white/40 hover:text-white transition-all"
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Next</span>
                                <span className="text-sm font-light tracking-wide flex items-center gap-2">
                                    {siblings.next.title}
                                    <motion.span
                                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all duration-150 hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] ${
                                            pressedKeys.has('ArrowRight')
                                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                                : 'border border-white/20 bg-white/5 text-white/70'
                                        }`}
                                        animate={{ scale: pressedKeys.has('ArrowRight') ? 1.05 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    >
                                        →
                                    </motion.span>
                                    <XMBIcon name="CaretRight" size={12} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scroll Indicator (Right) */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-40 opacity-30 hover:opacity-100 transition-opacity duration-500">
                <div className="w-px h-32 bg-linear-to-b from-transparent via-white/50 to-transparent" />
                <span className="[writing-mode:vertical-rl] text-[10px] font-mono uppercase tracking-widest">Scroll</span>
                <div className="w-px h-32 bg-linear-to-t from-transparent via-white/50 to-transparent" />
            </div>
        </motion.div>
    );
};

export default XMBPostViewer;
