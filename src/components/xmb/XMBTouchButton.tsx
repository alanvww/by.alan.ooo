// src/components/xmb/XMBTouchButton.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import XMBKeycap from './XMBKeycap';
import { XMB_GESTURE } from '@/lib/xmb-constants';
import { cn } from '@/lib/utils';

interface XMBTouchButtonProps {
  /** Keycap face, e.g. '◀', '▼', 'OPEN'. */
  label: React.ReactNode;
  /** The shared navigation command to run — commands own their own sounds. */
  onCommand: () => void;
  ariaLabel: string;
  /** Fire repeatedly while held, like keyboard auto-repeat (▲▼ paddles). */
  holdRepeat?: boolean;
  /** Wider-than-square keycap face (ENTER/OPEN/BACK style). */
  wide?: boolean;
  className?: string;
}

/**
 * The pressable keycap: a real button wrapping the XMBKeycap visual, so a
 * touch press lights up exactly like the matching key being held on a
 * keyboard. Fires on pointerdown for console-like immediacy; keyboard and
 * assistive-tech activation still work through the click path.
 */
const XMBTouchButton = ({
  label,
  onCommand,
  ariaLabel,
  holdRepeat = false,
  wide = false,
  className,
}: XMBTouchButtonProps) => {
  const [pressed, setPressed] = useState(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fire = useCallback(() => {
    onCommand();
    // Subtle tick on devices that support it (Android); no-ops on iOS.
    if (typeof navigator !== 'undefined') {
      navigator.vibrate?.(8);
    }
  }, [onCommand]);

  // The hold-repeat interval must always run the LATEST onCommand — commands
  // like the ▲ paddle guard against live selection state, and an interval
  // frozen on the pointerdown-time closure would evaluate that guard against
  // stale values for the whole hold.
  const fireRef = useRef(fire);
  useEffect(() => {
    fireRef.current = fire;
  }, [fire]);

  const clearTimers = useCallback(() => {
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (repeatTimerRef.current !== null) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // One pointer at a time: a second finger's pointerup must not end the
  // first finger's hold-repeat (and its pointerdown must not double-fire).
  const activePointerRef = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Primary button only — a pen barrel press is button 2 and used to
    // fire the command AND open the context menu.
    if (e.button !== 0 || activePointerRef.current !== null) return;
    activePointerRef.current = e.pointerId;
    setPressed(true);
    fire();
    if (holdRepeat) {
      clearTimers();
      delayTimerRef.current = setTimeout(() => {
        repeatTimerRef.current = setInterval(() => fireRef.current(), XMB_GESTURE.HOLD_REPEAT_INTERVAL_MS);
      }, XMB_GESTURE.HOLD_REPEAT_DELAY_MS);
    }
  }, [clearTimers, fire, holdRepeat]);

  const handlePointerEnd = useCallback((e: React.PointerEvent) => {
    if (activePointerRef.current !== null && e.pointerId !== activePointerRef.current) return;
    activePointerRef.current = null;
    setPressed(false);
    clearTimers();
  }, [clearTimers]);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      // Pressable chrome: the root swipe handler ignores touches that start
      // here, so a slide off a keycap can't also switch category.
      data-xmb-chrome=""
      className={cn(
        'min-w-11 min-h-11 flex items-center justify-center touch-manipulation select-none focus-visible:outline-hidden',
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onClick={(e) => {
        // Pointer presses already fired on pointerdown; only keyboard /
        // assistive-tech activation arrives here (detail === 0).
        if (e.detail === 0) {
          fire();
        }
      }}
      onContextMenu={(e) => {
        // A long press on any keycap (the repeat paddles must keep
        // repeating; BACK must not raise the platform callout) never
        // opens the context menu.
        e.preventDefault();
      }}
    >
      <XMBKeycap
        label={label}
        pressed={pressed}
        className={wide ? 'px-1.5 w-auto' : undefined}
      />
    </button>
  );
};

export default XMBTouchButton;
