import { config } from './config';

// Conditionally import onoff only on real Linux/RPi hardware.
// On non-Linux systems (Windows dev machine), the import is skipped entirely.
let Gpio: typeof import('onoff').Gpio | null = null;
if (!config.mockGpio) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Gpio = require('onoff').Gpio;
  } catch {
    console.warn('[LED] onoff module not available — falling back to mock mode');
  }
}

class LedController {
  private gpio: InstanceType<NonNullable<typeof Gpio>> | null = null;
  private pwmInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (Gpio && !config.mockGpio) {
      try {
        this.gpio = new Gpio(config.ledPin, 'out');
        console.log(`[LED] GPIO initialized on BCM pin ${config.ledPin}`);
      } catch (err) {
        console.error('[LED] Failed to initialize GPIO:', err);
        this.gpio = null;
      }
    } else {
      console.log(`[LED] Mock mode — GPIO calls will be logged to console`);
    }
  }

  /** Turn LED fully on at 100% brightness. */
  on(): void {
    this._clearPwm();
    if (this.gpio) {
      this.gpio.writeSync(1);
    } else {
      console.log('[LED] ON');
    }
  }

  /** Turn LED fully off. */
  off(): void {
    this._clearPwm();
    if (this.gpio) {
      this.gpio.writeSync(0);
    } else {
      console.log('[LED] OFF');
    }
  }

  /**
   * Set LED brightness via software PWM.
   * @param level 0.0 (off) to 1.0 (full brightness)
   */
  setBrightness(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));

    // Avoid PWM overhead for the edge cases
    if (clamped === 1.0) return this.on();
    if (clamped === 0.0) return this.off();

    this._clearPwm();

    const cycleMs = 1000 / config.ledPwmFrequency;
    const onTime = cycleMs * clamped;

    if (this.gpio) {
      const gpio = this.gpio;
      this.pwmInterval = setInterval(() => {
        gpio.writeSync(1);
        setTimeout(() => gpio.writeSync(0), onTime);
      }, cycleMs);
    } else {
      console.log(`[LED] PWM ${Math.round(clamped * 100)}%`);
    }
  }

  /** Release GPIO resources on shutdown. */
  destroy(): void {
    this._clearPwm();
    if (this.gpio) {
      this.gpio.writeSync(0);
      this.gpio.unexport();
      this.gpio = null;
    }
  }

  private _clearPwm(): void {
    if (this.pwmInterval) {
      clearInterval(this.pwmInterval);
      this.pwmInterval = null;
    }
  }
}

export const ledController = new LedController();
