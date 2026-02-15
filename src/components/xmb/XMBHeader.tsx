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
    <div ref={containerRef} className="absolute top-8 inset-x-0 px-12 z-20 pointer-events-auto">
      <div
        className={`flex gap-6 text-2xl font-light opacity-80 tracking-wide ${
          isStacked ? 'flex-col items-start' : 'items-center justify-between'
        }`}
      >
        <div>alan.ooo</div>
        <div
          className={`flex items-center gap-6 ${isStacked ? 'w-full justify-end' : ''}`}
        >
          <XMBClock />
          <XMBProgressIndicator />
        </div>
      </div>
    </div>
  );
};

export default XMBHeader;
