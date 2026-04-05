import type {
  AudioAnalysis,
  FrequencyBand,
  LightshowConfig,
  LightshowPattern,
} from '../types/drone';

type BeatListener = (data: AudioAnalysis) => void;
type OutputsListener = (data: Record<string, number>) => void;
type StartedListener = (config: LightshowConfig) => void;
type StoppedListener = () => void;

type AudioReactiveListener =
  | BeatListener
  | OutputsListener
  | StartedListener
  | StoppedListener;

class AudioReactiveService {
  private _beatListeners = new Set<BeatListener>();
  private _outputsListeners = new Set<OutputsListener>();
  private _startedListeners = new Set<StartedListener>();
  private _stoppedListeners = new Set<StoppedListener>();

  private _config: LightshowConfig | null = null;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _startTime = 0;
  private _tapTimes: number[] = [];
  private _lastBeatTime = 0;
  private _manualBeat = false;

  // ── Event emitter ──────────────────────────────────────────────────────────

  on(event: 'beat', listener: BeatListener): () => void;
  on(event: 'outputs', listener: OutputsListener): () => void;
  on(event: 'started', listener: StartedListener): () => void;
  on(event: 'stopped', listener: StoppedListener): () => void;
  on(event: string, listener: AudioReactiveListener): () => void {
    switch (event) {
      case 'beat':
        this._beatListeners.add(listener as BeatListener);
        return () => this._beatListeners.delete(listener as BeatListener);
      case 'outputs':
        this._outputsListeners.add(listener as OutputsListener);
        return () => this._outputsListeners.delete(listener as OutputsListener);
      case 'started':
        this._startedListeners.add(listener as StartedListener);
        return () => this._startedListeners.delete(listener as StartedListener);
      case 'stopped':
        this._stoppedListeners.add(listener as StoppedListener);
        return () => this._stoppedListeners.delete(listener as StoppedListener);
      default:
        return () => {};
    }
  }

  private _emitBeat(data: AudioAnalysis): void {
    this._beatListeners.forEach((l) => l(data));
  }

  private _emitOutputs(data: Record<string, number>): void {
    this._outputsListeners.forEach((l) => l(data));
  }

  private _emitStarted(config: LightshowConfig): void {
    this._startedListeners.forEach((l) => l(config));
  }

  private _emitStopped(): void {
    this._stoppedListeners.forEach((l) => l());
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  start(config: LightshowConfig): void {
    this.stop();
    this._config = config;
    this._startTime = Date.now();
    this._lastBeatTime = Date.now();
    this._intervalId = setInterval(() => this._tick(), 33); // ~30fps
    this._emitStarted(config);
  }

  stop(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (this._config !== null) {
      this._config = null;
      this._emitStopped();
    }
  }

  /** Record a tap for manual BPM detection. Averages the last 4 intervals. */
  tapBPM(): void {
    const now = Date.now();
    this._tapTimes.push(now);
    if (this._tapTimes.length > 5) {
      this._tapTimes.shift();
    }
  }

  /** Manually trigger a beat (useful for demo / sync). */
  simulateBeat(): void {
    this._manualBeat = true;
  }

  // ── Internal simulation ────────────────────────────────────────────────────

  private _getTapBPM(): number | null {
    if (this._tapTimes.length < 2) return null;
    const recent = this._tapTimes.slice(-5);
    let totalInterval = 0;
    for (let i = 1; i < recent.length; i++) {
      totalInterval += recent[i] - recent[i - 1];
    }
    const avgInterval = totalInterval / (recent.length - 1);
    const bpm = 60000 / avgInterval;
    return Math.max(40, Math.min(200, bpm));
  }

  private _tick(): void {
    if (!this._config) return;

    const now = Date.now();
    const elapsed = (now - this._startTime) / 1000; // seconds
    const bpm = this._config.bpmOverride ?? this._getTapBPM() ?? 120;
    const beatsPerSec = bpm / 60;
    const beatPeriodMs = 60000 / bpm;

    const timeSinceLastBeat = now - this._lastBeatTime;
    let beatDetected = false;
    if (this._manualBeat || timeSinceLastBeat >= beatPeriodMs) {
      beatDetected = true;
      this._lastBeatTime = now;
      this._manualBeat = false;
    }

    const phase = elapsed * beatsPerSec * Math.PI * 2;
    const beatPulse = beatDetected ? 1.0 : Math.max(0, 1 - (timeSinceLastBeat / beatPeriodMs) * 2);

    const bands: Record<FrequencyBand, number> = {
      sub: Math.abs(Math.sin(phase * 0.5)) * 0.8 * beatPulse + 0.1,
      bass: Math.abs(Math.sin(phase)) * 0.9 * beatPulse + 0.05,
      mid: (Math.sin(phase * 1.5 + 0.5) * 0.5 + 0.5) * 0.7 + 0.1,
      high: (Math.sin(phase * 3 + 1.2) * 0.5 + 0.5) * 0.5 + 0.1,
      brilliance: (Math.sin(phase * 5 + 2.1) * 0.5 + 0.5) * 0.3 + 0.05,
    };

    (Object.keys(bands) as FrequencyBand[]).forEach((k) => {
      bands[k] = Math.max(0, Math.min(1, bands[k]));
    });

    const overallEnergy =
      (bands.sub + bands.bass + bands.mid + bands.high + bands.brilliance) / 5;

    const analysis: AudioAnalysis = { bpm, beatDetected, bands, overallEnergy, timestamp: now };
    this._emitBeat(analysis);

    const output = this._computeOutputs(analysis, elapsed);
    this._emitOutputs(output);
  }

  private _computeOutputs(analysis: AudioAnalysis, elapsed: number): Record<string, number> {
    if (!this._config) return {};

    const { pattern, sensitivity, minBrightness, maxBrightness, bandMapping, bpmOverride, strobeMaxHz } =
      this._config;
    const bpm = bpmOverride ?? analysis.bpm;

    const droneIds = new Set<string>();
    Object.values(bandMapping).forEach((ids) => ids?.forEach((id) => droneIds.add(id)));

    const drones = Array.from(droneIds);
    const count = drones.length || 1;
    const output: Record<string, number> = {};

    drones.forEach((droneId, index) => {
      let brightness = this._patternValue(
        pattern, bpm, strobeMaxHz, elapsed, index, count, analysis, sensitivity,
      );
      brightness = Math.max(minBrightness, Math.min(maxBrightness, brightness));
      output[droneId] = brightness;
    });

    return output;
  }

  private _patternValue(
    pattern: LightshowPattern,
    bpm: number,
    strobeMaxHz: number,
    elapsed: number,
    index: number,
    count: number,
    analysis: AudioAnalysis,
    sensitivity: number,
  ): number {
    const beatsPerSec = bpm / 60;
    const phase = elapsed * beatsPerSec * Math.PI * 2;

    switch (pattern) {
      case 'pulse': {
        const raw = (Math.sin(phase - Math.PI / 2) + 1) / 2;
        return raw * sensitivity;
      }
      case 'strobe': {
        const effectiveBPS = Math.min(beatsPerSec, strobeMaxHz);
        const strobePhase = (elapsed * effectiveBPS) % 1;
        return strobePhase < 0.5 ? sensitivity : 0;
      }
      case 'wave': {
        const offset = (index / count) * Math.PI * 2;
        const raw = (Math.sin(phase - offset - Math.PI / 2) + 1) / 2;
        return raw * sensitivity;
      }
      case 'chase': {
        const activeIndex = Math.floor((elapsed * beatsPerSec) % count);
        return activeIndex === index ? sensitivity : 0;
      }
      case 'rainbow': {
        const offset = (index / count) * Math.PI * 2;
        const raw = (Math.sin(phase + offset) + 1) / 2;
        return raw * sensitivity;
      }
      case 'breathe': {
        const breathePhase = (elapsed / 4) * Math.PI * 2;
        const raw = (Math.sin(breathePhase - Math.PI / 2) + 1) / 2;
        return raw * sensitivity;
      }
      default:
        return analysis.overallEnergy * sensitivity;
    }
  }
}

export const audioReactiveService = new AudioReactiveService();
