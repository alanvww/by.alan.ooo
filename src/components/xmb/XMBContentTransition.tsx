'use client';

import { ReactNode } from 'react';

/**
 * Route-content wrapper. The scale/fade route transition that used to live
 * here never ran (a keyless AnimatePresence child with initial={false} has
 * no mount to animate and no exit that can fire), but its permanent
 * will-change layer was silently acting as the containing block for the
 * scene's fixed-position children. `contain: layout` preserves that —
 * removing it would re-anchor XMBInterface's fixed inset-0 (and the
 * bottom-anchored command bar) to the taller mobile layout viewport,
 * sinking them under browser chrome.
 */
export default function XMBContentTransition({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full" style={{ contain: 'layout' }}>
      {children}
    </div>
  );
}
