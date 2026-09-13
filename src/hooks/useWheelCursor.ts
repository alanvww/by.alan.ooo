'use client';

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { animate } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { normalizeWheelDelta } from '@/lib/wheel';
import { XMB_GESTURE, XMB_WHEEL } from '@/lib/xmb-constants';
import { playNavigate } from '@/hooks/useKeyAudioFx';

/**
 * Imperative handle the vertical list registers so a root-level wheel
 * listener can steer it without lifting its motion values. The list owns
 * the values and the geometry; the hook only writes through this.
 */
export interface XMBWheelDriver {
  /** Continuous selection cursor every row derives its pose from. */
  cursor: MotionValue<number>;
  /** 1 while a row is selected, 0 at category level — the −1 crossfade. */
  selectionLevel: MotionValue<number>;
  /** Re-derive the column translate from the cursor + measured geometry. */
  syncColumnY: () => void;
  /** Gesture open/closed: unmounts the selected row's description while open. */
  setWheelActive: (active: boolean) => void;
  /** Rounded gesture index — drives the highlight chrome only. */
  setGestureIndex: (index: number) => void;
  /** The committed itemIndex as React last rendered it. */
  getCommitted: () => number;
  /** Lowest index the cursor may settle on (−1 = deselect, see itemFloor). */
  getFloor: () => number;
  getMax: () => number;
  /** Flag the next itemIndex change as ours so the list settles with SNAP. */
  markSelfCommit: () => void;
  /** Commit a landed index (XMBInterface's setItemIndex). Owns no sound:
      the hook ticks per row crossing, unlike the carousel, which ticks
      once at its settle — a recorded divergence, aligned later if wanted. */
  commit: (index: number) => void;
}

export interface WheelCursorOptions {
  /** The non-passive listener attaches here (XMBInterface's fixed root). */
  surfaceRef: RefObject<HTMLElement | null>;
  /** Registered by whichever XMBVerticalList is mounted; null between. */
  driverRef: RefObject<XMBWheelDriver | null>;
  /** False while the carousel owns the wheel (full layout inside a folder)
      or the list is empty. */
  enabled: boolean;
  /** XMBInterface's pointer-press guard: a wheel during a held button must
      not move the selection out from under the trailing click. */
  isPointerEvent: () => boolean;
  /** Loading skeleton up: the selection is about to unmount. */
  isNavigating: boolean;
  reduceMotion: boolean;
  categoryCount: number;
  /** Horizontal detents at the root (commands.moveLeft/moveRight, which
      own wrap, per-column recall, path reset and the tick). Null inside a
      folder, where moveRight ACTIVATES the selected item. */
  stepPrev: (() => void) | null;
  stepNext: (() => void) | null;
  /** Paged categories stage: wheel-down enters the active column's list.
      Non-null exactly at that stage — it is the authority over the driver,
      because the list the stage just left stays mounted (driver still
      registered) for its 0.12s exit fade. */
  enterList: (() => void) | null;
  /** The row the hook is visibly on or has just committed — published
      from the moment a gesture arms until React has rendered the hook's
      last commit (notifySelection nulls it). useXMBNavigation's commands
      read it ahead of React's index, so an arrow key or Enter during a
      coast acts on the row the user SEES, and a key that lands in the gap
      between the hook's commit and React's render of it steps from the
      committed row rather than the stale one. */
  liveIndexRef: RefObject<number | null>;
}

export interface WheelCursorHandle {
  /** Drop any in-flight gesture (pending frame, settle timer, momentum)
      and snap the cursor back to the committed row. The commands call
      this first, because a key whose target IS the committed row changes
      no React state and would otherwise leave the coast running. */
  abort: () => void;
  /** Call from a layout effect on every committed selection change: a
      change the hook did not make itself (keypress, click, pan, category
      switch, folder drill) aborts the gesture, or a momentum tail would
      commit an index belonging to the previous state. */
  notifySelection: (itemIndex: number, listKey: string) => void;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * ONE non-passive wheel listener with two branches.
 *
 * Vertical (the list). An ISOLATED mouse notch (deltaMode 1, or a pixel
 * delta at notch size after ≥ NOTCH_GAP_MS of silence) is a discrete
 * step, exactly like ArrowUp/Down: one notch, one row, settled with the
 * carousel's SNAP — and one notch at row 0 deselects. Everything else (a
 * trackpad stream, its momentum tail, a fast free-spin) is the carousel's
 * continuous model: deltas are rAF-batched into a float cursor that rows
 * follow directly, the rounded index hops the highlight and ticks per
 * crossing, and a 50ms quiet-time settle commits Math.round and snaps the
 * remainder. Trackpad momentum is welcome: the coast IS the feel. Below
 * row 0 the cursor parks and `selectionLevel` crossfades toward the −1
 * deselect; only sub-notch travel past row 0 is damped, so a stray flick
 * or tail at the top of a list can't silently drop the user out to the
 * category row.
 *
 * Horizontal (the category row): quantized detents routed through the
 * shared commands. A continuous cursor there was built and removed (see
 * XMBCategoryRow's falloff comment), and the commands own wrap-around,
 * per-column recall, the path reset and the tick. Once a trackpad gesture
 * has decayed past half its peak, at most TAIL_MAX_STEPS further switches
 * land — what a finger flick already gets.
 *
 * Reduced motion: the list never translates continuously — notches step
 * as above, streams accumulate into discrete rate-limited row steps that
 * the list's own reduced branch snaps to. Sound is not motion and keeps
 * ticking per step.
 *
 * Every option is read through one ref so flag flips never re-attach the
 * listener; refs are mutated only inside handlers and effects.
 */
export function useWheelCursor(options: WheelCursorOptions): WheelCursorHandle {
  const opt = useRef(options);
  useLayoutEffect(() => {
    opt.current = options;
  });

  // ── Vertical gesture state ──
  const pos = useRef(0); // float gesture position (rows; < 0 is the deselect band)
  const pend = useRef(0); // px banked for the next frame
  const raf = useRef<number | null>(null);
  const armed = useRef(false);
  const armAcc = useRef(0);
  const redAcc = useRef(0);
  const enterAcc = useRef(0);
  const entered = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(0); // rounded gesture index
  const lastTick = useRef(0);
  const lastStepY = useRef(0);
  // ── Session / horizontal state ──
  const axis = useRef<'x' | 'y' | null>(null);
  const ax = useRef(0);
  const ay = useRef(0);
  const lastEvt = useRef(0);
  const lastStepX = useRef(0);
  const xAcc = useRef(0);
  const peak = useRef(0);
  const tail = useRef(false);
  const tailSteps = useRef(0);
  // True between a category step this hook fired and the abort that
  // notifySelection raises for it, so that abort keeps the horizontal
  // bookkeeping (axis lock, momentum peak, tail cap) the step depends on.
  const selfStep = useRef(false);
  // ── Commit tracking ──
  const expected = useRef<number | null>(null);
  // The hook's own view of the committed index. React batches the settle's
  // setItemIndex and renders on a later task, so a wheel event arriving in
  // that gap would read the STALE index through the driver, re-arm from the
  // old row and then commit backwards. Written at commit, confirmed (or
  // corrected) by notifySelection once React has actually rendered.
  const committed = useRef<number | null>(null);
  const lastListKey = useRef<string | null>(null);
  const abortRef = useRef<((settleCursor: boolean) => void) | null>(null);

  // Attached in the LAYOUT phase, deliberately: the carousel attaches its
  // own listener to the same root from a passive effect and yields on
  // `e.defaultPrevented`, so this listener must be registered FIRST even
  // when both mount in one commit (returning from a post while inside a
  // folder). Layout effects of a commit run before any of its passive
  // effects, and the root ref is attached before them.
  useLayoutEffect(() => {
    const el = opt.current.surfaceRef.current;
    if (!el) return;

    // Committed index as the hook knows it (see `committed` above).
    const getCommitted = (d: XMBWheelDriver): number => committed.current ?? d.getCommitted();

    const tick = (): void => {
      // playNavigate has no internal rate limit; a hard flick crosses rows
      // faster than distinct cues can read.
      const now = performance.now();
      if (now - lastTick.current < XMB_WHEEL.TICK_MIN_GAP_MS) return;
      lastTick.current = now;
      playNavigate();
    };

    const cancelFrame = (): void => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      if (settle.current !== null) {
        clearTimeout(settle.current);
        settle.current = null;
      }
      pend.current = 0;
    };

    const resetVertical = (): void => {
      armAcc.current = 0;
      armed.current = false;
      redAcc.current = 0;
      enterAcc.current = 0;
      entered.current = false;
      const d = opt.current.driverRef.current;
      pos.current = d ? getCommitted(d) : 0;
      active.current = pos.current;
    };

    const resetHorizontal = (): void => {
      axis.current = null;
      ax.current = 0;
      ay.current = 0;
      xAcc.current = 0;
      peak.current = 0;
      tail.current = false;
      tailSteps.current = 0;
    };

    // settleCursor: snap the cursor to the committed row when a gesture
    // was open. The list's own cursor effect stands down while a gesture
    // is open (it would fight the per-frame writes), so every abort that
    // ends an open gesture must settle the cursor itself: the commands'
    // explicit abort (a key whose target is the committed row changes no
    // state at all) and notifySelection's (a click, pan or category
    // switch landed a new index while the coast was live). False only on
    // unmount.
    const abort = (settleCursor: boolean): void => {
      const wasArmed = armed.current;
      cancelFrame();
      opt.current.liveIndexRef.current = null;
      if (selfStep.current) {
        // Our own category step: the list swapped, so the vertical gesture
        // re-seeds on it, but the axis lock and momentum cap live on.
        selfStep.current = false;
        resetVertical();
      } else {
        resetVertical();
        resetHorizontal();
      }
      const d = opt.current.driverRef.current;
      if (!d) return;
      // Unconditional: a same-value setState bails out without a render,
      // and this is the safety net for any path that clears `armed`
      // without closing the gesture.
      d.setWheelActive(false);
      if (settleCursor && wasArmed) {
        const target = getCommitted(d);
        if (opt.current.reduceMotion) {
          d.cursor.jump(Math.max(target, 0));
          d.selectionLevel.jump(clamp(target + 1, 0, 1));
        } else {
          animate(d.cursor, Math.max(target, 0), { ...XMB_WHEEL.SNAP });
          animate(d.selectionLevel, clamp(target + 1, 0, 1), { ...XMB_WHEEL.SNAP });
        }
      }
    };

    const write = (next: number, d: XMBWheelDriver): void => {
      pos.current = next;
      // Below 0 the cursor parks on row 0 and selectionLevel carries the
      // continuous −1 crossfade the row-opacity transform already blends.
      d.cursor.set(Math.max(next, 0));
      d.selectionLevel.set(clamp(next + 1, 0, 1));
      d.syncColumnY();
      const r = Math.round(next);
      opt.current.liveIndexRef.current = r;
      if (r !== active.current) {
        active.current = r;
        d.setGestureIndex(r);
        tick();
      }
    };

    // A discrete row step (isolated notch, reduced-motion detent): commit
    // straight away, like a keypress; the list's cursor effect animates
    // from wherever the cursor visibly is (SNAP when we mark the commit).
    const stepRow = (d: XMBWheelDriver, dir: 1 | -1): void => {
      const current = getCommitted(d);
      const next = clamp(current + dir, d.getFloor(), d.getMax());
      if (next === current) return; // a clamp is silent, like moveUp/moveDown
      expected.current = next;
      committed.current = next;
      opt.current.liveIndexRef.current = next; // until React renders it
      d.markSelfCommit();
      d.commit(next);
      tick();
    };

    const commit = (): void => {
      settle.current = null;
      const d = opt.current.driverRef.current;
      if (!d) return;
      armed.current = false;
      // Math.round(-0.4) is -0, which the clamp and the comparison below
      // treat as 0: the −1 deselect needs strictly more than half a row.
      const landed = clamp(Math.round(pos.current), d.getFloor(), d.getMax());
      pos.current = landed;
      active.current = landed;
      // Stays published (not nulled) until notifySelection: a key arriving
      // between this commit and React's render of it must step from
      // `landed`, not from React's still-stale index.
      opt.current.liveIndexRef.current = landed;
      d.setWheelActive(false); // description remounts on the landed row
      if (landed !== getCommitted(d)) {
        expected.current = landed;
        committed.current = landed;
        d.markSelfCommit(); // the list settles with SNAP, not TWEEN
        d.commit(landed);
      } else if (opt.current.reduceMotion) {
        // Defensive: a preference flip mid-gesture lands the fraction cold.
        d.cursor.jump(Math.max(landed, 0));
        d.selectionLevel.jump(clamp(landed + 1, 0, 1));
      } else {
        // Fraction cleanup only: no tick, no state, no announcement.
        animate(d.cursor, Math.max(landed, 0), { ...XMB_WHEEL.SNAP });
        animate(d.selectionLevel, clamp(landed + 1, 0, 1), { ...XMB_WHEEL.SNAP });
      }
    };

    const flush = (): void => {
      raf.current = null;
      const d = opt.current.driverRef.current;
      if (!d) return;
      const raw = pend.current * XMB_WHEEL.SENSITIVITY;
      pend.current = 0;
      let next: number;
      if (raw < 0 && pos.current + raw < 0) {
        // Travel UP past row 0 is damped — only the part that lies past
        // row 0, so the approach keeps full gain; the documented ~178px
        // from row 0 to the deselect is unchanged.
        next = pos.current > 0
          ? (pos.current + raw) * XMB_WHEEL.DESELECT_RESISTANCE
          : pos.current + raw * XMB_WHEEL.DESELECT_RESISTANCE;
      } else {
        next = pos.current + raw;
      }
      // Hard clamp at both ends, no rubber band — the carousel's rule.
      write(clamp(next, d.getFloor(), d.getMax()), d);
      if (settle.current !== null) clearTimeout(settle.current);
      settle.current = setTimeout(commit, XMB_WHEEL.SETTLE_MS);
    };

    const onWheel = (e: WheelEvent): void => {
      const O = opt.current;
      // Bail-outs, all before any preventDefault.
      if (e.ctrlKey || e.metaKey) return; // browser / pinch zoom
      if (e.defaultPrevented) return; // the carousel already consumed it
      if (!O.enabled) return;
      if (O.isPointerEvent()) return;
      if (O.isNavigating) return;

      const now = performance.now();
      const idle = now - lastEvt.current;
      lastEvt.current = now;
      if (idle > XMB_WHEEL.GESTURE_IDLE_MS) {
        // A finished gesture: everything resets, including the momentum
        // bookkeeping (which an in-session category step must NOT touch).
        resetVertical();
        resetHorizontal();
      }

      const { dx, dy } = normalizeWheelDelta(e, el);
      ax.current += Math.abs(dx);
      ay.current += Math.abs(dy);
      if (
        axis.current === null &&
        (ax.current > XMB_WHEEL.AXIS_LOCK_PX || ay.current > XMB_WHEEL.AXIS_LOCK_PX)
      ) {
        axis.current =
          e.shiftKey || ax.current > XMB_GESTURE.DIRECTION_LOCK_RATIO * ay.current ? 'x' : 'y';
      }

      // ── Horizontal: quantized detents through the shared commands ──────
      if (axis.current === 'x') {
        if (!O.stepPrev || !O.stepNext) return; // inert inside a folder
        if (O.categoryCount <= 1) return; // wrap-to-self would machine-gun the tick
        e.preventDefault();
        const mag = Math.abs(dx);
        if (mag === 0) return;
        const isNotch =
          e.deltaMode !== 0 || (mag >= XMB_WHEEL.NOTCH_MIN_PX && idle >= XMB_WHEEL.NOTCH_GAP_MS);
        // Momentum tail, peak-relative: while the fingers still drive
        // (events near the session peak) switches are uncapped, like
        // holding ArrowRight; once the gesture has decayed past half its
        // peak, at most TAIL_MAX_STEPS more land. A mouse's notches all sit
        // at the peak, so a mouse never latches, and an isolated notch
        // un-latches outright. (Un-latching on any notch-SIZED event was
        // wrong: a trackpad flick decaying from 130px through 40-65px is
        // below half its peak yet notch-sized, and the cap never engaged.)
        peak.current = Math.max(peak.current, mag);
        if (isNotch || mag >= peak.current * 0.5) {
          if (tail.current) {
            tail.current = false;
            tailSteps.current = 0;
          }
        } else {
          tail.current = true;
        }
        const maxTail = O.reduceMotion ? XMB_WHEEL.TAIL_MAX_STEPS_REDUCED : XMB_WHEEL.TAIL_MAX_STEPS;
        if (tail.current && tailSteps.current >= maxTail) return; // swallowed, still prevented
        if (Math.sign(dx) !== Math.sign(xAcc.current)) xAcc.current = 0; // reversal clears credit
        xAcc.current += dx;
        if (Math.abs(xAcc.current) < XMB_WHEEL.CATEGORY_DETENT_PX) return;
        // Deliberate notches bypass the stream cooldown (a fast double
        // notch is two switches, like two key taps) behind a floor that
        // still keeps a free-spin wheel from firing twenty per second.
        const cooldown = isNotch ? XMB_WHEEL.CATEGORY_NOTCH_FLOOR_MS : XMB_WHEEL.CATEGORY_COOLDOWN_MS;
        if (now - lastStepX.current < cooldown) {
          xAcc.current = 0; // a continuing flick re-earns each step
          return;
        }
        lastStepX.current = now;
        const dir = Math.sign(xAcc.current);
        // A notch spends all its credit (one notch = one category whether
        // the OS reports 100px or 120px); a stream subtracts one detent.
        xAcc.current = isNotch
          ? 0
          : clamp(xAcc.current - dir * XMB_WHEEL.CATEGORY_DETENT_PX, -XMB_WHEEL.CATEGORY_DETENT_PX, XMB_WHEEL.CATEGORY_DETENT_PX);
        if (tail.current) tailSteps.current += 1;
        // A switch swaps the list: drop the vertical gesture (closing it if
        // it was open — never strand wheelActive) but keep the horizontal
        // bookkeeping through the abort notifySelection is about to raise.
        cancelFrame();
        if (armed.current) O.driverRef.current?.setWheelActive(false);
        armed.current = false;
        armAcc.current = 0;
        selfStep.current = true;
        (dir > 0 ? O.stepNext : O.stepPrev)(); // owns wrap, recall, path reset, sound
        // moveLeft/moveRight open with endWheelGesture, so that abort has
        // already run synchronously above and consumed the flag. Re-arm it
        // for the abort notifySelection raises once React commits the
        // switch — that is the one this flag exists for; without it every
        // step wiped peak/tail and the momentum cap never engaged.
        selfStep.current = true;
        return;
      }

      // ── Vertical ───────────────────────────────────────────────────────
      if (axis.current !== 'y' && axis.current !== null) return;
      // An isolated notch (deltaMode 1, or a pixel delta at notch size
      // after ≥ NOTCH_GAP_MS of silence) is a discrete step. Anything
      // denser — a stream, its tail, a fast spin — is a continuous gesture.
      const isNotchY =
        e.deltaMode !== 0 || (Math.abs(dy) >= XMB_WHEEL.NOTCH_MIN_PX && idle >= XMB_WHEEL.NOTCH_GAP_MS);

      // The paged categories stage owns the vertical wheel — including the
      // 0.12s the list it just left is still mounted for its exit fade with
      // its driver registered and its cursor pinned at the pre-exit index.
      // Steering that would commit an itemIndex that re-derives the stage
      // back to 'list', silently undoing the Escape. enterList is non-null
      // exactly at that stage, so it is checked BEFORE the driver.
      if (O.enterList) {
        e.preventDefault();
        if (entered.current || dy <= 0) return;
        enterAcc.current += dy;
        if (!isNotchY && enterAcc.current < XMB_WHEEL.ENTER_LIST_PX) return;
        entered.current = true;
        O.enterList();
        // enterList IS commands.moveDown: it ends the open wheel gesture
        // first, and that abort's resetVertical clears the latch set above.
        // Re-arm it — enterList stays non-null until React renders the
        // derived 'list' stage, so a second event in that gap would enter,
        // and tick, twice for one state change.
        entered.current = true;
        return;
      }
      const d = O.driverRef.current;
      if (!d) return;
      if (dy === 0) return;
      e.preventDefault();

      if (isNotchY && !armed.current) {
        // One notch, one row — like a keypress, settled with SNAP from
        // wherever the cursor visibly is. No arm, no description unmount.
        if (now - lastStepY.current < XMB_WHEEL.REDUCED_STEP_COOLDOWN_MS && O.reduceMotion) return;
        lastStepY.current = now;
        stepRow(d, dy > 0 ? 1 : -1);
        return;
      }

      if (O.reduceMotion) {
        // A preference flipped mid-gesture: drop the continuous gesture
        // before stepping discretely (abort zeroes redAcc, so it runs
        // before the delta is banked).
        if (armed.current || raf.current !== null || settle.current !== null) abort(true);
        // Streams accumulate into discrete, rate-limited row steps; the
        // list's reduced branch snaps to each. The rate IS the motion.
        redAcc.current += dy;
        while (Math.abs(redAcc.current) >= XMB_WHEEL.REDUCED_DETENT_PX) {
          if (now - lastStepY.current < XMB_WHEEL.REDUCED_STEP_COOLDOWN_MS) {
            // Degrade a fast stream to the rate limit, not to nothing.
            redAcc.current = Math.sign(redAcc.current) * XMB_WHEEL.REDUCED_DETENT_PX;
            break;
          }
          lastStepY.current = now;
          const dir: 1 | -1 = redAcc.current > 0 ? 1 : -1;
          redAcc.current -= dir * XMB_WHEEL.REDUCED_DETENT_PX;
          stepRow(d, dir);
        }
        return;
      }

      if (!armed.current) {
        // Arm frame: bank the delta, no cursor write yet. Arming unmounts
        // the description at c === committed — the one moment that costs
        // the cursor row and the lane above it nothing — and the layout
        // effect re-measures in that commit, so the first motion write on
        // the next frame already runs on description-free geometry.
        armAcc.current += dy;
        if (Math.abs(armAcc.current) < XMB_WHEEL.ARM_PX) return;
        armed.current = true;
        d.cursor.stop(); // take ownership from any keyboard tween / settle snap
        d.selectionLevel.stop();
        // Continue from where the cursor visibly IS (a snap or keyboard
        // tween may still be in flight), like the carousel continues from
        // its live offset — never from the committed integer, which would
        // jump. The cursor carries the pose whenever it is off row 0;
        // selectionLevel carries it only while the cursor is parked AT 0
        // (the −1 band), so read the cursor first: mid-deselect-tween
        // (cursor 1.3, level 0.4) must continue from 1.3, not teleport.
        const c = d.cursor.get();
        pos.current = c > 0 ? c : d.selectionLevel.get() - 1;
        active.current = Math.round(pos.current);
        // Publish the row the cursor is actually on: the list switches its
        // highlight to gestureIndex on setWheelActive(true), and write()
        // only publishes on a crossing — mid-tween the last published
        // value is the committed row, not where the ring should be. Both
        // setters batch into the one render that opens the gesture.
        d.setGestureIndex(active.current);
        opt.current.liveIndexRef.current = active.current;
        d.setWheelActive(true);
        pend.current = armAcc.current;
        armAcc.current = 0;
      } else {
        pend.current += dy;
      }
      if (raf.current === null) raf.current = requestAnimationFrame(flush);
    };

    abortRef.current = abort;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      abort(false);
      abortRef.current = null;
    };
  }, []);

  const abort = useCallback((): void => {
    abortRef.current?.(true);
  }, []);

  const notifySelection = useCallback((itemIndex: number, listKey: string): void => {
    const listChanged = lastListKey.current !== null && lastListKey.current !== listKey;
    lastListKey.current = listKey;
    const self = !listChanged && expected.current !== null && expected.current === itemIndex;
    expected.current = null;
    // React's rendered index is the truth from here on.
    committed.current = itemIndex;
    opt.current.liveIndexRef.current = null;
    if (!self) abortRef.current?.(true);
  }, []);

  return useMemo(() => ({ abort, notifySelection }), [abort, notifySelection]);
}
