// src/components/xmb/XMBProgressIndicator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const XMBProgressIndicator = () => {
    type ProgressMode = 'day' | 'month' | 'year';
    const [mode, setMode] = useState<ProgressMode>('day');
    const [progress, setProgress] = useState({ value: 0, label: '' });

    useEffect(() => {
        const updateProgress = () => {
            const now = new Date();
            let value = 0;
            let label = '';

            if (mode === 'day') {
                const totalMinutes = 24 * 60;
                const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
                value = (currentMinutes / totalMinutes) * 100;
                label = 'DAY';
            } else if (mode === 'month') {
                const year = now.getFullYear();
                const month = now.getMonth();
                const startOfMonth = new Date(year, month, 1);
                const endOfMonth = new Date(year, month + 1, 1);
                const totalMs = endOfMonth.getTime() - startOfMonth.getTime();
                const currentMs = now.getTime() - startOfMonth.getTime();
                value = (currentMs / totalMs) * 100;
                label = 'MONTH';
            } else {
                const year = now.getFullYear();
                const startOfYear = new Date(year, 0, 1);
                const endOfYear = new Date(year + 1, 0, 1);
                const totalMs = endOfYear.getTime() - startOfYear.getTime();
                const currentMs = now.getTime() - startOfYear.getTime();
                value = (currentMs / totalMs) * 100;
                label = 'YEAR';
            }

            setProgress({ value, label });
        };

        updateProgress();
        // Optimize interval based on mode
        const interval = mode === 'year' ? 1000 : 60000;
        const timer = setInterval(updateProgress, interval);
        return () => clearInterval(timer);
    }, [mode]);

    const cycleMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMode(prev => {
            if (prev === 'day') return 'month';
            if (prev === 'month') return 'year';
            return 'day';
        });
    };

    const totalSegments = 12;
    const filledSegments = Math.floor((progress.value / 100) * totalSegments);

    return (
        <div 
            className="flex items-center gap-3 cursor-pointer group pointer-events-auto hover:opacity-100 transition-opacity"
            onClick={cycleMode}
            title="Click to cycle progress mode"
        >
            {/* Local AnimatePresence shadows the route transition's
                initial={false} presence context, which would otherwise
                suppress the segments' mount animation entirely. Keying the
                row by mode remounts it on each click so the stagger replays. */}
            <AnimatePresence>
                <div key={mode} className="flex items-center gap-0.5">
                    {Array.from({ length: totalSegments }).map((_, i) => {
                        const isFilled = i < filledSegments;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={`w-3 h-6 transition-all duration-150 ${
                                    isFilled
                                        ? 'bg-xmb-fg shadow-[0_0_8px_var(--color-xmb-shadow-glow)]'
                                        : 'border border-xmb-fg/30'
                                }`}
                                style={{
                                    // skewX (not transform) so it composes with
                                    // the animated scale instead of being
                                    // overwritten by it.
                                    skewX: -15,
                                    clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)'
                                }}
                            />
                        );
                    })}
                </div>
            </AnimatePresence>
            <div className="font-mono text-xs tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] leading-none mb-0.5 text-xmb-fg/60">{progress.label}</div>
                <div className="text-xmb-fg font-semibold">{progress.value.toFixed(3)}%</div>
            </div>
        </div>
    );
};

XMBProgressIndicator.displayName = 'XMBProgressIndicator';

export default XMBProgressIndicator;
