// src/hooks/useKeyAudioFx.ts
'use client';

import { play } from 'cuelume';

// Cuelume synthesizes each cue live on a shared lazy AudioContext and is a
// no-op during SSR, so no warm-up or resume handling is needed here.

/** Play the navigation tick (arrow keys, tab, wheel/swipe settle). */
export function playNavigate(): void {
  play('release');
}

/** Play the confirm/open cue (Enter, click-to-open). */
export function playConfirm(): void {
  play('bloom');
}

/** Play the back/cancel cue (Escape, Backspace, back pill). */
export function playCancel(): void {
  play('whisper');
}
