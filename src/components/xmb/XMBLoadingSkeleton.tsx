'use client';

import React from 'react';
import { motion } from 'motion/react';
import { XMB_OVERLAY } from '@/lib/xmb-constants';
import XMBIcon from './XMBIcon';

const ShimmerBar = ({ className }: { className?: string }) => (
    <motion.div
        aria-hidden="true"
        className={`relative overflow-hidden bg-xmb-fg/5 rounded-lg ${className}`}
    >
        <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'linear' 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-xmb-fg/10 to-transparent"
        />
    </motion.div>
);

interface XMBLoadingSkeletonProps {
    /**
     * 'fullscreen' draws its own frosted backdrop and back-button placeholder
     * (standalone overlay, e.g. over the home menu). 'content' fills the
     * persistent XMBPostFrame, which already provides both.
     */
    variant?: 'fullscreen' | 'content';
}

const XMBLoadingSkeleton = ({ variant = 'fullscreen' }: XMBLoadingSkeletonProps) => {
    const isFullscreen = variant === 'fullscreen';

    return (
        <div
            role="status"
            aria-label="Loading"
            className={`${
                isFullscreen ? `fixed inset-0 z-50 ${XMB_OVERLAY.FULLSCREEN}` : 'absolute inset-0'
            } flex flex-col text-xmb-fg overflow-hidden`}
        >
            <span className="sr-only">Loading</span>
            {/* Header / Back (Top Left) */}
            {isFullscreen && (
                <div className="absolute top-8 left-12 z-50">
                    <div className="flex items-center gap-3 text-xmb-fg/20">
                        <div className="w-10 h-10 rounded-full border border-xmb-fg/5 flex items-center justify-center bg-xmb-fg/5">
                            <XMBIcon name="ArrowLeft" size={18} />
                        </div>
                        <div className="h-2 w-24 bg-xmb-fg/5 rounded-full" />
                    </div>
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pt-32 pb-48 px-6 md:px-0 scroll-smooth motion-reduce:scroll-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section Skeleton */}
                    <div className="mb-16 text-center flex flex-col items-center">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <ShimmerBar className="h-6 w-20" />
                            <div className="h-px w-12 bg-xmb-fg/10" />
                            <ShimmerBar className="h-4 w-32" />
                        </div>

                        <ShimmerBar className="h-12 md:h-20 w-3/4 mb-4" />
                        <ShimmerBar className="h-12 md:h-20 w-1/2 mb-8" />

                        <div className="flex flex-wrap justify-center gap-3">
                            <ShimmerBar className="h-6 w-16 rounded-full" />
                            <ShimmerBar className="h-6 w-20 rounded-full" />
                            <ShimmerBar className="h-6 w-24 rounded-full" />
                        </div>
                    </div>

                    {/* Featured Image Skeleton */}
                    <ShimmerBar className="relative aspect-video rounded-2xl border border-xmb-fg/10 mb-24" />

                    {/* Content Skeletons */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-11/12" />
                            <ShimmerBar className="h-4 w-10/12" />
                        </div>
                        <div className="space-y-4">
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-3/4" />
                        </div>
                        <div className="space-y-4">
                            <ShimmerBar className="h-4 w-11/12" />
                            <ShimmerBar className="h-4 w-full" />
                            <ShimmerBar className="h-4 w-1/2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Skeleton — geometry mirrors the real bottom
                nav in XMBPostViewer so the placeholders sit exactly where the
                Previous/Next buttons land when the post arrives. */}
            <div className={`absolute bottom-0 inset-x-0 h-32 ${XMB_OVERLAY.BOTTOM_FADE} pointer-events-none z-40`}>
                <div className="h-full max-w-6xl mx-auto px-6 md:px-12 pb-[env(safe-area-inset-bottom)] flex items-center justify-between pointer-events-none">
                    <div className="flex-1 flex flex-col items-start gap-2">
                        <ShimmerBar className="h-2 w-16" />
                        <ShimmerBar className="h-4 w-32" />
                    </div>

                    <div className="flex-1 flex flex-col items-end gap-2 text-right">
                        <ShimmerBar className="h-2 w-16" />
                        <ShimmerBar className="h-4 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XMBLoadingSkeleton;
