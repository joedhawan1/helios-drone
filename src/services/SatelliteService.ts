import type {
  SatelliteSettings,
  IlluminateCommand,
  ConnectionStatus,
  IlluminationStatus,
} from '../types/satellite';

type EventName =
  | 'status:connected'
  | 'status:disconnected'
  | 'status:connecting'
  | 'status:error'
  | 'illuminate:sending'
  | 'illuminate:acknowledged'
  | 'illuminate:active'
  | 'illuminate:error';

type EventPayload = {
  'status:connected': undefined;
  'status:disconnected': undefined;
  'status:connecting': undefined;
  'status:error': { message: string };
  'illuminate:sending': undefined;
  'illuminate:acknowledged': { commandId: string; eta?: number };
  'illuminate:active': { commandId: string };
  'illuminate:error': { message: string };
};

type Listener<E extends EventName> = (payload: EventPayload[E]) => void;

class SatelliteService {
  private _listeners = new Map<EventName, Set<(payload: unknown) => void>>();
  private _ws: WebSocket | null = null;
  private _pollInterval: ReturnType<typeof setInterval> | null = null;
  private _mockTimers: ReturnType<typeof setTimeout>[] = [];

  on<E extends EventName>(event: E, listener: Listener<E>): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener as (payload: unknown) => void);
    return () => this.off(event, listener);
  }

  off<E extends EventName>(event: E, listener: Listener<E>): void {
    this._listeners.get(event)?.delete(listener as (payload: unknown) => void);
  }

  private emit<E extends EventName>(event: E, payload?: EventPayload[E]): void {
    this._listeners.get(event)?.forEach((l) => l(payload));
  }

  disconnect(): void {
    this._mockTimers.forEach(clearTimeout);
    this._mockTimers = [];
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this.emit('status:disconnected');
  }

  async connect(settings: SatelliteSettings): Promise<void> {
    this.disconnect();
    this.emit('status:connecting');

    if (settings.host === 'demo' || settings.host === '') {
      return this._connectMock();
    }

    if (settings.protocol === 'ws') {
      return this._connectWS(settings);
    }

    return this._connectHTTP(settings);
  }

  private _connectMock(): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        this.emit('status:connected');
        resolve();
      }, 1500);
      this._mockTimers.push(t);
    });
  }

  private _connectWS(settings: SatelliteSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://${settings.host}:${settings.port}`;
      const ws = new WebSocket(url);
      this._ws = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timed out'));
        this.emit('status:error', { message: 'Connection timed out' });
      }, 8000);

      ws.onopen = () => {
        clearTimeout(timeout);
        if (settings.accessCode) {
          ws.send(JSON.stringify({ type: 'auth', payload: { code: settings.accessCode } }));
        } else {
          this.emit('status:connected');
          resolve();
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; payload?: unknown };
          if (msg.type === 'auth_ok') {
            this.emit('status:connected');
            resolve();
          } else if (msg.type === 'illuminate_ack') {
            const p = msg.payload as { commandId: string; eta?: number };
            this.emit('illuminate:acknowledged', p);
          } else if (msg.type === 'illuminate_active') {
            const p = msg.payload as { commandId: string };
            this.emit('illuminate:active', p);
          } else if (msg.type === 'error') {
            const p = msg.payload as { message: string };
            this.emit('illuminate:error', p);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        this.emit('status:error', { message: 'WebSocket error' });
        reject(new Error('WebSocket error'));
      };

      ws.onclose = () => {
        if (this._ws === ws) {
          this._ws = null;
          this.emit('status:disconnected');
        }
      };
    });
  }

  private async _connectHTTP(settings: SatelliteSettings): Promise<void> {
    const base = `http://${settings.host}:${settings.port}`;
    const resp = await fetch(`${base}/ping`, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) throw new Error('Satellite ping failed');
    this.emit('status:connected');
  }

  async illuminate(cmd: IlluminateCommand, settings: SatelliteSettings): Promise<void> {
    this.emit('illuminate:sending');

    if (settings.host === 'demo' || settings.host === '') {
      return this._illuminateMock(cmd);
    }

    if (settings.protocol === 'ws') {
      return this._illuminateWS(cmd);
    }

    return this._illuminateHTTP(cmd, settings);
  }

  private _illuminateMock(cmd: IlluminateCommand): Promise<void> {
    return new Promise((resolve) => {
      const t1 = setTimeout(() => {
        this.emit('illuminate:acknowledged', { commandId: cmd.commandId, eta: 2000 });
        const t2 = setTimeout(() => {
          this.emit('illuminate:active', { commandId: cmd.commandId });
          resolve();
        }, 2000);
        this._mockTimers.push(t2);
      }, 800);
      this._mockTimers.push(t1);
    });
  }

  private _illuminateWS(cmd: IlluminateCommand): Promise<void> {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      this.emit('illuminate:error', { message: 'Not connected' });
      return Promise.reject(new Error('Not connected'));
    }
    this._ws.send(
      JSON.stringify({
        type: 'illuminate',
        payload: {
          commandId: cmd.commandId,
          coordinates: cmd.coordinates,
          timestamp: cmd.timestamp,
        },
      }),
    );
    return Promise.resolve();
  }

  private async _illuminateHTTP(cmd: IlluminateCommand, settings: SatelliteSettings): Promise<void> {
    const base = `http://${settings.host}:${settings.port}`;
    const resp = await fetch(`${base}/illuminate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commandId: cmd.commandId,
        coordinates: cmd.coordinates,
        timestamp: cmd.timestamp,
      }),
    });
    if (!resp.ok) {
      this.emit('illuminate:error', { message: 'Server error' });
      throw new Error('Server error');
    }
    const data = (await resp.json()) as { commandId: string; eta?: number };
    this.emit('illuminate:acknowledged', { commandId: data.commandId, eta: data.eta });

    // Poll for active status
    let attempts = 0;
    this._pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(this._pollInterval!);
        this._pollInterval = null;
        return;
      }
      try {
        const statusResp = await fetch(`${base}/status/${cmd.commandId}`);
        const status = (await statusResp.json()) as { status: string };
        if (status.status === 'active') {
          clearInterval(this._pollInterval!);
          this._pollInterval = null;
          this.emit('illuminate:active', { commandId: cmd.commandId });
        } else if (status.status === 'error') {
          clearInterval(this._pollInterval!);
          this._pollInterval = null;
          this.emit('illuminate:error', { message: 'Illumination failed' });
        }
      } catch {
        // ignore polling errors
      }
    }, 1000);
  }
}

export const satelliteService = new SatelliteService();
