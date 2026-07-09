'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { createBackgroundRenderer } from '@/components/background';
import type { BackgroundRenderer, RendererCallbacks } from '@/components/background';

const MAX_DEVICE_PIXEL_RATIO = 1.0;
const TARGET_FRAME_MS = 33; // ~30fps cap for the shader

interface LoopControls {
  start: () => void;
  stop: () => void;
  renderOnce: () => void;
}

/**
 * Mounted exactly once in the root layout and kept alive across all client
 * navigations — the GL context, compiled shaders, and shader clock persist.
 * The render loop runs only on the home screen (content pages cover the
 * canvas with blurred overlays, so animating under them is wasted GPU work)
 * and while the tab is visible.
 */
const WebGLBackground = (): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<BackgroundRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const shouldAnimateRef = useRef<boolean>(true);
  const loopControlsRef = useRef<LoopControls | null>(null);
  const [mounted, setMounted] = useState(false);
  const [canvasGeneration, setCanvasGeneration] = useState(0);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the generation-keyed canvas must only mount client-side, after hydration
    setMounted(true);
  }, []);

  // Theme only affects the clear color — track it in a ref so a theme change
  // never tears down the GL pipeline. Repaint once if the loop is idle.
  useEffect(() => {
    themeRef.current = theme;
    if (animationFrameRef.current === null) {
      loopControlsRef.current?.renderOnce();
    }
  }, [theme]);

  useEffect(() => {
    if (!mounted || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    // The renderer factory is async — if the effect tore down before it
    // resolved, the just-created renderer must be destroyed, not adopted.
    let cancelled = false;
    let lostRenderer: BackgroundRenderer | null = null;

    const resizeCanvas = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const width = Math.round(window.innerWidth * dpr);
      const height = Math.round(window.innerHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      rendererRef.current?.resize(canvas.width, canvas.height);
    };

    const renderFrame = (now: number): void => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const elapsedTime = (now - startTimeRef.current) / 1000;
      elapsedRef.current = elapsedTime;

      renderer.render(elapsedTime, themeRef.current);
    };

    const tick = (): void => {
      if (!rendererRef.current || !shouldAnimateRef.current || document.hidden) {
        animationFrameRef.current = null;
        return;
      }

      const now = performance.now();

      // Cap at ~30fps — skip draw if less than 33ms since last render
      if (now - lastRenderTimeRef.current >= TARGET_FRAME_MS) {
        lastRenderTimeRef.current = now;
        renderFrame(now);
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const startLoop = (): void => {
      if (animationFrameRef.current !== null || !rendererRef.current) return;
      if (!shouldAnimateRef.current || document.hidden) return;
      // Resume the shader clock where it left off instead of jumping to t=0.
      startTimeRef.current = performance.now() - elapsedRef.current * 1000;
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const stopLoop = (): void => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    // A GPU reset (sleep/wake, driver restart) invalidates the context —
    // rebuild the pipeline instead of leaving a frozen background. The lost
    // renderer is kept aside so its restore listener stays alive until the
    // replacement takes over.
    const callbacks: RendererCallbacks = {
      onLost: (): void => {
        stopLoop();
        if (rendererRef.current) {
          lostRenderer = rendererRef.current;
          rendererRef.current = null;
        }
      },
      onRestored: (): void => {
        void setup().then((ready) => {
          if (ready) {
            renderFrame(performance.now());
            startLoop();
            return;
          }
          // A canvas is bound for life to its first context type, so once
          // WebGPU has claimed it the WebGL fallback can never attach — and a
          // WebGPU device loss is one-shot, with no restore event to retry on.
          // Remounting the canvas re-runs setup against a fresh element.
          if (!cancelled) {
            setCanvasGeneration((generation) => generation + 1);
          }
        });
      },
    };

    const setup = async (): Promise<boolean> => {
      const renderer = await createBackgroundRenderer(canvas, callbacks);
      if (!renderer) return false;
      if (cancelled) {
        renderer.destroy();
        return false;
      }
      lostRenderer?.destroy();
      lostRenderer = null;
      rendererRef.current?.destroy();
      rendererRef.current = renderer;
      resizeCanvas();
      return true;
    };

    const handleResize = (): void => {
      if (rendererRef.current) {
        resizeCanvas();
        // Resizing clears the drawing buffer — repaint if the loop is idle.
        if (animationFrameRef.current === null) {
          loopControlsRef.current?.renderOnce();
        }
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    void setup().then((ready) => {
      if (!ready) return;

      loopControlsRef.current = {
        start: startLoop,
        stop: stopLoop,
        renderOnce: () => renderFrame(startTimeRef.current + elapsedRef.current * 1000),
      };

      // Paint one frame immediately so the canvas is never uninitialized black,
      // even when mounting paused (direct load of a content page).
      startTimeRef.current = performance.now() - elapsedRef.current * 1000;
      renderFrame(performance.now());
      startLoop();

      window.addEventListener('resize', handleResize);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      stopLoop();
      loopControlsRef.current = null;

      lostRenderer?.destroy();
      lostRenderer = null;

      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [mounted, canvasGeneration]);

  // Animate only on the home screen; content routes get a static frame.
  useEffect(() => {
    shouldAnimateRef.current = isHome;
    if (isHome) {
      loopControlsRef.current?.start();
    } else {
      loopControlsRef.current?.stop();
    }
  }, [isHome]);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-1]" aria-hidden="true">
      <div className={`absolute inset-0 transition-colors duration-300 ${theme === 'light' ? 'bg-[#fafafa]' : 'bg-[#14141f]'}`} />
      {mounted ? <canvas key={canvasGeneration} ref={canvasRef} className="absolute top-0 left-0 w-full h-full opacity-60" /> : null}
    </div>
  );
};

export default WebGLBackground;
