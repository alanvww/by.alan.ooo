// src/components/xmb/XMBProgressIndicator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { EASE } from '@/lib/xmb-constants';

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
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const currentDay = now.getDate() + (now.getHours() / 24);
                value = (currentDay / daysInMonth) * 100;
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
            className="flex items-center gap-3 cursor-pointer group pointer-events-auto"
            onClick={cycleMode}
            title="Click to cycle progress mode"
        >
            <div className="flex items-center gap-0.5">
                {Array.from({ length: totalSegments }).map((_, i) => {
                    const isFilled = i < filledSegments;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02, duration: 0.3, ease: EASE.SOFT }}
                            // border-transparent on the filled branch keeps
                            // border-width constant, so fill flips only tween
                            // paint-tier properties. The parallelogram comes
                            // entirely from the clipPath (motion owns this
                            // element's transform, so an inline skew here
                            // would be silently erased every frame).
                            className={`w-3 h-6 transition-[background-color,box-shadow,border-color] duration-150 ${
                                isFilled
                                    ? 'border border-transparent bg-xmb-fg shadow-[0_0_8px_var(--color-xmb-shadow-glow)]'
                                    : 'border border-xmb-fg/30'
                            }`}
                            style={{
                                clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)'
                            }}
                        />
                    );
                })}
            </div>
            <div className="font-mono text-xs tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] leading-none mb-0.5 text-xmb-fg/60">{progress.label}</div>
                <div className="text-xmb-fg font-semibold">{progress.value.toFixed(3)}%</div>
            </div>
        </div>
    );
};

XMBProgressIndicator.displayName = 'XMBProgressIndicator';

export default XMBProgressIndicator;
