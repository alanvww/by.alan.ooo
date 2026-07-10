'use client';

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { EASE, XMB_OVERLAY } from '@/lib/xmb-constants';
import { useKeyPressed } from '@/hooks/usePressedKeys';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { playCancel } from '@/hooks/useKeyAudioFx';
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.ENTER }}
            className={`fixed inset-0 z-50 ${XMB_OVERLAY.FULLSCREEN} text-xmb-fg overflow-hidden`}
        >
            {children}

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
                                pressed={escapePressed}
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
        </motion.div>
    );
};

export default XMBPostFrame;
