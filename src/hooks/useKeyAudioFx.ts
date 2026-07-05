// src/hooks/useKeyAudioFx.ts
'use client';

import { useEffect } from 'react';

const AUDIO_SRC = '/assets/audio/key-audio-fx.wav';

// Module-level singletons so every consumer shares one AudioContext + decoded buffer
let audioContext: AudioContext | null = null;
let navBuffer: AudioBuffer | null = null;
let initPromise: Promise<void> | null = null;

function ensureAudio(): Promise<void> {
  if (initPromise) return initPromise;
  if (typeof window === 'undefined') return Promise.resolve();

  initPromise = (async () => {
    try {
      audioContext = new AudioContext();
      const res = await fetch(AUDIO_SRC);
      const data = await res.arrayBuffer();
      navBuffer = await audioContext.decodeAudioData(data);
    } catch (err) {
      console.warn('Failed to initialize XMB audio:', err);
      audioContext = null;
      navBuffer = null;
    }
  })();

  return initPromise;
}

function resumeIfNeeded(): void {
  if (audioContext && audioContext.state === 'suspended') {
    void audioContext.resume();
  }
}

/** Play the navigation tick (arrow keys, hover, focus moves). */
export function playNavigate(): void {
  if (!audioContext || !navBuffer) {
    void ensureAudio();
    return;
  }
  resumeIfNeeded();
  const source = audioContext.createBufferSource();
  source.buffer = navBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}

/**
 * Synthesize a short rising bloop for confirm/open actions (Enter, click-to-open).
 * Built from Web Audio oscillators so it doesn't need an extra asset.
 */
export function playConfirm(): void {
  if (!audioContext) {
    void ensureAudio();
    return;
  }
  resumeIfNeeded();

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(960, now + 0.09);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Synthesize a soft falling tone for back/cancel (Escape). */
export function playCancel(): void {
  if (!audioContext) {
    void ensureAudio();
    return;
  }
  resumeIfNeeded();

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Initialize audio on mount. Returns the same `playNavigate` stable reference
 * so existing consumers don't need to change.
 */
export function useKeyAudioFx() {
  useEffect(() => {
    void ensureAudio();
  }, []);

  return { playKeySound: playNavigate };
}
