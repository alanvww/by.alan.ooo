import type { BackgroundRenderer, RendererCallbacks } from './types';
import { createWebGLRenderer } from './webgl-renderer';

export type { BackgroundRenderer, RendererCallbacks } from './types';

let fallbackLogged = false;

function logWebGPUFallback(reason?: unknown): void {
  if (fallbackLogged) return;
  fallbackLogged = true;
  if (reason === undefined) {
    console.debug('WebGPU renderer unavailable; falling back to WebGL.');
  } else {
    console.debug('WebGPU renderer unavailable; falling back to WebGL.', reason);
  }
}

// Async by design: the WebGPU backend must await tgpu.init before it can hand
// back a renderer, and callers already treat creation as fallible.
export async function createBackgroundRenderer(
  canvas: HTMLCanvasElement,
  callbacks: RendererCallbacks,
): Promise<BackgroundRenderer | null> {
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      // Dynamic import so browsers without WebGPU never download typegpu.
      const { createWebGPURenderer } = await import('./webgpu-renderer');
      const renderer = await createWebGPURenderer(canvas, callbacks);

      if (renderer) {
        return renderer;
      }

      logWebGPUFallback();
    } catch (error) {
      logWebGPUFallback(error);
    }
  }

  return createWebGLRenderer(canvas, callbacks);
}
