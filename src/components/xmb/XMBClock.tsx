// src/components/xmb/XMBClock.tsx
'use client';

import React, { useState, useEffect } from 'react';

const XMBClock = () => {
    const [time, setTime] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/New_York',
        hour12: true
    });

    const tzName = time.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short'
    }).split(' ').pop();

    return (
        <div className="flex items-center gap-3">
            <span className="whitespace-nowrap">{timeString}</span>
            <div className="flex items-center gap-2 text-base">
                 <span className="bg-xmb-fg/20 px-1.5 py-0.5 rounded text-xs font-medium tracking-wider">{tzName}</span>
                 {/* Hidden on ultra-narrow screens (<336px) where the clock
                     can't fit beside the title without clipping. */}
                 <span className="opacity-60 text-sm max-[335px]:hidden">@ NYC</span>
            </div>
        </div>
    );
};

XMBClock.displayName = 'XMBClock';

export default XMBClock;
