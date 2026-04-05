import { useCallback, useRef, useState } from 'react';
import type { LightPattern } from '../components/studio/PatternButton';
import type { FrequencyBands } from '../components/studio/FrequencyVisualizer';
import type { Point, Stroke } from '../components/studio/PaintCanvas';

// ─── Lightshow ────────────────────────────────────────────────────────────────

interface LightshowState {
  active: boolean;
  pattern: LightPattern;
  sensitivity: number;
  minBrightness: number;
  maxBrightness: number;
  bpm: number;
  bands: FrequencyBands;
}

// ─── Gesture Aim ─────────────────────────────────────────────────────────────

interface GestureAimState {
  active: boolean;
  azimuth: number;
  elevation: number;
  intensity: number;
  sensitivityX: number;
  sensitivityY: number;
  invertX: boolean;
  invertY: boolean;
  deadzone: number;
  smoothing: number;
}

// ─── AR Paint ────────────────────────────────────────────────────────────────

export type RepeatCount = 1 | 2 | 3 | 'infinite';

interface ARPaintState {
  executing: boolean;
  progress: number;
  strokes: Stroke[];
  speed: number;
  repeatCount: RepeatCount;
  fadeTrail: boolean;
  exposureSec: number;
}

// ─── Combined ────────────────────────────────────────────────────────────────

export interface StudioState {
  lightshow: LightshowState;
  gestureAim: GestureAimState;
  arPaint: ARPaintState;
}

const FAKE_BANDS: FrequencyBands = { sub: 0, bass: 0, mid: 0, high: 0, brilliance: 0 };
const LIVE_BANDS = (): FrequencyBands => ({
  sub: Math.random() * 100,
  bass: Math.random() * 100,
  mid: Math.random() * 100,
  high: Math.random() * 100,
  brilliance: Math.random() * 100,
});

export function useStudio() {
  // ── Lightshow ──
  const [lightshow, setLightshow] = useState<LightshowState>({
    active: false,
    pattern: 'pulse',
    sensitivity: 70,
    minBrightness: 20,
    maxBrightness: 100,
    bpm: 120,
    bands: FAKE_BANDS,
  });
  const beatTimestamps = useRef<number[]>([]);
  const visualizerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatSimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLightshow = useCallback(() => {
    setLightshow((s) => ({ ...s, active: true }));
    visualizerTimer.current = setInterval(() => {
      setLightshow((s) => ({ ...s, bands: LIVE_BANDS() }));
    }, 120);
  }, []);

  const stopLightshow = useCallback(() => {
    if (visualizerTimer.current) clearInterval(visualizerTimer.current);
    setLightshow((s) => ({ ...s, active: false, bands: FAKE_BANDS }));
  }, []);

  const toggleLightshow = useCallback(() => {
    setLightshow((s) => {
      if (s.active) { stopLightshow(); return s; }
      startLightshow(); return s;
    });
  }, [startLightshow, stopLightshow]);

  const simulateBeat = useCallback(() => {
    setLightshow((s) => ({
      ...s,
      bands: {
        sub: 95 + Math.random() * 5,
        bass: 80 + Math.random() * 20,
        mid: 50 + Math.random() * 30,
        high: 20 + Math.random() * 40,
        brilliance: 10 + Math.random() * 30,
      },
    }));
    if (beatSimTimer.current) clearTimeout(beatSimTimer.current);
    beatSimTimer.current = setTimeout(() => {
      setLightshow((s) => ({ ...s, bands: FAKE_BANDS }));
    }, 200);
  }, []);

  const tapBpm = useCallback(() => {
    const now = Date.now();
    beatTimestamps.current.push(now);
    if (beatTimestamps.current.length > 8) beatTimestamps.current.shift();
    if (beatTimestamps.current.length >= 2) {
      const gaps = beatTimestamps.current
        .slice(1)
        .map((t, i) => t - beatTimestamps.current[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpm = Math.round(60000 / avg);
      setLightshow((s) => ({ ...s, bpm: Math.max(40, Math.min(240, bpm)) }));
    }
  }, []);

  const setPattern = useCallback((pattern: LightPattern) => {
    setLightshow((s) => ({ ...s, pattern }));
  }, []);

  const setSensitivity = useCallback((v: number) => {
    setLightshow((s) => ({ ...s, sensitivity: v }));
  }, []);

  const setMinBrightness = useCallback((v: number) => {
    setLightshow((s) => ({ ...s, minBrightness: Math.min(v, s.maxBrightness - 5) }));
  }, []);

  const setMaxBrightness = useCallback((v: number) => {
    setLightshow((s) => ({ ...s, maxBrightness: Math.max(v, s.minBrightness + 5) }));
  }, []);

  // ── Gesture Aim ──
  const [gestureAim, setGestureAim] = useState<GestureAimState>({
    active: false,
    azimuth: 0,
    elevation: 0,
    intensity: 0,
    sensitivityX: 50,
    sensitivityY: 50,
    invertX: false,
    invertY: false,
    deadzone: 5,
    smoothing: 40,
  });

  const startGestureAim = useCallback(() => {
    setGestureAim((s) => ({ ...s, active: true }));
  }, []);

  const stopGestureAim = useCallback(() => {
    setGestureAim((s) => ({ ...s, active: false, azimuth: 0, elevation: 0, intensity: 0 }));
  }, []);

  const calibrateAim = useCallback(() => {
    setGestureAim((s) => ({ ...s, azimuth: 0, elevation: 0 }));
  }, []);

  const setAimSensitivityX = useCallback((v: number) => {
    setGestureAim((s) => ({ ...s, sensitivityX: v }));
  }, []);

  const setAimSensitivityY = useCallback((v: number) => {
    setGestureAim((s) => ({ ...s, sensitivityY: v }));
  }, []);

  const toggleInvertX = useCallback(() => {
    setGestureAim((s) => ({ ...s, invertX: !s.invertX }));
  }, []);

  const toggleInvertY = useCallback(() => {
    setGestureAim((s) => ({ ...s, invertY: !s.invertY }));
  }, []);

  const setDeadzone = useCallback((v: number) => {
    setGestureAim((s) => ({ ...s, deadzone: v }));
  }, []);

  const setSmoothing = useCallback((v: number) => {
    setGestureAim((s) => ({ ...s, smoothing: v }));
  }, []);

  // ── AR Paint ──
  const [arPaint, setArPaint] = useState<ARPaintState>({
    executing: false,
    progress: 0,
    strokes: [],
    speed: 50,
    repeatCount: 1,
    fadeTrail: true,
    exposureSec: 2,
  });
  const executeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStroke = useRef<Point[]>([]);

  const startStroke = useCallback((pt: Point) => {
    currentStroke.current = [pt];
    setArPaint((s) => ({
      ...s,
      strokes: [...s.strokes, { points: [pt] }],
    }));
  }, []);

  const moveStroke = useCallback((pt: Point) => {
    currentStroke.current.push(pt);
    setArPaint((s) => {
      const updated = [...s.strokes];
      if (updated.length === 0) return s;
      updated[updated.length - 1] = { points: [...currentStroke.current] };
      return { ...s, strokes: updated };
    });
  }, []);

  const endStroke = useCallback(() => {
    currentStroke.current = [];
  }, []);

  const clearCanvas = useCallback(() => {
    setArPaint((s) => ({ ...s, strokes: [], progress: 0 }));
  }, []);

  const executePattern = useCallback(() => {
    setArPaint((s) => ({ ...s, executing: true, progress: 0 }));
    let pct = 0;
    executeTimer.current = setInterval(() => {
      pct += 2;
      setArPaint((s) => ({ ...s, progress: pct }));
      if (pct >= 100) {
        if (executeTimer.current) clearInterval(executeTimer.current);
        setArPaint((s) => ({ ...s, executing: false, progress: 100 }));
      }
    }, 80);
  }, []);

  const stopExecute = useCallback(() => {
    if (executeTimer.current) clearInterval(executeTimer.current);
    setArPaint((s) => ({ ...s, executing: false }));
  }, []);

  const loadPreset = useCallback((preset: string) => {
    const presets: Record<string, Point[]> = {
      Heart: [
        { x: 100, y: 80 }, { x: 80, y: 60 }, { x: 60, y: 50 }, { x: 40, y: 60 },
        { x: 30, y: 80 }, { x: 50, y: 110 }, { x: 100, y: 150 }, { x: 150, y: 110 },
        { x: 170, y: 80 }, { x: 160, y: 60 }, { x: 140, y: 50 }, { x: 120, y: 60 },
        { x: 100, y: 80 },
      ],
      Star: [
        { x: 100, y: 30 }, { x: 115, y: 80 }, { x: 170, y: 80 }, { x: 125, y: 110 },
        { x: 140, y: 165 }, { x: 100, y: 135 }, { x: 60, y: 165 }, { x: 75, y: 110 },
        { x: 30, y: 80 }, { x: 85, y: 80 }, { x: 100, y: 30 },
      ],
      Spiral: Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 6;
        const r = 10 + i * 2.5;
        return { x: 100 + r * Math.cos(angle), y: 120 + r * Math.sin(angle) };
      }),
      Zigzag: Array.from({ length: 10 }).map((_, i) => ({
        x: 20 + i * 18,
        y: i % 2 === 0 ? 60 : 140,
      })),
      Infinity: Array.from({ length: 60 }).map((_, i) => {
        const t = (i / 60) * Math.PI * 2;
        return {
          x: 100 + 70 * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t)),
          y: 120 + 50 * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t)),
        };
      }),
    };
    const points = presets[preset];
    if (points) {
      setArPaint((s) => ({ ...s, strokes: [{ points }] }));
    }
  }, []);

  const setSpeed = useCallback((v: number) => {
    const exposureSec = Math.round((100 - v) / 10 * 0.5 * 10) / 10 + 0.5;
    setArPaint((s) => ({ ...s, speed: v, exposureSec }));
  }, []);

  const setRepeatCount = useCallback((v: RepeatCount) => {
    setArPaint((s) => ({ ...s, repeatCount: v }));
  }, []);

  const toggleFadeTrail = useCallback(() => {
    setArPaint((s) => ({ ...s, fadeTrail: !s.fadeTrail }));
  }, []);

  const savePattern = useCallback(() => {
    // Stub — would serialize strokes to AsyncStorage
  }, []);

  return {
    lightshow,
    startLightshow,
    stopLightshow,
    toggleLightshow,
    simulateBeat,
    tapBpm,
    setPattern,
    setSensitivity,
    setMinBrightness,
    setMaxBrightness,

    gestureAim,
    startGestureAim,
    stopGestureAim,
    calibrateAim,
    setAimSensitivityX,
    setAimSensitivityY,
    toggleInvertX,
    toggleInvertY,
    setDeadzone,
    setSmoothing,

    arPaint,
    startStroke,
    moveStroke,
    endStroke,
    clearCanvas,
    executePattern,
    stopExecute,
    loadPreset,
    setSpeed,
    setRepeatCount,
    toggleFadeTrail,
    savePattern,
  };
}
