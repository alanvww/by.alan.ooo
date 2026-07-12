'use client';

import React from 'react';
import XMBIcon from './XMBIcon';
import XMBKeycap from './XMBKeycap';
import { usePressedKeys } from '@/hooks/usePressedKeys';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { playCancel } from '@/hooks/useKeyAudioFx';

interface XMBBackPillProps {
  onBack: () => void;
  /** Text revealed on hover next to the pill (always visible on touch). */
  label?: string;
}

/**
 * Clickable/tappable back affordance, styled like the post viewer's ESC pill.
 * On fine pointers the keycap lights up while the physical Escape key is
 * held; on coarse pointers the keycap is dropped and the label is always
 * visible — a touch user can't hover to discover it.
 */
const XMBBackPill = ({ onBack, label = 'Back' }: XMBBackPillProps) => {
  const pressedKeys = usePressedKeys();
  const isCoarse = useCoarsePointer();

  return (
    <button
      type="button"
      onClick={() => {
        playCancel();
        onBack();
      }}
      // The pill's own focus treatment (border/bg/label reveal below) is the
      // indicator — the global ring would double up, so suppress it (ring-0
      // alone leaves the 2px offset halo).
      className="group flex items-center gap-3 text-xmb-fg/50 hover:text-xmb-fg transition-colors duration-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:text-xmb-fg touch-manipulation"
      aria-label={label}
    >
      <div className="flex items-center gap-2 min-h-11 rounded-full border border-xmb-fg/10 bg-xmb-fg/5 px-3 py-2 transition-all group-hover:border-xmb-fg/30 group-hover:bg-xmb-fg/10 group-focus-visible:border-xmb-fg/40 group-active:border-xmb-fg/40 group-active:bg-xmb-fg/15">
        <XMBIcon name="ArrowLeft" size={18} />
        {!isCoarse && (
          <XMBKeycap
            label="ESC"
            hoverable
            pressed={pressedKeys.has('Escape')}
            className="px-1.5 w-auto"
          />
        )}
      </div>
      <span
        className={`text-xs font-mono uppercase tracking-[0.2em] transition-all duration-300 ${
          isCoarse
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0'
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export default XMBBackPill;
