export type BackgroundTheme = 'light' | 'dark';

export interface BackgroundRenderer {
  render(elapsedSeconds: number, theme: BackgroundTheme): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export interface RendererCallbacks {
  /** Rendering became impossible; the caller stops the loop. */
  onLost: () => void;
  /** Rendering is possible again; the caller recreates via the factory. */
  onRestored: () => void;
}
