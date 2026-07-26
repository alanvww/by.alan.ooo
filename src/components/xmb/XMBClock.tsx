// src/components/xmb/XMBClock.tsx
'use client';

import React, { useState, useEffect } from 'react';

const XMBClock = () => {
    // null until mounted: the page is statically prerendered, so any Date
    // computed during render bakes the *build-time* clock into the HTML and
    // stays visible until hydration (which the WebGL/animation boot can delay
    // by seconds). Same neutral-until-mounted idiom as XMBProgressIndicator.
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        const tick = () => setTime(new Date());
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    // Placeholders share the exact character shape of real values ('en-US'
    // 2-digit/hour12 is always "HH:MM AM|PM"; EST/EDT are both 3 chars), so
    // the fade-in causes zero layout shift.
    const timeString = time?.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/New_York',
        hour12: true
    }) ?? '00:00 PM';

    const tzName = time
        ? time.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            timeZoneName: 'short'
        }).split(' ').pop()
        : 'EST';

    const fadeIn = `transition-opacity duration-300 ${time ? 'opacity-100' : 'opacity-0'}`;

    return (
        <div className="flex items-center gap-3">
            <span className={`whitespace-nowrap tabular-nums ${fadeIn}`} aria-hidden={time === null}>{timeString}</span>
            <div className="flex items-center gap-2 text-base">
                 <span className={`bg-xmb-fg/20 px-1.5 py-0.5 rounded text-xs font-medium tracking-wider ${fadeIn}`} aria-hidden={time === null}>{tzName}</span>
                 {/* Hidden on ultra-narrow screens (<336px) where the clock
                     can't fit beside the title without clipping. */}
                 <span className="opacity-60 text-sm max-[335px]:hidden">@ NYC</span>
            </div>
        </div>
    );
};

XMBClock.displayName = 'XMBClock';

export default XMBClock;
