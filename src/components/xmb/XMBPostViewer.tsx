'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DotWavePlaceholder } from '@/components/mdx/DotWavePlaceholder';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { XMB_ANIMATION, EASE, XMB_OVERLAY } from '@/lib/xmb-constants';
import { useReducedMotion } from 'motion/react';
import { useKeyPressed } from '@/hooks/usePressedKeys';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { playNavigate } from '@/hooks/useKeyAudioFx';
import { focusSilently } from '@/lib/focus';
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevPressed = useKeyPressed('ArrowLeft');
    const nextPressed = useKeyPressed('ArrowRight');
    const isCoarse = useCoarsePointer();
    const reduceMotion = useReducedMotion();
    // JS-initiated scrolling honors prefers-reduced-motion (2.3.3); the CSS
    // scroll-behavior is gated separately in globals.css.
    const scrollBehavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';

    // Warm the sibling routes so ←/→ swaps render instantly instead of
    // dropping to the loading skeleton (router.push alone never prefetches).
    useEffect(() => {
        if (siblings.prev) router.prefetch(`/${type}/${siblings.prev.slug}`);
        if (siblings.next) router.prefetch(`/${type}/${siblings.next.slug}`);
    }, [router, siblings, type]);

    // Dot-wave placeholder sits behind the cover until it finishes loading.
    const [coverLoaded, setCoverLoaded] = useState(false);
    const coverRef = useCallback((node: HTMLImageElement | null) => {
        if (node?.complete && node.naturalWidth > 0) setCoverLoaded(true);
    }, []);

    // Reading context enters the article whenever this viewer mounts — first
    // open and every prev/next sibling swap (the old viewer unmounts and
    // focus falls to body). Also claims focus from the frame root: on
    // Suspense-streamed loads the frame's fallback effect fires while the
    // skeleton is up, parking focus there before this viewer exists. Never
    // steals focus a user placed elsewhere (e.g. the frame's back button).
    // focusSilently keeps the :focus-visible ring hidden for this
    // programmatic focus — the ring stays reserved for real Tab visits.
    useEffect(() => {
        const region = scrollContainerRef.current;
        if (!region) return;
        const current = document.activeElement;
        const onFrameFallback = current instanceof HTMLElement && current.dataset.xmbFrame !== undefined;
        // `current === region` re-arms the silent-focus mark on StrictMode's
        // dev replay (the first pass already focused the region and its
        // cleanup unmarked it).
        if (current !== document.body && !onFrameFallback && current !== region) return;
        return focusSilently(region);
    }, []);

    // Handle keyboard navigation. Only ←/→ sibling swaps are intercepted —
    // vertical scrolling (↑/↓, PageUp/Down, Home/End, Space) is left to the
    // browser's native handling of the focused scroll region, same as the CV
    // page: native key-repeat scrolls continuously, where a per-keydown
    // scrollBy restarts its smooth animation on every repeat and crawls.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Modified keys are browser affordances (Alt+Left = history back,
            // Shift+arrows = text selection, Cmd/Ctrl combos = shortcuts) —
            // never hijack them. Same for keys typed into editable UI.
            if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
            const target = e.target;
            if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    if (siblings.prev) {
                        playNavigate();
                        router.push(`/${type}/${siblings.prev.slug}`);
                    }
                    break;
                case 'ArrowRight':
                    if (siblings.next) {
                        playNavigate();
                        router.push(`/${type}/${siblings.next.slug}`);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [router, siblings, type]);

    // The frosted backdrop and back button live in XMBPostFrame (the [type]
    // layout), which persists across sibling navigation — this root only
    // fades the per-post content in over the already-opaque frame.
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.ENTER }}
            className="absolute inset-0 flex flex-col overflow-hidden"
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

            {/* Scrollable Content — a real tab stop (2.1.1): keyboard users
                can focus the scroll region directly, and it receives reading
                focus on mount. Its Tab-focus hairline lives in globals.css
                (the [role="region"][tabindex] rule) so the silent-focus gate
                can suppress it — utilities here would out-cascade the gate. */}
            <div
                ref={scrollContainerRef}
                tabIndex={0}
                role="region"
                aria-label="Article content"
                // Tells the frame's focus fallback to leave this region to
                // the viewer's own mount effect — the frame stamping it on
                // SSR loads, before this Suspense subtree hydrates, would
                // trip React's hydration-mismatch warning.
                data-xmb-viewer-region=""
                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-32 pb-48 px-6 md:px-0 scroll-smooth motion-reduce:scroll-auto select-text"
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
                                    router.push(`/${type}/${siblings.prev!.slug}`);
                                }}
                                className="group pointer-events-auto touch-manipulation min-h-11 flex flex-col items-start justify-center gap-1 text-xmb-fg/70 hover:text-xmb-fg transition-all"
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest">Previous</span>
                                <span className="text-sm font-light tracking-wide flex items-center gap-2">
                                    <XMBIcon name="ArrowLeft" size={12} className="group-hover:-translate-x-1 transition-transform" />
                                    {!isCoarse && <XMBKeycap label="←" hoverable pressed={prevPressed} />}
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
                                    router.push(`/${type}/${siblings.next!.slug}`);
                                }}
                                className="group pointer-events-auto touch-manipulation min-h-11 flex flex-col items-end justify-center gap-1 text-xmb-fg/70 hover:text-xmb-fg transition-all"
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest">Next</span>
                                <span className="text-sm font-light tracking-wide flex items-center gap-2">
                                    <span className="max-w-[32vw] truncate">{siblings.next.title}</span>
                                    {!isCoarse && <XMBKeycap label="→" hoverable pressed={nextPressed} />}
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
                        onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: scrollBehavior })}
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
                            container?.scrollTo({ top: container.scrollHeight, behavior: scrollBehavior });
                        }}
                        className="pointer-events-auto min-w-11 min-h-11 flex items-center justify-center touch-manipulation text-xmb-fg/70 active:text-xmb-fg"
                    >
                        ↓
                    </button>
                </div>
            ) : (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-40 opacity-30 hover:opacity-100 transition-opacity duration-250">
                    <div className="w-px h-32 bg-linear-to-b from-transparent via-xmb-fg/50 to-transparent" />
                    <span className="[writing-mode:vertical-rl] text-[10px] font-mono uppercase tracking-widest">Scroll</span>
                    <div className="w-px h-32 bg-linear-to-t from-transparent via-xmb-fg/50 to-transparent" />
                </div>
            )}
        </motion.div>
    );
};

export default XMBPostViewer;
