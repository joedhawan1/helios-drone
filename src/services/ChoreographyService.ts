import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Choreography,
  ChoreographyScene,
  DroneTrack,
  KeyFrame,
  EasingFunction,
  AutoChoreographConfig,
  ShowPreset,
  ShowPresetType,
  SpectatorEvent,
  SpectatorSession,
  TheaterPlaybackState,
  TheaterState,
  FormationShape,
} from '../types/drone';

// ── Storage ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'theater_';

// ── Listener types ─────────────────────────────────────────────────────────

type StateChangeListener = (state: TheaterState) => void;
type SceneChangeListener = (sceneIndex: number, scene: ChoreographyScene) => void;
type OutputListener = (outputs: Record<string, { brightness: number; colorTemp: string }>) => void;
type SpectatorEventListener = (event: SpectatorEvent) => void;

type ChoreographyListener =
  | StateChangeListener
  | SceneChangeListener
  | OutputListener
  | SpectatorEventListener;

// ── Easing implementations ─────────────────────────────────────────────────

function applyEasing(t: number, easing: EasingFunction): number {
  // t is clamped 0–1
  const c = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return c;
    case 'easeIn':
      return c * c;
    case 'easeOut':
      return 1 - (1 - c) * (1 - c);
    case 'easeInOut':
      return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      let x = c;
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        x -= 1.5 / d1;
        return n1 * x * x + 0.75;
      } else if (x < 2.5 / d1) {
        x -= 2.25 / d1;
        return n1 * x * x + 0.9375;
      } else {
        x -= 2.625 / d1;
        return n1 * x * x + 0.984375;
      }
    }
    case 'elastic': {
      if (c === 0) return 0;
      if (c === 1) return 1;
      const period = 0.3;
      const s = period / 4;
      return Math.pow(2, -10 * c) * Math.sin(((c - s) * (Math.PI * 2)) / period) + 1;
    }
    default:
      return c;
  }
}

// ── Keyframe interpolation ─────────────────────────────────────────────────

function interpolateBrightness(kfA: KeyFrame, kfB: KeyFrame, timeMs: number): number {
  const span = kfB.timeMs - kfA.timeMs;
  if (span <= 0) return kfB.brightness;
  const raw = (timeMs - kfA.timeMs) / span;
  const t = applyEasing(raw, kfA.easing);
  return kfA.brightness + (kfB.brightness - kfA.brightness) * t;
}

function interpolateColorTemp(
  kfA: KeyFrame,
  kfB: KeyFrame,
  timeMs: number,
): 'warm' | 'neutral' | 'cool' {
  const span = kfB.timeMs - kfA.timeMs;
  if (span <= 0) return kfB.colorTemp;
  const t = (timeMs - kfA.timeMs) / span;
  // Snap at 50% threshold
  return t < 0.5 ? kfA.colorTemp : kfB.colorTemp;
}

function sampleTrack(
  track: DroneTrack,
  localTimeMs: number,
): { brightness: number; colorTemp: string } {
  const { keyframes } = track;
  if (keyframes.length === 0) return { brightness: 0, colorTemp: 'neutral' };
  if (keyframes.length === 1) {
    return { brightness: keyframes[0].brightness, colorTemp: keyframes[0].colorTemp };
  }

  // Before first keyframe
  if (localTimeMs <= keyframes[0].timeMs) {
    return { brightness: keyframes[0].brightness, colorTemp: keyframes[0].colorTemp };
  }
  // After last keyframe
  if (localTimeMs >= keyframes[keyframes.length - 1].timeMs) {
    const last = keyframes[keyframes.length - 1];
    return { brightness: last.brightness, colorTemp: last.colorTemp };
  }

  // Find surrounding pair
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (localTimeMs >= a.timeMs && localTimeMs <= b.timeMs) {
      return {
        brightness: interpolateBrightness(a, b, localTimeMs),
        colorTemp: interpolateColorTemp(a, b, localTimeMs),
      };
    }
  }

  const last = keyframes[keyframes.length - 1];
  return { brightness: last.brightness, colorTemp: last.colorTemp };
}

// ── ID helpers ─────────────────────────────────────────────────────────────

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Auto-choreograph builders ──────────────────────────────────────────────

function buildRhythmicChoreography(cfg: AutoChoreographConfig): Choreography {
  const beatMs = 60000 / cfg.bpm;
  const beatCount = Math.floor(cfg.durationMs / beatMs);
  const intensityScale = { subtle: 0.4, moderate: 0.7, intense: 0.9, extreme: 1.0 }[cfg.intensity];

  const tracks: DroneTrack[] = cfg.droneIds.map((droneId, idx) => {
    const keyframes: KeyFrame[] = [];
    for (let b = 0; b <= beatCount; b++) {
      const timeMs = b * beatMs;
      const on = (b + idx) % 2 === 0;
      keyframes.push({
        timeMs,
        brightness: on ? intensityScale : 0.05,
        colorTemp: 'neutral',
        easing: 'easeOut',
      });
    }
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Rhythmic',
    durationMs: cfg.durationMs,
    formation: 'line',
    tracks,
    transition: 'cut',
    transitionDurationMs: 0,
  };

  return {
    id: makeId(),
    name: 'Auto: Rhythmic',
    scenes: [scene],
    totalDurationMs: cfg.durationMs,
    bpm: cfg.bpm,
    createdAt: Date.now(),
  };
}

function buildMelodicChoreography(cfg: AutoChoreographConfig): Choreography {
  const beatsPerSec = cfg.bpm / 60;
  const stepMs = 100; // sample every 100ms
  const steps = Math.ceil(cfg.durationMs / stepMs);
  const intensityScale = { subtle: 0.4, moderate: 0.7, intense: 0.9, extreme: 1.0 }[cfg.intensity];

  const tracks: DroneTrack[] = cfg.droneIds.map((droneId, idx) => {
    const offset = (idx / cfg.droneIds.length) * Math.PI * 2;
    const keyframes: KeyFrame[] = [];
    for (let s = 0; s <= steps; s++) {
      const timeMs = s * stepMs;
      const phase = (timeMs / 1000) * beatsPerSec * Math.PI * 2;
      const brightness = ((Math.sin(phase + offset) + 1) / 2) * intensityScale;
      keyframes.push({ timeMs, brightness, colorTemp: 'warm', easing: 'linear' });
    }
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Melodic',
    durationMs: cfg.durationMs,
    formation: 'circle',
    tracks,
    transition: 'crossfade',
    transitionDurationMs: 500,
  };

  return {
    id: makeId(),
    name: 'Auto: Melodic',
    scenes: [scene],
    totalDurationMs: cfg.durationMs,
    bpm: cfg.bpm,
    createdAt: Date.now(),
  };
}

function buildChaoticChoreography(cfg: AutoChoreographConfig): Choreography {
  const intensityScale = { subtle: 0.4, moderate: 0.7, intense: 0.9, extreme: 1.0 }[cfg.intensity];
  // Seed a deterministic-enough set of spikes
  const spikeCount = Math.floor(cfg.durationMs / 200);

  const tracks: DroneTrack[] = cfg.droneIds.map((droneId, idx) => {
    const keyframes: KeyFrame[] = [{ timeMs: 0, brightness: 0, colorTemp: 'cool', easing: 'linear' }];
    for (let s = 0; s < spikeCount; s++) {
      // Use index and spike to vary pseudo-randomly
      const base = (s / spikeCount) * cfg.durationMs;
      const jitter = ((s * 7 + idx * 13) % 97) / 97 * 150;
      const spikeTime = Math.min(base + jitter, cfg.durationMs - 50);
      const bright = (((s * 3 + idx * 5) % 10) / 10) * intensityScale;
      keyframes.push({ timeMs: spikeTime, brightness: bright, colorTemp: 'cool', easing: 'easeOut' });
      keyframes.push({ timeMs: spikeTime + 50, brightness: 0, colorTemp: 'cool', easing: 'linear' });
    }
    keyframes.sort((a, b) => a.timeMs - b.timeMs);
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Chaotic',
    durationMs: cfg.durationMs,
    formation: 'grid',
    tracks,
    transition: 'cut',
    transitionDurationMs: 0,
  };

  return {
    id: makeId(),
    name: 'Auto: Chaotic',
    scenes: [scene],
    totalDurationMs: cfg.durationMs,
    bpm: cfg.bpm,
    createdAt: Date.now(),
  };
}

function buildCinematicChoreography(cfg: AutoChoreographConfig): Choreography {
  const intensityScale = { subtle: 0.4, moderate: 0.7, intense: 0.9, extreme: 1.0 }[cfg.intensity];
  const sceneCount = 3;
  const sceneDuration = Math.floor(cfg.durationMs / sceneCount);

  const scenes: ChoreographyScene[] = [];

  // Scene 1: slow build
  {
    const tracks: DroneTrack[] = cfg.droneIds.map((droneId) => ({
      droneId,
      keyframes: [
        { timeMs: 0, brightness: 0, colorTemp: 'warm' as const, easing: 'easeIn' as EasingFunction },
        { timeMs: sceneDuration, brightness: intensityScale, colorTemp: 'warm' as const, easing: 'easeIn' as EasingFunction },
      ],
    }));
    scenes.push({
      id: makeId(),
      name: 'Build',
      durationMs: sceneDuration,
      formation: 'v-shape',
      tracks,
      transition: 'crossfade',
      transitionDurationMs: 800,
    });
  }

  // Scene 2: dramatic blackout then burst
  {
    const tracks: DroneTrack[] = cfg.droneIds.map((droneId, idx) => ({
      droneId,
      keyframes: [
        { timeMs: 0, brightness: intensityScale, colorTemp: 'neutral' as const, easing: 'linear' as EasingFunction },
        { timeMs: sceneDuration * 0.3, brightness: 0, colorTemp: 'neutral' as const, easing: 'easeOut' as EasingFunction },
        { timeMs: sceneDuration * 0.5 + idx * 80, brightness: intensityScale, colorTemp: 'cool' as const, easing: 'elastic' as EasingFunction },
        { timeMs: sceneDuration, brightness: intensityScale * 0.6, colorTemp: 'cool' as const, easing: 'linear' as EasingFunction },
      ],
    }));
    scenes.push({
      id: makeId(),
      name: 'Blackout & Burst',
      durationMs: sceneDuration,
      formation: 'grid',
      tracks,
      transition: 'blackout',
      transitionDurationMs: 300,
    });
  }

  // Scene 3: crossfade transitions between drones
  {
    const tracks: DroneTrack[] = cfg.droneIds.map((droneId, idx) => {
      const stagger = (idx / cfg.droneIds.length) * sceneDuration * 0.5;
      return {
        droneId,
        keyframes: [
          { timeMs: 0, brightness: 0, colorTemp: 'warm' as const, easing: 'easeInOut' as EasingFunction },
          { timeMs: stagger, brightness: intensityScale, colorTemp: 'warm' as const, easing: 'easeInOut' as EasingFunction },
          { timeMs: stagger + sceneDuration * 0.3, brightness: 0, colorTemp: 'warm' as const, easing: 'easeInOut' as EasingFunction },
          { timeMs: sceneDuration, brightness: intensityScale, colorTemp: 'warm' as const, easing: 'easeInOut' as EasingFunction },
        ],
      };
    });
    scenes.push({
      id: makeId(),
      name: 'Crossfade',
      durationMs: sceneDuration,
      formation: 'circle',
      tracks,
      transition: 'crossfade',
      transitionDurationMs: 1000,
    });
  }

  const totalDurationMs = scenes.reduce((sum, s) => sum + s.durationMs, 0);

  return {
    id: makeId(),
    name: 'Auto: Cinematic',
    scenes,
    totalDurationMs,
    bpm: cfg.bpm,
    createdAt: Date.now(),
  };
}

// ── Show preset builders ───────────────────────────────────────────────────

function buildFireworksPreset(droneIds: string[]): Choreography {
  const durationMs = 8000;
  const tracks: DroneTrack[] = droneIds.map((droneId, idx) => {
    const stagger = idx * 300;
    const keyframes: KeyFrame[] = [];
    for (let burst = 0; burst < 3; burst++) {
      const base = stagger + burst * 2000;
      keyframes.push({ timeMs: base, brightness: 0, colorTemp: 'neutral', easing: 'linear' });
      keyframes.push({ timeMs: base + 50, brightness: 1.0, colorTemp: 'warm', easing: 'bounce' });
      keyframes.push({ timeMs: base + 400, brightness: 0, colorTemp: 'warm', easing: 'easeOut' });
    }
    keyframes.sort((a, b) => a.timeMs - b.timeMs);
    if (keyframes[0]?.timeMs > 0) {
      keyframes.unshift({ timeMs: 0, brightness: 0, colorTemp: 'neutral', easing: 'linear' });
    }
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Fireworks',
    durationMs,
    formation: 'grid',
    tracks,
    transition: 'cut',
    transitionDurationMs: 0,
  };
  return { id: makeId(), name: 'Fireworks', scenes: [scene], totalDurationMs: durationMs, createdAt: Date.now() };
}

function buildAuroraPreset(droneIds: string[]): Choreography {
  const durationMs = 16000;
  const stepMs = 200;
  const steps = Math.ceil(durationMs / stepMs);

  const colorTemps: Array<'warm' | 'neutral' | 'cool'> = ['warm', 'neutral', 'cool', 'neutral'];

  const tracks: DroneTrack[] = droneIds.map((droneId, idx) => {
    const offset = (idx / droneIds.length) * Math.PI * 2;
    const keyframes: KeyFrame[] = [];
    for (let s = 0; s <= steps; s++) {
      const timeMs = s * stepMs;
      const phase = (timeMs / durationMs) * Math.PI * 2;
      const brightness = ((Math.sin(phase + offset) + 1) / 2) * 0.8 + 0.1;
      const colorIdx = Math.floor(((phase + offset) / (Math.PI * 2)) * colorTemps.length) % colorTemps.length;
      keyframes.push({ timeMs, brightness, colorTemp: colorTemps[colorIdx], easing: 'linear' });
    }
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Aurora',
    durationMs,
    formation: 'line',
    tracks,
    transition: 'crossfade',
    transitionDurationMs: 2000,
  };
  return { id: makeId(), name: 'Aurora', scenes: [scene], totalDurationMs: durationMs, createdAt: Date.now() };
}

function buildConstellationPreset(droneIds: string[]): Choreography {
  const perDroneMs = 600;
  const durationMs = droneIds.length * perDroneMs + 2000;

  const tracks: DroneTrack[] = droneIds.map((droneId, idx) => {
    const onTime = idx * perDroneMs;
    return {
      droneId,
      keyframes: [
        { timeMs: 0, brightness: 0, colorTemp: 'cool', easing: 'linear' },
        { timeMs: onTime, brightness: 0, colorTemp: 'cool', easing: 'linear' },
        { timeMs: onTime + 200, brightness: 1.0, colorTemp: 'cool', easing: 'easeOut' },
        { timeMs: durationMs, brightness: 0.7, colorTemp: 'cool', easing: 'linear' },
      ],
    };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Constellation',
    durationMs,
    formation: 'circle',
    tracks,
    transition: 'crossfade',
    transitionDurationMs: 1000,
  };
  return { id: makeId(), name: 'Constellation', scenes: [scene], totalDurationMs: durationMs, createdAt: Date.now() };
}

function buildTextSpellPreset(droneIds: string[]): Choreography {
  const perDroneMs = 400;
  const durationMs = droneIds.length * perDroneMs + 1000;

  const tracks: DroneTrack[] = droneIds.map((droneId, idx) => {
    const onTime = idx * perDroneMs;
    return {
      droneId,
      keyframes: [
        { timeMs: 0, brightness: 0, colorTemp: 'warm', easing: 'linear' },
        { timeMs: onTime, brightness: 1.0, colorTemp: 'warm', easing: 'easeOut' },
        { timeMs: onTime + perDroneMs - 50, brightness: 1.0, colorTemp: 'warm', easing: 'linear' },
        { timeMs: onTime + perDroneMs, brightness: 0, colorTemp: 'warm', easing: 'easeIn' },
      ],
    };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Text Spell',
    durationMs,
    formation: 'line',
    tracks,
    transition: 'cut',
    transitionDurationMs: 0,
  };
  return { id: makeId(), name: 'Text Spell', scenes: [scene], totalDurationMs: durationMs, createdAt: Date.now() };
}

function buildWavePreset(droneIds: string[]): Choreography {
  const durationMs = 6000;
  const stepMs = 100;
  const steps = Math.ceil(durationMs / stepMs);

  const tracks: DroneTrack[] = droneIds.map((droneId, idx) => {
    const offset = (idx / droneIds.length) * Math.PI * 2;
    const keyframes: KeyFrame[] = [];
    for (let s = 0; s <= steps; s++) {
      const timeMs = s * stepMs;
      const phase = (timeMs / durationMs) * Math.PI * 4; // 2 full cycles
      const brightness = ((Math.sin(phase - offset) + 1) / 2) * 0.95;
      keyframes.push({ timeMs, brightness, colorTemp: 'neutral', easing: 'linear' });
    }
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Wave',
    durationMs,
    formation: 'line',
    tracks,
    transition: 'crossfade',
    transitionDurationMs: 500,
  };
  return { id: makeId(), name: 'Wave', scenes: [scene], totalDurationMs: durationMs, createdAt: Date.now() };
}

function buildHeartbeatPreset(droneIds: string[]): Choreography {
  const bpm = 72;
  const beatMs = 60000 / bpm;
  const durationMs = beatMs * 8;

  const tracks: DroneTrack[] = droneIds.map((droneId) => {
    const keyframes: KeyFrame[] = [{ timeMs: 0, brightness: 0, colorTemp: 'warm', easing: 'linear' }];
    const beatCount = Math.floor(durationMs / beatMs);
    for (let b = 0; b < beatCount; b++) {
      const base = b * beatMs;
      // Double pulse (lub-dub)
      keyframes.push({ timeMs: base, brightness: 1.0, colorTemp: 'warm', easing: 'easeOut' });
      keyframes.push({ timeMs: base + 80, brightness: 0.2, colorTemp: 'warm', easing: 'easeIn' });
      keyframes.push({ timeMs: base + 160, brightness: 0.9, colorTemp: 'warm', easing: 'easeOut' });
      keyframes.push({ timeMs: base + 280, brightness: 0, colorTemp: 'warm', easing: 'easeIn' });
    }
    return { droneId, keyframes };
  });

  const scene: ChoreographyScene = {
    id: makeId(),
    name: 'Heartbeat',
    durationMs,
    formation: 'circle',
    tracks,
    transition: 'blackout',
    transitionDurationMs: 200,
  };
  return { id: makeId(), name: 'Heartbeat', scenes: [scene], totalDurationMs: durationMs, bpm, createdAt: Date.now() };
}

function buildCountdownPreset(droneIds: string[]): Choreography {
  // 3 scenes for 3-2-1, plus a final burst scene
  const countdownScenes: ChoreographyScene[] = ['3', '2', '1'].map((num, countIdx) => {
    const durationMs = 1000;
    const activeCount = 3 - countIdx; // 3 drones for '3', 2 for '2', 1 for '1'
    const activeDrones = droneIds.slice(0, Math.min(activeCount, droneIds.length));

    const tracks: DroneTrack[] = droneIds.map((droneId) => {
      const isActive = activeDrones.includes(droneId);
      return {
        droneId,
        keyframes: [
          { timeMs: 0, brightness: isActive ? 1.0 : 0, colorTemp: 'neutral' as const, easing: 'easeOut' as EasingFunction },
          { timeMs: 800, brightness: isActive ? 0.7 : 0, colorTemp: 'neutral' as const, easing: 'linear' as EasingFunction },
          { timeMs: 1000, brightness: 0, colorTemp: 'neutral' as const, easing: 'easeIn' as EasingFunction },
        ],
      };
    });

    return {
      id: makeId(),
      name: `Count ${num}`,
      durationMs,
      formation: 'line' as FormationShape,
      tracks,
      transition: 'blackout' as const,
      transitionDurationMs: 100,
    };
  });

  // Final burst
  const burstScene: ChoreographyScene = {
    id: makeId(),
    name: 'Launch!',
    durationMs: 3000,
    formation: 'circle',
    tracks: droneIds.map((droneId, idx) => ({
      droneId,
      keyframes: [
        { timeMs: 0, brightness: 0, colorTemp: 'warm' as const, easing: 'linear' as EasingFunction },
        { timeMs: idx * 50, brightness: 1.0, colorTemp: 'warm' as const, easing: 'bounce' as EasingFunction },
        { timeMs: 3000, brightness: 0.8, colorTemp: 'warm' as const, easing: 'linear' as EasingFunction },
      ],
    })),
    transition: 'cut',
    transitionDurationMs: 0,
  };

  const scenes = [...countdownScenes, burstScene];
  const totalDurationMs = scenes.reduce((sum, s) => sum + s.durationMs, 0);

  return {
    id: makeId(),
    name: 'Countdown',
    scenes,
    totalDurationMs,
    createdAt: Date.now(),
  };
}

// ── Main service ───────────────────────────────────────────────────────────

class ChoreographyService {
  // ── Event listeners ──────────────────────────────────────────────────────

  private _stateChangeListeners = new Set<StateChangeListener>();
  private _sceneChangeListeners = new Set<SceneChangeListener>();
  private _outputListeners = new Set<OutputListener>();
  private _spectatorEventListeners = new Set<SpectatorEventListener>();

  // ── Playback state ───────────────────────────────────────────────────────

  private _state: TheaterState = {
    playbackState: 'idle',
    currentChoreography: null,
    currentSceneIndex: 0,
    currentTimeMs: 0,
    droneOutputs: {},
    spectatorSession: null,
  };

  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _playStartWallClock = 0;
  private _seekOffsetMs = 0; // accumulated seek offset

  // ── Event emitter ────────────────────────────────────────────────────────

  on(event: 'stateChange', listener: StateChangeListener): () => void;
  on(event: 'sceneChange', listener: SceneChangeListener): () => void;
  on(event: 'output', listener: OutputListener): () => void;
  on(event: 'spectatorEvent', listener: SpectatorEventListener): () => void;
  on(event: string, listener: ChoreographyListener): () => void {
    switch (event) {
      case 'stateChange':
        this._stateChangeListeners.add(listener as StateChangeListener);
        return () => this._stateChangeListeners.delete(listener as StateChangeListener);
      case 'sceneChange':
        this._sceneChangeListeners.add(listener as SceneChangeListener);
        return () => this._sceneChangeListeners.delete(listener as SceneChangeListener);
      case 'output':
        this._outputListeners.add(listener as OutputListener);
        return () => this._outputListeners.delete(listener as OutputListener);
      case 'spectatorEvent':
        this._spectatorEventListeners.add(listener as SpectatorEventListener);
        return () => this._spectatorEventListeners.delete(listener as SpectatorEventListener);
      default:
        return () => {};
    }
  }

  private _emitStateChange(): void {
    this._stateChangeListeners.forEach((l) => l({ ...this._state }));
  }

  private _emitSceneChange(sceneIndex: number, scene: ChoreographyScene): void {
    this._sceneChangeListeners.forEach((l) => l(sceneIndex, scene));
  }

  private _emitOutput(outputs: Record<string, { brightness: number; colorTemp: string }>): void {
    this._outputListeners.forEach((l) => l(outputs));
  }

  private _emitSpectatorEvent(event: SpectatorEvent): void {
    this._spectatorEventListeners.forEach((l) => l(event));
  }

  // ── Playback controls ────────────────────────────────────────────────────

  play(choreography: Choreography): void {
    this._stopInterval();
    this._seekOffsetMs = 0;
    this._playStartWallClock = Date.now();

    this._setState({
      playbackState: 'playing',
      currentChoreography: choreography,
      currentSceneIndex: 0,
      currentTimeMs: 0,
      droneOutputs: {},
    });

    this._startInterval();

    if (this._state.spectatorSession) {
      this._emitSpectatorEvent({
        type: 'sync',
        showId: this._state.spectatorSession.showId,
        timeMs: 0,
        totalMs: choreography.totalDurationMs,
      });
    }
  }

  pause(): void {
    if (this._state.playbackState !== 'playing') return;
    this._stopInterval();
    // Capture elapsed so resume can continue from here
    this._seekOffsetMs = this._currentElapsedMs();
    this._setState({ playbackState: 'paused' });
  }

  resume(): void {
    if (this._state.playbackState !== 'paused') return;
    this._playStartWallClock = Date.now();
    this._setState({ playbackState: 'playing' });
    this._startInterval();
  }

  stop(): void {
    this._stopInterval();
    this._seekOffsetMs = 0;
    const hadChoreography = this._state.currentChoreography !== null;
    this._setState({
      playbackState: 'idle',
      currentChoreography: null,
      currentSceneIndex: 0,
      currentTimeMs: 0,
      droneOutputs: {},
    });

    if (hadChoreography && this._state.spectatorSession) {
      this._emitSpectatorEvent({ type: 'ended' });
    }
  }

  seek(timeMs: number): void {
    if (!this._state.currentChoreography) return;
    const clamped = Math.max(0, Math.min(timeMs, this._state.currentChoreography.totalDurationMs));
    this._seekOffsetMs = clamped;
    this._playStartWallClock = Date.now();
    this._tick();
  }

  getState(): TheaterState {
    return { ...this._state };
  }

  // ── Spectator session ────────────────────────────────────────────────────

  startSpectatorSession(hostName: string, choreographyName: string): SpectatorSession {
    const session: SpectatorSession = {
      showId: makeId(),
      hostName,
      startedAt: Date.now(),
      choreographyName,
      spectatorCount: 0,
      shareCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
    this._setState({ spectatorSession: session });
    return session;
  }

  updateSpectatorCount(count: number): void {
    if (!this._state.spectatorSession) return;
    this._setState({
      spectatorSession: { ...this._state.spectatorSession, spectatorCount: count },
    });
  }

  endSpectatorSession(): void {
    this._emitSpectatorEvent({ type: 'ended' });
    this._setState({ spectatorSession: null });
  }

  // ── Auto-choreograph ─────────────────────────────────────────────────────

  autoChoreograph(cfg: AutoChoreographConfig): Choreography {
    switch (cfg.style) {
      case 'rhythmic':
        return buildRhythmicChoreography(cfg);
      case 'melodic':
        return buildMelodicChoreography(cfg);
      case 'chaotic':
        return buildChaoticChoreography(cfg);
      case 'cinematic':
        return buildCinematicChoreography(cfg);
    }
  }

  // ── Presets ──────────────────────────────────────────────────────────────

  getPreset(type: ShowPresetType, droneIds: string[]): ShowPreset {
    let choreography: Choreography;
    let description: string;
    let minDrones: number;

    switch (type) {
      case 'fireworks':
        choreography = buildFireworksPreset(droneIds);
        description = 'Rapid bursts with bounce easing, staggered across drones';
        minDrones = 2;
        break;
      case 'aurora':
        choreography = buildAuroraPreset(droneIds);
        description = 'Slow wave patterns with warm-to-cool color cycling';
        minDrones = 3;
        break;
      case 'constellation':
        choreography = buildConstellationPreset(droneIds);
        description = 'Individual drones light up sequentially to trace star patterns';
        minDrones = 4;
        break;
      case 'textSpell':
        choreography = buildTextSpellPreset(droneIds);
        description = 'Sequential drone activation in simple patterns';
        minDrones = 2;
        break;
      case 'wave':
        choreography = buildWavePreset(droneIds);
        description = 'Traveling wave of brightness across the fleet';
        minDrones = 3;
        break;
      case 'heartbeat':
        choreography = buildHeartbeatPreset(droneIds);
        description = 'Double-pulse pattern synced across all drones';
        minDrones = 1;
        break;
      case 'countdown':
        choreography = buildCountdownPreset(droneIds);
        description = '3-2-1 sequential with final all-on burst';
        minDrones = 3;
        break;
      case 'custom':
      default:
        choreography = buildWavePreset(droneIds);
        description = 'Custom choreography';
        minDrones = 1;
        break;
    }

    return {
      type,
      name: choreography.name,
      description,
      minDrones,
      choreography,
    };
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  async saveChoreography(choreography: Choreography): Promise<void> {
    const key = `${STORAGE_PREFIX}${choreography.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(choreography));
  }

  async loadChoreography(id: string): Promise<Choreography | null> {
    try {
      const key = `${STORAGE_PREFIX}${id}`;
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Choreography) : null;
    } catch {
      return null;
    }
  }

  async loadAllChoreographies(): Promise<Choreography[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const theaterKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX));
      if (theaterKeys.length === 0) return [];
      const pairs = await AsyncStorage.multiGet(theaterKeys);
      const result: Choreography[] = [];
      for (const [, value] of pairs) {
        if (value) {
          try {
            result.push(JSON.parse(value) as Choreography);
          } catch {
            // skip malformed entries
          }
        }
      }
      return result.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  async deleteChoreography(id: string): Promise<void> {
    const key = `${STORAGE_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
  }

  // ── Keyframe interpolation (public utility) ───────────────────────────────

  interpolate(kfA: KeyFrame, kfB: KeyFrame, timeMs: number): number {
    return interpolateBrightness(kfA, kfB, timeMs);
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _setState(patch: Partial<TheaterState>): void {
    this._state = { ...this._state, ...patch };
    this._emitStateChange();
  }

  private _startInterval(): void {
    this._intervalId = setInterval(() => this._tick(), 33); // ~30fps
  }

  private _stopInterval(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  private _currentElapsedMs(): number {
    return this._seekOffsetMs + (Date.now() - this._playStartWallClock);
  }

  private _tick(): void {
    const choreo = this._state.currentChoreography;
    if (!choreo || this._state.playbackState !== 'playing') return;

    const elapsedMs = this._currentElapsedMs();

    // Finished?
    if (elapsedMs >= choreo.totalDurationMs) {
      this._stopInterval();
      this._setState({
        playbackState: 'finished',
        currentTimeMs: choreo.totalDurationMs,
      });
      if (this._state.spectatorSession) {
        this._emitSpectatorEvent({ type: 'ended' });
      }
      return;
    }

    // Determine current scene
    let sceneStart = 0;
    let sceneIndex = 0;
    for (let i = 0; i < choreo.scenes.length; i++) {
      const scene = choreo.scenes[i];
      if (elapsedMs < sceneStart + scene.durationMs) {
        sceneIndex = i;
        break;
      }
      sceneStart += scene.durationMs;
      sceneIndex = i;
    }

    const scene = choreo.scenes[sceneIndex];
    const localTimeMs = elapsedMs - sceneStart;

    // Scene change event
    if (sceneIndex !== this._state.currentSceneIndex) {
      this._setState({ currentSceneIndex: sceneIndex, currentTimeMs: elapsedMs });
      this._emitSceneChange(sceneIndex, scene);
      if (this._state.spectatorSession) {
        this._emitSpectatorEvent({ type: 'scene', sceneIndex, sceneName: scene.name });
      }
    } else {
      this._setState({ currentTimeMs: elapsedMs });
    }

    // Compute per-drone outputs
    const outputs: Record<string, { brightness: number; colorTemp: string }> = {};
    for (const track of scene.tracks) {
      const sample = sampleTrack(track, localTimeMs);
      outputs[track.droneId] = sample;

      if (this._state.spectatorSession) {
        this._emitSpectatorEvent({
          type: 'keyframe',
          droneId: track.droneId,
          brightness: sample.brightness,
          colorTemp: sample.colorTemp,
        });
      }
    }

    // Sync spectator every ~1s
    if (this._state.spectatorSession && Math.floor(elapsedMs / 1000) !== Math.floor((elapsedMs - 33) / 1000)) {
      this._emitSpectatorEvent({
        type: 'sync',
        showId: this._state.spectatorSession.showId,
        timeMs: elapsedMs,
        totalMs: choreo.totalDurationMs,
      });
    }

    this._setState({ droneOutputs: outputs });
    this._emitOutput(outputs);
  }
}

export const choreographyService = new ChoreographyService();
