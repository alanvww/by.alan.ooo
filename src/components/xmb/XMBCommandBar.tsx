'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useXMBDerivedContext, useXMBSelectionContext } from '@/lib/xmb-navigation-context';
import { useKeyPressed } from '@/hooks/usePressedKeys';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { EASE } from '@/lib/xmb-constants';
import { getEnterActionLabel } from '@/lib/xmb-navigation';
import type { XMBCommands } from '@/hooks/useXMBNavigation';
import XMBKeycap from './XMBKeycap';
import XMBTouchButton from './XMBTouchButton';

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

interface TouchControlButton {
  label: React.ReactNode;
  ariaLabel: string;
  onCommand: () => void;
  holdRepeat?: boolean;
  wide?: boolean;
}

interface TouchControl {
  id: string;
  buttons: TouchControlButton[];
  action?: string;
}

interface XMBCommandBarProps {
  commands: XMBCommands;
}

/**
 * Leaf subscriber for a single key's held state. Keeping the subscription
 * here (not in the bar) means keydown/keyup re-render only this keycap —
 * a bar-wide re-render would repaint the backdrop-blurred pill and used to
 * land mid-category-slide, janking the animation.
 */
const HintKeycap = ({ label, pressedKey, wide }: KeyHintGlyph) => {
  const pressed = useKeyPressed(pressedKey);
  return <XMBKeycap label={label} pressed={pressed} className={wide ? 'px-1.5 w-auto' : undefined} />;
};

/**
 * PS3-style command bar. On fine pointers it is the classic contextual hint
 * strip: display keycaps that light up while the matching key is held. On
 * coarse pointers the same frosted pill renders the hints as real pressable
 * keycap buttons wired to the shared navigation commands — the hint strip
 * becomes the controller.
 */
const XMBCommandBar = ({ commands }: XMBCommandBarProps) => {
  const isCoarse = useCoarsePointer();
  const { itemIndex, navigationPath } = useXMBSelectionContext();
  const { activeItem } = useXMBDerivedContext();

  const onCategoryRow = itemIndex === -1 && navigationPath.length === 0;
  const insideFolder = navigationPath.length > 0;

  const hints: Hint[] = [];
  const controls: TouchControl[] = [];

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

    controls.push({
      id: 'switch',
      buttons: [
        { label: '◀', ariaLabel: 'Previous category', onCommand: commands.moveLeft },
        { label: '▶', ariaLabel: 'Next category', onCommand: commands.moveRight },
      ],
      action: 'Switch',
    });
    controls.push({
      id: 'enter',
      buttons: [{ label: '▼', ariaLabel: 'Enter category', onCommand: commands.moveDown }],
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

    controls.push({
      id: 'navigate',
      buttons: [
        {
          label: '▲',
          ariaLabel: 'Previous item',
          // Touch deliberately clamps at the first row inside folders instead
          // of reproducing the keyboard's drive-to--1-in-carousel quirk.
          onCommand: () => {
            if (insideFolder && itemIndex <= 0) return;
            commands.moveUp();
          },
          holdRepeat: true,
        },
        { label: '▼', ariaLabel: 'Next item', onCommand: commands.moveDown, holdRepeat: true },
      ],
      action: 'Navigate',
    });
    if (activeItem) {
      controls.push({
        id: 'open',
        buttons: [{
          label: getEnterActionLabel(activeItem).toUpperCase(),
          ariaLabel: getEnterActionLabel(activeItem),
          onCommand: commands.confirm,
          wide: true,
        }],
      });
    }
    controls.push({
      id: 'back',
      buttons: [{ label: 'BACK', ariaLabel: 'Back', onCommand: commands.back, wide: true }],
    });
  }

  return (
    <motion.div
      className="absolute bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] inset-x-0 z-30 pointer-events-none flex justify-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: EASE.ENTER }}
    >
      <div
        className={`flex items-center rounded-full backdrop-blur-md bg-xmb-fg/5 border border-xmb-fg/15 shadow-[0_8px_30px_var(--color-xmb-shadow-glow)] ${
          isCoarse ? 'pointer-events-auto gap-3 px-3 py-1' : 'gap-5 px-5 py-2.5'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isCoarse
            ? controls.map((control) => (
                <motion.div
                  key={control.id}
                  // Compositor-only swap: animating width here tweened a
                  // layout property, forcing a reflow + re-blur of the
                  // frosted pill every frame — right as categories slide.
                  initial={{ opacity: 0, scaleX: 0.85 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.85 }}
                  transition={{ duration: 0.2, ease: EASE.MOVE }}
                  style={{ transformOrigin: 'left center' }}
                  className="flex items-center gap-1 whitespace-nowrap"
                >
                  {control.buttons.map((button, i) => (
                    <XMBTouchButton
                      key={i}
                      label={button.label}
                      ariaLabel={button.ariaLabel}
                      onCommand={button.onCommand}
                      holdRepeat={button.holdRepeat}
                      wide={button.wide}
                    />
                  ))}
                  {control.action && (
                    <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-xmb-fg/65 pr-1">
                      {control.action}
                    </span>
                  )}
                </motion.div>
              ))
            : hints.map((hint) => (
                <motion.div
                  key={hint.id}
                  // Compositor-only swap: animating width here tweened a
                  // layout property, forcing a reflow + re-blur of the
                  // frosted pill every frame — right as categories slide.
                  initial={{ opacity: 0, scaleX: 0.85 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.85 }}
                  transition={{ duration: 0.2, ease: EASE.MOVE }}
                  style={{ transformOrigin: 'left center' }}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <div className="flex gap-1">
                    {hint.keys.map((k, i) => (
                      <HintKeycap key={i} label={k.label} pressedKey={k.pressedKey} wide={k.wide} />
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
