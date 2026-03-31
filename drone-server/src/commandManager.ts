import { config } from './config';
import { ledController } from './ledController';
import type { ActiveCommand, CommandStatus, IlluminatePayload } from './types';

interface CommandManagerCallbacks {
  onAck: (commandId: string, eta: number) => void;
  onActive: (commandId: string) => void;
  onError: (commandId: string, message: string) => void;
}

class CommandManager {
  private commands = new Map<string, ActiveCommand>();
  private timers = new Map<string, ReturnType<typeof setTimeout>[]>();

  constructor(private callbacks: CommandManagerCallbacks) {}

  /**
   * Process a new illuminate command.
   * Returns the eta in milliseconds before the LED activates.
   */
  execute(payload: IlluminatePayload): number {
    const { commandId, coordinates } = payload;

    // Cancel any in-flight command
    this._cancelTimers(commandId);
    this.cancelAll();

    const eta = 500; // ms — companion computer is already on the drone

    this.commands.set(commandId, {
      commandId,
      coordinates,
      status: 'pending',
      receivedAt: Date.now(),
    });

    // Immediately acknowledge
    this.callbacks.onAck(commandId, eta);

    const t1 = setTimeout(() => {
      const cmd = this.commands.get(commandId);
      if (!cmd) return;
      cmd.status = 'active';
      ledController.setBrightness(payload.brightness ?? 1.0);
      this.callbacks.onActive(commandId);
      console.log(`[CMD] ${commandId} active — LED ON`);

      // Auto-off after configured duration
      const t2 = setTimeout(() => {
        ledController.off();
        const c = this.commands.get(commandId);
        if (c) c.status = 'completed';
        console.log(`[CMD] ${commandId} completed — LED OFF`);
      }, config.illuminateDurationMs);

      const existing = this.timers.get(commandId) ?? [];
      existing.push(t2);
      this.timers.set(commandId, existing);
    }, eta);

    this.timers.set(commandId, [t1]);
    return eta;
  }

  /** Return the current status of a command, or null if not found. */
  getStatus(commandId: string): CommandStatus | null {
    return this.commands.get(commandId)?.status ?? null;
  }

  /** Cancel all pending timers and turn LED off (called on shutdown). */
  cancelAll(): void {
    this.timers.forEach((timers) => timers.forEach(clearTimeout));
    this.timers.clear();
    ledController.off();
  }

  private _cancelTimers(commandId: string): void {
    const timers = this.timers.get(commandId);
    if (timers) {
      timers.forEach(clearTimeout);
      this.timers.delete(commandId);
    }
  }
}

// Callbacks are wired up in server.ts after the WebSocket broadcast function is available
let _manager: CommandManager | null = null;

export function createCommandManager(callbacks: CommandManagerCallbacks): CommandManager {
  _manager = new CommandManager(callbacks);
  return _manager;
}

export type { CommandManager };
