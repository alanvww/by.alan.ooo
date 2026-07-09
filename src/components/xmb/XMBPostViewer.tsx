'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DotWavePlaceholder } from '@/components/mdx/DotWavePlaceholder';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { XMB_ANIMATION, EASE, XMB_OVERLAY } from '@/lib/xmb-constants';
import { useXMBLoadingContext } from '@/lib/xmb-navigation-context';
import { usePressedKeys } from '@/hooks/usePressedKeys';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { playCancel, playNavigate } from '@/hooks/useKeyAudioFx';
import XMBIcon from './XMBIcon';
import XMBKeycap from './XMBKeycap';
import type { PostFrontmatter, ProjectFrontmatter } from '@/lib/mdx';
import type { SiblingInfo } from '@/lib/get-content-siblings';

interface XMBPostViewerProps {
    type: string; // Content type folder name (e.g., 'posts', 'projects')
    slug: string;
    frontmatter: PostFrontmatter | ProjectFrontmatter;
    children: React.ReactNode;
    siblings: SiblingInfo;
}

const XMBPostViewer = ({ type, frontmatter, children, siblings }: XMBPostViewerProps) => {
    const router = useRouter();
    const { startNavigation } = useXMBLoadingContext();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pressedKeys = usePressedKeys();
    const isCoarse = useCoarsePointer();

    // Dot-wave placeholder sits behind the cover until it finishes loading.
    const [coverLoaded, setCoverLoaded] = useState(false);
    const coverRef = useCallback((node: HTMLImageElement | null) => {
        if (node?.complete && node.naturalWidth > 0) setCoverLoaded(true);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const container = scrollContainerRef.current;
            const SCROLL_AMOUNT = 150;
            const PAGE_SCROLL_AMOUNT = 500;

            switch (e.key) {
                case 'Escape':
                case 'Backspace':
                    // Prevent backspace from navigating back if focused on an input
                    if (e.key === 'Backspace' && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                        return;
                    }
                    playCancel();
                    router.push('/');
                    break;
                case 'ArrowLeft':
                    if (siblings.prev) {
                        playNavigate();
                        startNavigation();
                        router.push(`/${type}/${siblings.prev.slug}`);
                    }
                    break;
                case 'ArrowRight':
                    if (siblings.next) {
                        playNavigate();
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

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [router, siblings, type, startNavigation]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.ENTER }}
            className={`fixed inset-0 z-50 flex flex-col ${XMB_OVERLAY.FULLSCREEN} text-xmb-fg overflow-hidden`}
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
                    <div className="absolute inset-0 bg-linear-to-b dark:from-black/60 from-white/60 dark:via-black/40 via-white/40 dark:to-black/80 to-white/80" />
                </div>
            )}

            {/* Close Button / Back (Top Left) */}
            <div className="absolute top-[max(2rem,env(safe-area-inset-top))] left-6 md:left-12 z-50">
                <button
                    onClick={() => {
                        playCancel();
                        router.push('/');
                    }}
                    className="group flex items-center gap-3 text-xmb-fg/50 hover:text-xmb-fg transition-colors duration-300 focus:outline-none touch-manipulation"
                >
                    <div className="flex items-center gap-2 min-h-11 rounded-full border border-xmb-fg/10 bg-xmb-fg/5 px-3 py-2 transition-all group-hover:border-xmb-fg/30 group-hover:bg-xmb-fg/10 group-active:border-xmb-fg/40 group-active:bg-xmb-fg/15">
                        <XMBIcon name="ArrowLeft" size={18} />
                        {!isCoarse && (
                            <XMBKeycap
                                label="ESC"
                                hoverable
                                pressed={pressedKeys.has('Escape')}
                                className="px-1.5 w-auto"
                            />
                        )}
                    </div>
                    <span
                        className={`text-xs font-mono uppercase tracking-[0.2em] transition-all duration-300 ${
                            isCoarse
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                        }`}
                    >
                        Back to Menu
                    </span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-32 pb-48 px-6 md:px-0 scroll-smooth select-text"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <motion.header 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, ...XMB_ANIMATION.SPRING_CONFIG }}
                        className="mb-16 text-center"
                    >
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="px-3 py-1 rounded-lg border border-xmb-fg/10 bg-xmb-fg/5 text-[10px] font-mono uppercase tracking-widest text-xmb-fg/40">
                                {type}
                            </span>
                            <div className="h-px w-12 bg-xmb-fg/10" />
                            <time className="text-xs font-mono text-xmb-fg/40 uppercase tracking-widest">
                                {new Date(frontmatter.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    // Frontmatter dates parse as UTC midnight — format in
                                    // UTC too, or viewers west of GMT see the previous day.
                                    timeZone: 'UTC',
                                })}
                            </time>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-extralight tracking-tight mb-8 leading-tight">
                            {frontmatter.title}
                        </h1>

                        {frontmatter.tags && (
                            <div className="flex flex-wrap justify-center gap-3">
                                {frontmatter.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 bg-xmb-fg/5 rounded-full border border-xmb-fg/10 text-xmb-fg/60">
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
                            transition={{ delay: 0.15, duration: 0.4, ease: EASE.MOVE }}
                            className="relative aspect-video rounded-2xl overflow-hidden border border-xmb-fg/10 shadow-[0_0_80px_var(--color-xmb-shadow-glow)] mb-24"
                        >
                            {!coverLoaded && <DotWavePlaceholder className="absolute inset-0" />}
                            <Image
                                ref={coverRef}
                                src={frontmatter.coverImage}
                                alt={frontmatter.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 1024px"
                                className="object-cover"
                                priority
                                onLoad={() => setCoverLoaded(true)}
                                onError={() => setCoverLoaded(true)}
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-xmb-fg/20 rounded-2xl" />
                        </motion.div>
                    )}

                    {/* MDX Content */}
                    <div className="prose-container">
                        {children}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Controls. The fade strip and its inner
                container stay pointer-events-none — only the buttons take
                pointer events, so touch-scrolls starting in the bottom of the
                screen still reach the article. */}
            <div className={`absolute bottom-0 inset-x-0 h-32 ${XMB_OVERLAY.BOTTOM_FADE} pointer-events-none z-40`}>
                <div className="h-full max-w-6xl mx-auto px-6 md:px-12 pb-[env(safe-area-inset-bottom)] flex items-center justify-between pointer-events-none">
                    {/* Previous */}
                    <div className="flex-1 flex justify-start">
                        {siblings.prev && (
                            <button
                                onClick={() => {
                                    playNavigate();
                                    startNavigation();
                                    router.push(`/${type}/${siblings.prev!.slug}`);
                                }}
                                className="group pointer-events-auto touch-manipulation min-h-11 flex flex-col items-start justify-center gap-1 text-xmb-fg/40 hover:text-xmb-fg transition-all"
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Previous</span>
                                <span className="text-sm font-light tracking-wide flex items-center gap-2">
                                    <XMBIcon name="ArrowLeft" size={12} className="group-hover:-translate-x-1 transition-transform" />
                                    {!isCoarse && <XMBKeycap label="←" hoverable pressed={pressedKeys.has('ArrowLeft')} />}
                                    <span className="max-w-[32vw] truncate">{siblings.prev.title}</span>
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Next */}
                    <div className="flex-1 flex justify-end text-right">
                        {siblings.next && (
                            <button
                                onClick={() => {
                                    playNavigate();
                                    startNavigation();
                                    router.push(`/${type}/${siblings.next!.slug}`);
                                }}
                                className="group pointer-events-auto touch-manipulation min-h-11 flex flex-col items-end justify-center gap-1 text-xmb-fg/40 hover:text-xmb-fg transition-all"
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Next</span>
                                <span className="text-sm font-light tracking-wide flex items-center gap-2">
                                    <span className="max-w-[32vw] truncate">{siblings.next.title}</span>
                                    {!isCoarse && <XMBKeycap label="→" hoverable pressed={pressedKeys.has('ArrowRight')} />}
                                    <XMBIcon name="CaretRight" size={12} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scroll Indicator (Right). Decorative on fine pointers; on touch
                it becomes a pair of jump controls reusing the keyboard
                Home/End scroll behavior. */}
            {isCoarse ? (
                // pointer-events only on the two buttons — swipes over the
                // dividers/label must fall through to the article scroller.
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center z-40 opacity-60 pointer-events-none">
                    <button
                        type="button"
                        aria-label="Scroll to top"
                        onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="pointer-events-auto min-w-11 min-h-11 flex items-center justify-center touch-manipulation text-xmb-fg/70 active:text-xmb-fg"
                    >
                        ↑
                    </button>
                    <div className="w-px h-16 bg-linear-to-b from-transparent via-xmb-fg/50 to-transparent" />
                    <span className="[writing-mode:vertical-rl] text-[10px] font-mono uppercase tracking-widest py-2">Scroll</span>
                    <div className="w-px h-16 bg-linear-to-t from-transparent via-xmb-fg/50 to-transparent" />
                    <button
                        type="button"
                        aria-label="Scroll to bottom"
                        onClick={() => {
                            const container = scrollContainerRef.current;
                            container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                        }}
                        className="pointer-events-auto min-w-11 min-h-11 flex items-center justify-center touch-manipulation text-xmb-fg/70 active:text-xmb-fg"
                    >
                        ↓
                    </button>
                </div>
            ) : (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-40 opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <div className="w-px h-32 bg-linear-to-b from-transparent via-xmb-fg/50 to-transparent" />
                    <span className="[writing-mode:vertical-rl] text-[10px] font-mono uppercase tracking-widest">Scroll</span>
                    <div className="w-px h-32 bg-linear-to-t from-transparent via-xmb-fg/50 to-transparent" />
                </div>
            )}
        </motion.div>
    );
};

export default XMBPostViewer;
