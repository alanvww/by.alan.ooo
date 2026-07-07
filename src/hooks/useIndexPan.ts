// src/hooks/useIndexPan.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PanInfo } from 'motion/react';
import { playNavigate } from '@/hooks/useKeyAudioFx';
import { XMB_GESTURE } from '@/lib/xmb-constants';

interface UseIndexPanOptions {
  /** Committed index at gesture start (read fresh per gesture). */
  getIndex: () => number;
  /** Inclusive clamp bounds for committed indices. */
  getMin: () => number;
  getMax: () => number;
  /** Commit a new (already clamped) index. */
  onCommit: (index: number) => void;
}

export interface IndexPanHandlers {
  onPanStart: () => void;
  onPan: (event: PointerEvent, info: PanInfo) => void;
  onPanEnd: (event: PointerEvent, info: PanInfo) => void;
  /** Attach to the same surface: swallows the stray click a pan leaves behind. */
  onClickCapture: (event: React.MouseEvent) => void;
}

/**
 * Drag-with-snap for the transform-slid XMB lists: vertical pan travel is
 * quantized into discrete index steps (one row per DETENT_PX), driving the
 * same index state the arrow keys drive — never free scroll. Each committed
 * step ticks like a key press; a fast flick grants up to FLICK_MAX_STEPS
 * bonus rows with staggered ticks.
 *
 * All refs are mutated inside event handlers only (React Compiler safe).
 */
export function useIndexPan({ getIndex, getMin, getMax, onCommit }: UseIndexPanOptions): IndexPanHandlers {
  // Index the gesture believes is current — commits are async React state,
  // so tracking our own pending value keeps multi-detent pans consistent
  // within a single event.
  const pendingIndexRef = useRef(0);
  const accumulatedRef = useRef(0);
  const panConsumedRef = useRef(false);
  const panEndedAtRef = useRef(0);
  const flickTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearFlickTimers = useCallback(() => {
    for (const timer of flickTimersRef.current) {
      clearTimeout(timer);
    }
    flickTimersRef.current = [];
  }, []);

  useEffect(() => clearFlickTimers, [clearFlickTimers]);

  const step = useCallback((direction: 1 | -1) => {
    const next = Math.min(getMax(), Math.max(getMin(), pendingIndexRef.current + direction));
    if (next === pendingIndexRef.current) {
      return;
    }
    pendingIndexRef.current = next;
    onCommit(next);
    playNavigate();
  }, [getMax, getMin, onCommit]);

  const onPanStart = useCallback(() => {
    clearFlickTimers();
    pendingIndexRef.current = getIndex();
    accumulatedRef.current = 0;
    panConsumedRef.current = false;
  }, [clearFlickTimers, getIndex]);

  const onPan = useCallback((_event: PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > XMB_GESTURE.PAN_SLOP_PX || Math.abs(info.offset.y) > XMB_GESTURE.PAN_SLOP_PX) {
      panConsumedRef.current = true;
    }

    accumulatedRef.current += info.delta.y;

    // Dragging down (positive y) pulls earlier rows toward the cursor line,
    // i.e. selection moves UP — matching how the container translate
    // (-index * step) responds to arrow keys.
    while (accumulatedRef.current >= XMB_GESTURE.DETENT_PX) {
      accumulatedRef.current -= XMB_GESTURE.DETENT_PX;
      step(-1);
    }
    while (accumulatedRef.current <= -XMB_GESTURE.DETENT_PX) {
      accumulatedRef.current += XMB_GESTURE.DETENT_PX;
      step(1);
    }
  }, [step]);

  const onPanEnd = useCallback((_event: PointerEvent, info: PanInfo) => {
    if (panConsumedRef.current) {
      panEndedAtRef.current = performance.now();
    }

    const velocity = info.velocity.y;
    if (Math.abs(velocity) >= XMB_GESTURE.FLICK_VELOCITY) {
      const direction: 1 | -1 = velocity > 0 ? -1 : 1;
      const bonusSteps = Math.min(
        XMB_GESTURE.FLICK_MAX_STEPS,
        Math.floor(Math.abs(velocity) / XMB_GESTURE.FLICK_DIVISOR),
      );
      for (let i = 1; i <= bonusSteps; i++) {
        flickTimersRef.current.push(
          setTimeout(() => step(direction), i * XMB_GESTURE.STAGGER_TICK_MS),
        );
      }
    }

    accumulatedRef.current = 0;
  }, [step]);

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (
      panConsumedRef.current &&
      performance.now() - panEndedAtRef.current <= XMB_GESTURE.TAP_SUPPRESS_WINDOW_MS
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    panConsumedRef.current = false;
  }, []);

  return { onPanStart, onPan, onPanEnd, onClickCapture };
}
