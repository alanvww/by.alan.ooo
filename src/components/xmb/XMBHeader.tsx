'use client';

import React, { useEffect, useRef, useState } from 'react';
import XMBClock from './XMBClock';
import XMBProgressIndicator from './XMBProgressIndicator';

const STACKED_THRESHOLD = 640;

const XMBHeader = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isStacked, setIsStacked] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      const width = entry?.contentRect.width ?? window.innerWidth;
      setIsStacked(width < STACKED_THRESHOLD);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-[max(2rem,env(safe-area-inset-top))] inset-x-0 px-6 md:px-12 z-20 pointer-events-auto"
    >
      <div
        className={`flex gap-4 md:gap-6 text-lg md:text-2xl font-light opacity-80 tracking-wide ${
          isStacked ? 'flex-col items-start' : 'items-center justify-between'
        }`}
      >
        <div>alan.ooo</div>
        {/* flex-wrap + right alignment: on narrow phones the clock/progress
            group wraps instead of overflowing off the left screen edge
            (justify-end used to push the clock to negative x at 390px). */}
        <div
          className={`flex items-center gap-3 md:gap-6 flex-wrap justify-end ${isStacked ? 'w-full' : ''}`}
        >
          <XMBClock />
          <XMBProgressIndicator />
        </div>
      </div>
    </div>
  );
};

export default XMBHeader;
