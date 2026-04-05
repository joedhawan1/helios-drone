import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  LightPaintCanvas,
  LightPaintConfig,
  LightPaintState,
  PaintPoint,
  PaintStroke,
} from '../types/drone';

const STORAGE_KEY = 'helios_canvases_v1';

interface ProgressData {
  executionProgress: number;
  activeStrokeIndex: number;
  activePointIndex: number;
}

type ModeListener = (mode: LightPaintState['mode']) => void;
type CanvasListener = (canvas: LightPaintCanvas | null) => void;
type ProgressListener = (data: ProgressData) => void;

type LightPaintListener = ModeListener | CanvasListener | ProgressListener;

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

class LightPaintService {
  private _modeListeners = new Set<ModeListener>();
  private _canvasListeners = new Set<CanvasListener>();
  private _progressListeners = new Set<ProgressListener>();

  private _canvas: LightPaintCanvas | null = null;
  private _currentStroke: PaintPoint[] = [];
  private _executing = false;
  private _abortExecution = false;

  // ── Event emitter ──────────────────────────────────────────────────────────

  on(event: 'mode', listener: ModeListener): () => void;
  on(event: 'canvas', listener: CanvasListener): () => void;
  on(event: 'progress', listener: ProgressListener): () => void;
  on(event: string, listener: LightPaintListener): () => void {
    switch (event) {
      case 'mode':
        this._modeListeners.add(listener as ModeListener);
        return () => this._modeListeners.delete(listener as ModeListener);
      case 'canvas':
        this._canvasListeners.add(listener as CanvasListener);
        return () => this._canvasListeners.delete(listener as CanvasListener);
      case 'progress':
        this._progressListeners.add(listener as ProgressListener);
        return () => this._progressListeners.delete(listener as ProgressListener);
      default:
        return () => {};
    }
  }

  private _emitMode(mode: LightPaintState['mode']): void {
    this._modeListeners.forEach((l) => l(mode));
  }

  private _emitCanvas(canvas: LightPaintCanvas | null): void {
    this._canvasListeners.forEach((l) => l(canvas));
  }

  private _emitProgress(data: ProgressData): void {
    this._progressListeners.forEach((l) => l(data));
  }

  // ── Drawing API ────────────────────────────────────────────────────────────

  startDrawing(): void {
    this._currentStroke = [];
    if (!this._canvas) {
      this._canvas = {
        id: generateId(),
        name: 'Untitled',
        strokes: [],
        width: 1,
        height: 1,
        createdAt: new Date().toISOString(),
      };
      this._emitCanvas(this._canvas);
    }
    this._emitMode('drawing');
  }

  addPoint(point: PaintPoint): void {
    this._currentStroke.push(point);
  }

  endStroke(brightness: number, speed: number): void {
    if (!this._canvas || this._currentStroke.length === 0) return;
    const stroke: PaintStroke = {
      id: generateId(),
      points: [...this._currentStroke],
      brightness: Math.max(0, Math.min(1, brightness)),
      speed: Math.max(0.1, speed),
      color: 'white',
    };
    this._canvas = { ...this._canvas, strokes: [...this._canvas.strokes, stroke] };
    this._currentStroke = [];
    this._emitCanvas(this._canvas);
    this._emitMode('previewing');
  }

  clearCanvas(): void {
    this._canvas = null;
    this._emitCanvas(null);
    this._emitMode('idle');
  }

  // ── Execution API ──────────────────────────────────────────────────────────

  execute(config: LightPaintConfig): void {
    if (this._executing || !this._canvas) return;
    void this._runExecution(this._canvas, config);
  }

  private async _runExecution(canvas: LightPaintCanvas, config: LightPaintConfig): Promise<void> {
    this._executing = true;
    this._abortExecution = false;
    this._emitMode('executing');

    const totalPoints = canvas.strokes.reduce((sum, s) => sum + s.points.length, 0);
    const repeat = Math.max(1, config.repeatCount);
    let globalPointCount = 0;

    for (let run = 0; run < repeat && !this._abortExecution; run++) {
      for (let si = 0; si < canvas.strokes.length && !this._abortExecution; si++) {
        const stroke = canvas.strokes[si];
        for (let pi = 0; pi < stroke.points.length && !this._abortExecution; pi++) {
          globalPointCount++;
          const executionProgress =
            totalPoints > 0 ? globalPointCount / (totalPoints * repeat) : 0;

          this._emitProgress({
            executionProgress,
            activeStrokeIndex: si,
            activePointIndex: pi,
          });

          await this._delay(config.droneSpeedMs / stroke.speed);
        }
      }
    }

    this._executing = false;
    if (!this._abortExecution) {
      this._emitMode('previewing');
    }
  }

  stopExecution(): void {
    this._abortExecution = true;
    this._executing = false;
    this._emitMode('previewing');
  }

  // ── Presets ────────────────────────────────────────────────────────────────

  loadPreset(name: string): void {
    const presets = this._buildPresets();
    const strokes = presets[name];
    if (!strokes) return;
    this._canvas = {
      id: generateId(),
      name,
      strokes,
      width: 1,
      height: 1,
      createdAt: new Date().toISOString(),
    };
    this._emitCanvas(this._canvas);
    this._emitMode('previewing');
  }

  getPresets(): Record<string, PaintStroke[]> {
    return this._buildPresets();
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  async saveCanvas(name: string): Promise<void> {
    if (!this._canvas) return;
    const canvas: LightPaintCanvas = { ...this._canvas, name };
    const existing = await this.loadSavedCanvases();
    const idx = existing.findIndex((c) => c.id === canvas.id);
    if (idx >= 0) {
      existing[idx] = canvas;
    } else {
      existing.push(canvas);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }

  async loadSavedCanvases(): Promise<LightPaintCanvas[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as LightPaintCanvas[];
    } catch {
      return [];
    }
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  private _makeStroke(pts: [number, number][], brightness = 0.8, speed = 1): PaintStroke {
    const now = Date.now();
    return {
      id: generateId(),
      points: pts.map(([x, y], i) => ({ x, y, timestamp: now + i * 16 })),
      brightness,
      speed,
      color: 'white',
    };
  }

  private _buildPresets(): Record<string, PaintStroke[]> {
    return {
      heart: this._makeHeart(),
      star: this._makeStar(),
      spiral: this._makeSpiral(),
      zigzag: this._makeZigzag(),
      infinity: this._makeInfinity(),
    };
  }

  // ── Preset shape generators (normalized 0.0–1.0 coords) ──────────────────

  private _makeHeart(): PaintStroke[] {
    const pts: [number, number][] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      pts.push([(x + 16) / 32, 1 - (y + 17) / 34]);
    }
    return [this._makeStroke(pts)];
  }

  private _makeStar(): PaintStroke[] {
    const pts: [number, number][] = [];
    const spikes = 5;
    for (let i = 0; i <= spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const r = i % 2 === 0 ? 0.45 : 0.2;
      pts.push([0.5 + r * Math.cos(angle), 0.5 + r * Math.sin(angle)]);
    }
    return [this._makeStroke(pts)];
  }

  private _makeSpiral(): PaintStroke[] {
    const pts: [number, number][] = [];
    for (let t = 0; t <= Math.PI * 6; t += 0.15) {
      const r = (t / (Math.PI * 6)) * 0.45;
      pts.push([0.5 + r * Math.cos(t), 0.5 + r * Math.sin(t)]);
    }
    return [this._makeStroke(pts)];
  }

  private _makeZigzag(): PaintStroke[] {
    const pts: [number, number][] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      pts.push([i / steps, i % 2 === 0 ? 0.2 : 0.8]);
    }
    return [this._makeStroke(pts)];
  }

  private _makeInfinity(): PaintStroke[] {
    const pts: [number, number][] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const scale = 1 / (1 + Math.pow(Math.sin(t), 2));
      pts.push([
        0.5 + 0.4 * Math.cos(t) * scale,
        0.5 + 0.25 * Math.sin(t) * Math.cos(t) * scale,
      ]);
    }
    return [this._makeStroke(pts)];
  }
}

export const lightPaintService = new LightPaintService();
