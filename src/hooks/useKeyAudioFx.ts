// src/hooks/useKeyAudioFx.ts
import { useEffect, useRef, useCallback } from 'react';

const AUDIO_SRC = '/assets/audio/key-audio-fx.wav';

export function useKeyAudioFx() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Create AudioContext lazily
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Fetch and decode the WAV file into a reusable buffer
    fetch(AUDIO_SRC)
      .then(res => res.arrayBuffer())
      .then(data => ctx.decodeAudioData(data))
      .then(buffer => {
        audioBufferRef.current = buffer;
      })
      .catch(err => {
        console.warn('Failed to load key audio FX:', err);
      });

    return () => {
      ctx.close();
    };
  }, []);

  const playKeySound = useCallback(() => {
    const ctx = audioContextRef.current;
    const buffer = audioBufferRef.current;
    if (!ctx || !buffer) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create a new source node for each play (they're disposable)
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }, []);

  return { playKeySound };
}
