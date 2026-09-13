import { XMB_WHEEL } from './xmb-constants';

export interface WheelDelta {
  /** Horizontal travel in normalized CSS pixels (shift+wheel folded in). */
  dx: number;
  /** Vertical travel in normalized CSS pixels. */
  dy: number;
}

/**
 * Normalize a WheelEvent's deltas to CSS pixels, capped per event.
 *
 * `deltaMode` is 0 (pixels) on Chromium and WebKit but 1 (lines) on Firefox
 * with a wheel mouse, where a notch reports `deltaY: 3`. Read as pixels
 * that is 0.024 rows at the shared sensitivity — about 21 notches per
 * selection change. Mode 2 (pages) is scaled by the surface's height.
 *
 * shift+wheel: Chrome, Firefox and Safari already translate it to
 * `deltaX`, so the remap only fires when `deltaX` is still 0 — it must
 * never double-count.
 */
export function normalizeWheelDelta(e: WheelEvent, surface: HTMLElement | null): WheelDelta {
  const k =
    e.deltaMode === 1
      ? XMB_WHEEL.LINE_PX
      : e.deltaMode === 2
        ? surface?.clientHeight || XMB_WHEEL.PAGE_PX
        : 1;
  const cap = XMB_WHEEL.EVENT_CAP_PX;
  let dx = Math.max(-cap, Math.min(cap, e.deltaX * k));
  let dy = Math.max(-cap, Math.min(cap, e.deltaY * k));
  if (e.shiftKey && dx === 0) {
    dx = dy;
    dy = 0;
  }
  return { dx, dy };
}
