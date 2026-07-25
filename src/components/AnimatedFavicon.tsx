'use client';

import { useEffect } from 'react';

const SIZE = 64;
const CENTER = SIZE / 2;
const RADIUS_MIN = 10;
const RADIUS_MAX = 22;
const PERIOD_MS = 2000;
const FRAME_MS = 40; // 25fps — Chrome samples these at its own pace; the wall-clock phase keeps every sampled pose time-correct

/**
 * Pulsing-dot favicon: redraws a dot on an offscreen canvas and feeds it to
 * a favicon <link> as a data URL, so the tab icon breathes small→large on a
 * 2s loop. Mounted once in the root layout; renders nothing.
 *
 * The dot follows the browser/OS theme, not the site's locked dark theme —
 * it sits on the tab strip, whose color tracks prefers-color-scheme: white
 * on dark strips, site-background near-black on light ones.
 *
 * Runs on setInterval, not requestAnimationFrame, and deliberately keeps
 * going while the tab is hidden — the inverse of WebGLBackground's
 * pause-on-hidden idiom — because background tabs are exactly where a
 * favicon is most visible. rAF freezes entirely there, while hidden-tab
 * intervals merely throttle to ~1Hz; the pulse phase derives from the wall
 * clock, so throttling lowers the frame rate without slowing the pulse.
 */
const AnimatedFavicon = (): null => {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // no 2d context — the static favicon.ico/icon.svg remain

    // A dedicated link node rather than mutating the metadata-emitted
    // <link rel="icon">: React owns those head tags and may recreate them on
    // navigation, and per spec the last suitable icon link in tree order
    // wins — so appending our own overrides the static ones without ever
    // touching React-managed DOM.
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    // sizes="any" earns Chrome's top declared score (and without it, mobile
    // Chrome's largest-icon mode scores a sizeless link 0.0).
    link.setAttribute('sizes', 'any');
    link.setAttribute('data-animated-favicon', '');
    document.head.appendChild(link);

    const darkMql = window.matchMedia('(prefers-color-scheme: dark)');

    const draw = (pulse: number): void => {
      // Max extent stays under the canvas edge: 22 radius + 8 glow < 32.
      const radius = RADIUS_MIN + (RADIUS_MAX - RADIUS_MIN) * pulse;
      const onDarkStrip = darkMql.matches;
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = onDarkStrip ? '#ffffff' : '#0b0b14'; // --color-xmb-fg / --color-background
      ctx.shadowColor = onDarkStrip
        ? 'rgba(255, 255, 255, 0.6)'
        : 'rgba(11, 11, 20, 0.5)';
      ctx.shadowBlur = 4 + 4 * pulse;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Being last is not enough for Chrome: it scores icon candidates and a
      // scalable icon.svg (sizes="any") always outranks a sizeless data-URL
      // PNG, so the static links must be demoted while we animate. React may
      // recreate them on navigation; doing this per frame self-heals that
      // (and the ≤1-frame fallback flash shows the same dot anyway).
      document.head
        .querySelectorAll('link[rel~="icon"]:not([data-animated-favicon])')
        .forEach((rival) => rival.setAttribute('rel', 'disabled-icon'));
      // Demoting orphans a link from React's rel+href bookkeeping, so every
      // remount inserts a fresh copy. Drop the extras, keep one per href to
      // restore on unmount.
      const seen = new Set<string>();
      document.head
        .querySelectorAll('link[rel="disabled-icon"]')
        .forEach((rival) => {
          if (seen.has(rival.getAttribute('href') ?? '')) rival.remove();
          else seen.add(rival.getAttribute('href') ?? '');
        });
      // Keep ours last too — Firefox picks the last equally-suitable icon.
      const icons = document.head.querySelectorAll('link[rel~="icon"]');
      if (icons[icons.length - 1] !== link) {
        document.head.appendChild(link);
      }
      link.href = canvas.toDataURL('image/png');
    };

    const tick = (): void => {
      const phase = (performance.now() / PERIOD_MS) % 1;
      draw(0.5 - 0.5 * Math.cos(2 * Math.PI * phase));
    };

    let intervalId: number | null = null;

    const stopTimer = (): void => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startTimer = (): void => {
      if (intervalId !== null) return;
      tick();
      intervalId = window.setInterval(tick, FRAME_MS);
    };

    // MotionProvider's reducedMotion="user" only covers declarative motion —
    // imperative animation must gate itself.
    const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = (): void => {
      if (motionMql.matches) {
        stopTimer();
        draw(0.5); // static mid-pulse frame, same dot as icon.svg
      } else {
        startTimer();
      }
    };
    applyMotionPreference();
    motionMql.addEventListener('change', applyMotionPreference);

    // Repaint immediately when the browser theme flips; the timer (if any)
    // keeps running untouched.
    const applyTheme = (): void => {
      if (motionMql.matches) {
        draw(0.5);
      } else {
        tick();
      }
    };
    darkMql.addEventListener('change', applyTheme);

    return () => {
      darkMql.removeEventListener('change', applyTheme);
      motionMql.removeEventListener('change', applyMotionPreference);
      stopTimer();
      // Reinstate the demoted static links, then fall back to them.
      document.head
        .querySelectorAll('link[rel="disabled-icon"]')
        .forEach((rival) => rival.setAttribute('rel', 'icon'));
      link.remove();
    };
  }, []);

  return null;
};

export default AnimatedFavicon;
