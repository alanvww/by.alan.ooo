'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useXMBDerivedContext, useXMBSelectionContext } from '@/lib/xmb-navigation-context';
import { usePressedKeys } from '@/hooks/usePressedKeys';
import { EASE } from '@/lib/xmb-constants';
import { getEnterActionLabel } from '@/lib/xmb-navigation';
import XMBKeycap from './XMBKeycap';

interface KeyHintGlyph {
  label: React.ReactNode;
  pressedKey: string;
  /** Wider than the default 24px square (e.g. for "ENTER" / "ESC"). */
  wide?: boolean;
}

interface Hint {
  id: string;
  keys: KeyHintGlyph[];
  action: string;
}

/**
 * PS3-style command bar: a small, persistent, contextual hint strip pinned to
 * the bottom-center of the XMB scene. Each hint is a keycap (lit when the
 * matching key is held) followed by an action label.
 */
const XMBCommandBar = () => {
  const pressedKeys = usePressedKeys();
  const { itemIndex, navigationPath } = useXMBSelectionContext();
  const { activeItem } = useXMBDerivedContext();

  const onCategoryRow = itemIndex === -1 && navigationPath.length === 0;

  const hints: Hint[] = [];

  if (onCategoryRow) {
    hints.push({
      id: 'switch',
      keys: [
        { label: '←', pressedKey: 'ArrowLeft' },
        { label: '→', pressedKey: 'ArrowRight' },
      ],
      action: 'Switch',
    });
    hints.push({
      id: 'enter',
      keys: [{ label: '↓', pressedKey: 'ArrowDown' }],
      action: 'Enter',
    });
  } else {
    hints.push({
      id: 'navigate',
      keys: [
        { label: '↑', pressedKey: 'ArrowUp' },
        { label: '↓', pressedKey: 'ArrowDown' },
      ],
      action: 'Navigate',
    });

    if (activeItem) {
      hints.push({
        id: 'enter',
        keys: [{ label: 'ENTER', pressedKey: 'Enter', wide: true }],
        action: getEnterActionLabel(activeItem),
      });
    }

    hints.push({
      id: 'back',
      keys: [{ label: 'ESC', pressedKey: 'Escape', wide: true }],
      action: navigationPath.length > 0 ? 'Up' : 'Reset',
    });
  }

  return (
    <motion.div
      className="absolute bottom-6 inset-x-0 z-30 pointer-events-none flex justify-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: EASE.ENTER }}
    >
      <div className="flex items-center gap-5 px-5 py-2.5 rounded-full backdrop-blur-md bg-xmb-fg/5 border border-xmb-fg/15 shadow-[0_8px_30px_var(--color-xmb-shadow-glow)]">
        <AnimatePresence mode="popLayout" initial={false}>
          {hints.map((hint) => (
            <motion.div
              key={hint.id}
              layout
              initial={{ opacity: 0, scale: 0.85, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.85, width: 0 }}
              transition={{ duration: 0.2, ease: EASE.MOVE }}
              className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
            >
              <div className="flex gap-1">
                {hint.keys.map((k, i) => (
                  <XMBKeycap
                    key={i}
                    label={k.label}
                    pressed={pressedKeys.has(k.pressedKey)}
                    className={k.wide ? 'px-1.5 w-auto' : undefined}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-xmb-fg/65">
                {hint.action}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default XMBCommandBar;
