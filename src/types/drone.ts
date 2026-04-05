export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export type IlluminationStatus =
  | 'idle'
  | 'sending'
  | 'acknowledged'
  | 'active'
  | 'error';

export type Protocol = 'ws' | 'http';

export interface DroneSettings {
  host: string;
  port: string;
  accessCode: string;
  protocol: Protocol;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
}

export interface IlluminateCommand {
  coordinates: GpsCoordinates;
  timestamp: number;
  photoUri: string | null;
  commandId: string;
  brightness?: number;
}

export interface FleetDrone {
  id: string;
  label: string;
  settings: DroneSettings;
  connectionStatus: ConnectionStatus;
  illuminationStatus: IlluminationStatus;
}

export type WeatherCondition = 'clear' | 'cloudy' | 'overcast' | 'rain' | 'storm' | 'snow' | 'fog';

export interface WeatherData {
  condition: WeatherCondition;
  windSpeedMs: number;
  tempC: number;
  humidity: number;
  description: string;
  brightnessRecommendation: number;
  warnings: string[];
}

export type Recurrence = 'none' | 'daily' | 'weekly';

export interface Schedule {
  id: string;
  name: string;
  coordinates: GpsCoordinates;
  dateTime: number;
  recurrence: Recurrence;
  brightness: number;
  droneIds: string[];
  enabled: boolean;
}

export interface FleetContextValue {
  fleet: FleetDrone[];
  schedules: Schedule[];
  weather: WeatherData | null;
  weatherLoading: boolean;
  addDrone: (label: string, settings: DroneSettings) => void;
  removeDrone: (id: string) => void;
  connectFleet: () => Promise<void>;
  disconnectFleet: () => void;
  illuminateFleet: (coords: GpsCoordinates, photoUri: string | null) => Promise<void>;
  fetchWeather: (coords: GpsCoordinates) => Promise<void>;
  createSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>;
  updateSchedule: (schedule: Schedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

export interface DroneContextValue {
  connectionStatus: ConnectionStatus;
  illuminationStatus: IlluminationStatus;
  settings: DroneSettings;
  lastCommand: IlluminateCommand | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  illuminate: (coords: GpsCoordinates, photoUri: string | null) => Promise<void>;
  updateSettings: (settings: DroneSettings) => Promise<void>;
}

// ── Mission Recorder & Playback ──

export interface MissionWaypoint {
  id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  illuminateDuration: number;
  brightness: number;
  delayAfter: number;
}

export interface Mission {
  id: string;
  name: string;
  waypoints: MissionWaypoint[];
  droneIds: string[];
  createdAt: string;
  lastRunAt?: string;
}

// ── Telemetry Dashboard ──

export interface CommandLog {
  commandId: string;
  droneId: string;
  droneName: string;
  sentAt: number;
  respondedAt?: number;
  status: 'pending' | 'success' | 'timeout' | 'error';
  latencyMs?: number;
}

export interface TelemetryStats {
  droneId?: string;
  totalCommands: number;
  successRate: number;
  avgLatencyMs: number;
  totalIlluminationMs: number;
}

// ── Fleet Formation Mode ──

export type FormationShape = 'line' | 'v-shape' | 'circle' | 'grid';
export type FireMode = 'simultaneous' | 'sequential' | 'ripple';

export interface FormationSlot {
  position: number;
  droneId: string;
}

export interface Formation {
  id: string;
  name: string;
  shape: FormationShape;
  fireMode: FireMode;
  slots: FormationSlot[];
  delayBetweenMs: number;
  brightness: number;
}

// ── Studio: Sound-Reactive Lightshow ──

export type FrequencyBand = 'sub' | 'bass' | 'mid' | 'high' | 'brilliance';

export type LightshowPattern = 'pulse' | 'strobe' | 'wave' | 'chase' | 'rainbow' | 'breathe';

export interface AudioAnalysis {
  bpm: number;
  beatDetected: boolean;
  bands: Record<FrequencyBand, number>; // 0.0–1.0 energy per band
  overallEnergy: number; // 0.0–1.0
  timestamp: number;
}

export interface LightshowConfig {
  id: string;
  name: string;
  pattern: LightshowPattern;
  sensitivity: number; // 0.0–1.0
  minBrightness: number; // floor brightness 0.0–1.0
  maxBrightness: number; // ceiling brightness 0.0–1.0
  colorTemp: 'warm' | 'neutral' | 'cool';
  bandMapping: Partial<Record<FrequencyBand, string[]>>; // band → droneIds
  bpmOverride?: number; // manual BPM lock
  strobeMaxHz: number; // safety cap for strobe frequency
}

export interface LightshowState {
  active: boolean;
  config: LightshowConfig | null;
  currentAnalysis: AudioAnalysis | null;
  droneOutputs: Record<string, number>; // droneId → current brightness
}

// ── Studio: Gesture Aim ("Sky Pointer") ──

export interface DeviceOrientation {
  alpha: number; // yaw (0–360)
  beta: number;  // pitch (-180–180)
  gamma: number; // roll (-90–90)
}

export interface AimVector {
  azimuth: number; // horizontal angle in degrees (0–360)
  elevation: number; // vertical angle (-90 to 90, negative = down)
  intensity: number; // derived brightness from elevation (higher aim = dimmer)
}

export interface GestureAimConfig {
  id: string;
  sensitivityX: number; // horizontal sensitivity multiplier
  sensitivityY: number; // vertical sensitivity multiplier
  invertX: boolean;
  invertY: boolean;
  deadzone: number; // degrees of tilt to ignore (anti-jitter)
  smoothing: number; // 0.0–1.0, exponential moving average factor
  brightnessFromElevation: boolean; // auto-adjust brightness based on aim angle
  targetDroneIds: string[]; // which drones respond to gesture
}

export interface GestureAimState {
  active: boolean;
  config: GestureAimConfig | null;
  currentOrientation: DeviceOrientation | null;
  currentAim: AimVector | null;
  calibrationOffset: DeviceOrientation | null; // "zero" position
}

// ── Studio: AR Light Painting ──

export interface PaintPoint {
  x: number; // normalized 0.0–1.0 screen position
  y: number;
  timestamp: number;
}

export interface PaintStroke {
  id: string;
  points: PaintPoint[];
  brightness: number;
  speed: number; // playback speed multiplier
  color: 'white' | 'warm' | 'cool';
}

export interface LightPaintCanvas {
  id: string;
  name: string;
  strokes: PaintStroke[];
  width: number; // reference canvas size
  height: number;
  createdAt: string;
}

export interface LightPaintConfig {
  exposureTimeSec: number; // suggested camera exposure for long-exposure
  droneSpeedMs: number; // ms per paint point (controls drone movement speed)
  repeatCount: number; // how many times to trace the pattern
  fadeTrail: boolean; // gradually reduce brightness along stroke tail
  assignedDroneIds: string[]; // drones that execute the painting
}

export interface LightPaintState {
  mode: 'idle' | 'drawing' | 'previewing' | 'executing';
  canvas: LightPaintCanvas | null;
  config: LightPaintConfig;
  executionProgress: number; // 0.0–1.0
  activeStrokeIndex: number;
  activePointIndex: number;
}

// ── Studio Context ──

export type StudioMode = 'lightshow' | 'gesture' | 'paint' | null;

export interface StudioContextValue {
  activeMode: StudioMode;
  setActiveMode: (mode: StudioMode) => void;
  lightshow: LightshowState;
  gestureAim: GestureAimState;
  lightPaint: LightPaintState;
  // Lightshow
  startLightshow: (config: LightshowConfig) => void;
  stopLightshow: () => void;
  tapBPM: () => void;
  simulateBeat: () => void;
  // Gesture Aim
  startGestureAim: (config: GestureAimConfig) => void;
  stopGestureAim: () => void;
  calibrateGesture: () => void;
  updateOrientation: (orientation: DeviceOrientation) => void;
  // Light Paint
  startDrawing: () => void;
  addPaintPoint: (point: PaintPoint) => void;
  endStroke: (brightness: number, speed: number) => void;
  clearCanvas: () => void;
  executeCanvas: (config: LightPaintConfig) => void;
  stopExecution: () => void;
  loadPreset: (name: string) => void;
  saveCanvas: (name: string) => void;
  loadSavedCanvases: () => Promise<LightPaintCanvas[]>;
}

export const DEFAULT_SETTINGS: DroneSettings = {
  host: 'demo',
  port: '8080',
  accessCode: '',
  protocol: 'ws',
};
