'use client';

import React from 'react';
import { motion } from 'motion/react';
import XMBIcon from './XMBIcon';

const ShimmerBar = ({ className }: { className?: string }) => (
    <motion.div 
        className={`relative overflow-hidden bg-white/5 rounded-lg ${className}`}
    >
        <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'linear' 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
    </motion.div>
);

const XMBLoadingSkeleton = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-2xl text-white overflow-hidden">
            {/* Header / Back (Top Left) */}
            <div className="absolute top-8 left-12 z-50">
                <div className="flex items-center gap-3 text-white/20">
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5">
                        <XMBIcon name="ArrowLeft" size={18} />
                    </div>
                    <div className="h-2 w-24 bg-white/5 rounded-full" />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pt-32 pb-48 px-6 md:px-0 scroll-smooth">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section Skeleton */}
                    <div className="mb-16 text-center flex flex-col items-center">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <ShimmerBar className="h-6 w-20" />
                            <div className="h-px w-12 bg-white/10" />
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
                    <ShimmerBar className="relative aspect-video rounded-2xl border border-white/10 mb-24" />

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

            {/* Bottom Navigation Skeleton */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-linear-to-t from-black/80 to-transparent pointer-events-none z-40">
                <div className="h-full max-w-6xl mx-auto px-12 flex items-center justify-between pointer-events-auto">
                    <div className="flex-1 flex flex-col items-start gap-2">
                        <ShimmerBar className="h-2 w-16" />
                        <ShimmerBar className="h-4 w-32" />
                    </div>

                    <div className="hidden md:flex items-center gap-8 px-8 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                        <ShimmerBar className="h-4 w-48" />
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
