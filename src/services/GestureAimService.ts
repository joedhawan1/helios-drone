import type {
  AimVector,
  DeviceOrientation,
  GestureAimConfig,
} from '../types/drone';

type AimListener = (data: AimVector) => void;
type OrientationListener = (data: DeviceOrientation) => void;
type CalibratedListener = (offset: DeviceOrientation) => void;
type StartedListener = (config: GestureAimConfig) => void;
type StoppedListener = () => void;

type GestureAimListener =
  | AimListener
  | OrientationListener
  | CalibratedListener
  | StartedListener
  | StoppedListener;

class GestureAimService {
  private _aimListeners = new Set<AimListener>();
  private _orientationListeners = new Set<OrientationListener>();
  private _calibratedListeners = new Set<CalibratedListener>();
  private _startedListeners = new Set<StartedListener>();
  private _stoppedListeners = new Set<StoppedListener>();

  private _config: GestureAimConfig | null = null;
  private _calibrationOffset: DeviceOrientation | null = null;
  private _lastOrientation: DeviceOrientation | null = null;
  private _smoothedAzimuth = 0;
  private _smoothedElevation = 0;
  private _lastEmitTime = 0;
  private _active = false;

  // ── Event emitter ──────────────────────────────────────────────────────────

  on(event: 'aim', listener: AimListener): () => void;
  on(event: 'orientation', listener: OrientationListener): () => void;
  on(event: 'calibrated', listener: CalibratedListener): () => void;
  on(event: 'started', listener: StartedListener): () => void;
  on(event: 'stopped', listener: StoppedListener): () => void;
  on(event: string, listener: GestureAimListener): () => void {
    switch (event) {
      case 'aim':
        this._aimListeners.add(listener as AimListener);
        return () => this._aimListeners.delete(listener as AimListener);
      case 'orientation':
        this._orientationListeners.add(listener as OrientationListener);
        return () => this._orientationListeners.delete(listener as OrientationListener);
      case 'calibrated':
        this._calibratedListeners.add(listener as CalibratedListener);
        return () => this._calibratedListeners.delete(listener as CalibratedListener);
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

  private _emitAim(data: AimVector): void {
    this._aimListeners.forEach((l) => l(data));
  }

  private _emitOrientation(data: DeviceOrientation): void {
    this._orientationListeners.forEach((l) => l(data));
  }

  private _emitCalibrated(offset: DeviceOrientation): void {
    this._calibratedListeners.forEach((l) => l(offset));
  }

  private _emitStarted(config: GestureAimConfig): void {
    this._startedListeners.forEach((l) => l(config));
  }

  private _emitStopped(): void {
    this._stoppedListeners.forEach((l) => l());
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  start(config: GestureAimConfig): void {
    this._config = config;
    this._active = true;
    this._smoothedAzimuth = 0;
    this._smoothedElevation = 0;
    this._lastEmitTime = 0;
    this._emitStarted(config);
  }

  stop(): void {
    if (this._active) {
      this._active = false;
      this._config = null;
      this._emitStopped();
    }
  }

  /** Save the current orientation as the calibration zero point. */
  calibrate(): void {
    if (this._lastOrientation) {
      this._calibrationOffset = { ...this._lastOrientation };
      this._emitCalibrated(this._calibrationOffset);
    }
  }

  /** Feed a new device orientation reading into the service. */
  updateOrientation(orientation: DeviceOrientation): void {
    this._lastOrientation = orientation;
    this._emitOrientation(orientation);

    if (!this._active || !this._config) return;

    const { sensitivityX, sensitivityY, invertX, invertY, deadzone, smoothing } = this._config;

    let alpha = orientation.alpha;
    let beta = orientation.beta;

    if (this._calibrationOffset) {
      alpha = this._wrapAngle(alpha - this._calibrationOffset.alpha);
      beta = beta - this._calibrationOffset.beta;
    }

    let azimuth = alpha * sensitivityX;
    let elevation = beta * sensitivityY;

    if (invertX) azimuth = -azimuth;
    if (invertY) elevation = -elevation;

    if (Math.abs(azimuth) < deadzone) azimuth = 0;
    if (Math.abs(elevation) < deadzone) elevation = 0;

    azimuth = this._wrapAngle(azimuth);
    elevation = Math.max(-90, Math.min(90, elevation));

    // Exponential smoothing
    const smoothFactor = 1 - Math.max(0, Math.min(0.99, smoothing));
    this._smoothedAzimuth = this._smoothedAzimuth * (1 - smoothFactor) + azimuth * smoothFactor;
    this._smoothedElevation =
      this._smoothedElevation * (1 - smoothFactor) + elevation * smoothFactor;

    // Throttle to ~20fps
    const now = Date.now();
    if (now - this._lastEmitTime < 50) return;
    this._lastEmitTime = now;

    const intensity = this._config.brightnessFromElevation
      ? this._elevationToBrightness(this._smoothedElevation)
      : 1.0;

    const aim: AimVector = {
      azimuth: Math.round(this._smoothedAzimuth * 10) / 10,
      elevation: Math.round(this._smoothedElevation * 10) / 10,
      intensity,
    };

    this._emitAim(aim);
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Up (+90°) → 0.2, level (0°) → 0.6, down (-90°) → 1.0 */
  private _elevationToBrightness(elevation: number): number {
    const t = (elevation + 90) / 180; // 0 at -90deg, 1 at +90deg
    return 1.0 - t * 0.8;
  }

  private _wrapAngle(angle: number): number {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
  }
}

export const gestureAimService = new GestureAimService();
