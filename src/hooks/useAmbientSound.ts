import { useEffect, useRef, useCallback, useState } from 'react';
import type { LightingMode } from '@/types/planner';

// Generates ambient noise using Web Audio API oscillators and noise
function createNoiseBuffer(ctx: AudioContext, duration: number, type: 'white' | 'brown' | 'pink' = 'brown'): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'white') {
      data[i] = white * 0.1;
    } else if (type === 'brown') {
      b0 = (b0 + (0.02 * white)) / 1.02;
      data[i] = b0 * 3.5 * 0.15;
    } else {
      // pink
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

const modeNoiseType: Record<LightingMode, 'white' | 'brown' | 'pink'> = {
  sun: 'pink',
  shade: 'brown',
  cave: 'brown',
  exam: 'white',
};

const modeFilterFreq: Record<LightingMode, number> = {
  sun: 2000,    // brighter, more birdsong-like
  shade: 600,   // muffled rain
  cave: 300,    // deep forest hum
  exam: 1200,   // library white noise
};

export function useAmbientSound(mode: LightingMode) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.3);

  const startAudio = useCallback((currentMode: LightingMode) => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;

      // Stop previous
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch {}
      }

      const buffer = createNoiseBuffer(ctx, 4, modeNoiseType[currentMode]);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = modeFilterFreq[currentMode];

      const gain = ctx.createGain();
      gain.gain.value = 0;
      // Fade in over 3s
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 3);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      gainRef.current = gain;
      sourceRef.current = source;
    } catch {}
  }, [volume]);

  const stopAudio = useCallback(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1);
      setTimeout(() => {
        try { sourceRef.current?.stop(); } catch {}
      }, 1200);
    }
  }, []);

  useEffect(() => {
    if (muted) {
      stopAudio();
    } else {
      startAudio(mode);
    }
    return () => stopAudio();
  }, [mode, muted, startAudio, stopAudio]);

  useEffect(() => {
    if (gainRef.current && ctxRef.current && !muted) {
      gainRef.current.gain.linearRampToValueAtTime(volume, ctxRef.current.currentTime + 0.5);
    }
  }, [volume, muted]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  return { muted, toggleMute, volume, setVolume };
}