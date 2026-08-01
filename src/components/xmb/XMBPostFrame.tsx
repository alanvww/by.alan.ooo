'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { EASE, XMB_OVERLAY } from '@/lib/xmb-constants';
import { useKeyPressed } from '@/hooks/usePressedKeys';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { playCancel } from '@/hooks/useKeyAudioFx';
import { focusSilently } from '@/lib/focus';
import XMBIcon from './XMBIcon';
import XMBKeycap from './XMBKeycap';

/**
 * Persistent chrome of the reading view: the frosted full-screen backdrop and
 * the back-to-menu button. Rendered from the [type] layout, so it mounts once
 * when entering from the XMB menu and stays put while sibling posts swap
 * underneath — the backdrop never blinks, so the menu can't show through
 * between posts.
 */
const XMBPostFrame = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    const router = useRouter();
    const isCoarse = useCoarsePointer();
    const escapePressed = useKeyPressed('Escape');
    const frameRef = useRef<HTMLDivElement | null>(null);

    // Focus fallback when no frame child claims focus on mount: reading
    // context still enters the overlay instead of staying on <body>. Static
    // children (the CV page) are already in the DOM here, so their scroll
    // region is preferred — that's what native arrow/page-key scrolling acts
    // on. The viewer's region is excluded (data-xmb-viewer-region): its own
    // mount effect claims focus, and stamping it here on SSR loads — before
    // its Suspense subtree hydrates — would trip React's hydration-mismatch
    // warning. Streamed posts land on the frame root instead, and the viewer
    // claims focus from it when it mounts (child effects run first, so a
    // viewer that already focused its region makes this a no-op).
    // focusSilently keeps the :focus-visible ring hidden for this
    // programmatic focus — the ring stays reserved for real Tab visits.
    useEffect(() => {
        const region = frameRef.current?.querySelector<HTMLElement>(
            '[role="region"][tabindex]:not([data-xmb-viewer-region])',
        );
        const target = region ?? frameRef.current;
        if (!target) return;
        const current = document.activeElement;
        // `current === target` re-arms the silent-focus mark on StrictMode's
        // dev replay (the first pass already focused the target and its
        // cleanup unmarked it).
        if (current !== document.body && current !== target) return;
        return focusSilently(target);
    }, []);

    // Escape/Backspace → back to the menu. Lives on the frame rather than the
    // per-post content so it keeps working while the next post streams in.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key !== 'Escape' && e.key !== 'Backspace') return;
            // Prevent backspace from navigating back if focused on an input
            if (e.key === 'Backspace' && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                return;
            }
            playCancel();
            router.push('/');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [router]);

    return (
        <motion.div
            ref={frameRef}
            tabIndex={-1}
            data-xmb-frame=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.ENTER }}
            // The frame is the whole viewport — a focus ring on it is noise,
            // so suppress the global :focus-visible ring here only.
            className={`fixed inset-0 z-50 ${XMB_OVERLAY.FULLSCREEN} text-xmb-fg overflow-hidden outline-none focus-visible:ring-0 focus-visible:ring-offset-0`}
        >
            {/* Close Button / Back (Top Left) — before {children} so it is the
                overlay's first tab stop; absolute positioning keeps the visual
                placement identical. */}
            <div className="absolute top-[max(2rem,env(safe-area-inset-top))] left-6 md:left-12 z-50">
                <button
                    onClick={() => {
                        playCancel();
                        router.push('/');
                    }}
                    aria-label="Back to menu"
                    // The pill's own focus treatment (border/bg/label reveal
                    // below) is the indicator — the global ring would double
                    // up, so suppress it (ring-0 alone leaves the 2px offset
                    // halo).
                    className="group flex items-center gap-3 text-xmb-fg/50 hover:text-xmb-fg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:text-xmb-fg touch-manipulation"
                >
                    <div className="flex items-center gap-2 min-h-11 rounded-full border border-xmb-fg/10 bg-xmb-fg/5 px-3 py-2 transition-colors group-hover:border-xmb-fg/30 group-hover:bg-xmb-fg/10 group-focus-visible:border-xmb-fg/40 group-focus-visible:bg-xmb-fg/10 group-active:border-xmb-fg/40 group-active:bg-xmb-fg/15">
                        <XMBIcon name="ArrowLeft" size={18} />
                        {!isCoarse && (
                            <XMBKeycap
                                label="ESC"
                                hoverable
                                pressed={escapePressed}
                                className="px-1.5 w-auto"
                            />
                        )}
                    </div>
                    <span
                        className={`text-xs font-mono uppercase tracking-[0.2em] transition duration-150 ${
                            isCoarse
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 motion-safe:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0'
                        }`}
                    >
                        Back to Menu
                    </span>
                </button>
            </div>

            {children}
        </motion.div>
    );
};

export default XMBPostFrame;
