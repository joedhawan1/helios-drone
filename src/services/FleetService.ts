import { DroneService } from './DroneService';
import type {
  DroneSettings,
  IlluminateCommand,
  ConnectionStatus,
  IlluminationStatus,
  GpsCoordinates,
} from '../types/drone';
import { formatCommandId } from '../utils/formatters';

export interface FleetDroneStatus {
  id: string;
  connectionStatus: ConnectionStatus;
  illuminationStatus: IlluminationStatus;
}

type FleetEventName = 'fleet:updated';
type FleetListener = () => void;

class FleetService {
  private _drones = new Map<string, { service: DroneService; settings: DroneSettings; label: string; unsubs: (() => void)[] }>();
  private _statuses = new Map<string, { connectionStatus: ConnectionStatus; illuminationStatus: IlluminationStatus }>();
  private _listeners = new Set<FleetListener>();

  on(_event: FleetEventName, listener: FleetListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _emit(): void {
    this._listeners.forEach((l) => l());
  }

  addDrone(id: string, label: string, settings: DroneSettings): void {
    if (this._drones.has(id)) return;
    const service = new DroneService();
    this._statuses.set(id, { connectionStatus: 'disconnected', illuminationStatus: 'idle' });

    const unsubs = [
      service.on('status:connecting', () => { this._statuses.get(id)!.connectionStatus = 'connecting'; this._emit(); }),
      service.on('status:connected', () => { this._statuses.get(id)!.connectionStatus = 'connected'; this._emit(); }),
      service.on('status:disconnected', () => { this._statuses.get(id)!.connectionStatus = 'disconnected'; this._statuses.get(id)!.illuminationStatus = 'idle'; this._emit(); }),
      service.on('status:error', () => { this._statuses.get(id)!.connectionStatus = 'error'; this._emit(); }),
      service.on('illuminate:sending', () => { this._statuses.get(id)!.illuminationStatus = 'sending'; this._emit(); }),
      service.on('illuminate:acknowledged', () => { this._statuses.get(id)!.illuminationStatus = 'acknowledged'; this._emit(); }),
      service.on('illuminate:active', () => { this._statuses.get(id)!.illuminationStatus = 'active'; this._emit(); }),
      service.on('illuminate:error', () => { this._statuses.get(id)!.illuminationStatus = 'error'; this._emit(); }),
    ];

    this._drones.set(id, { service, settings, label, unsubs });
    this._emit();
  }

  removeDrone(id: string): void {
    const entry = this._drones.get(id);
    if (!entry) return;
    entry.unsubs.forEach((u) => u());
    entry.service.disconnect();
    this._drones.delete(id);
    this._statuses.delete(id);
    this._emit();
  }

  async connectAll(): Promise<void> {
    const promises = Array.from(this._drones.entries()).map(([_id, entry]) =>
      entry.service.connect(entry.settings).catch(() => {})
    );
    await Promise.allSettled(promises);
  }

  disconnectAll(): void {
    this._drones.forEach((entry) => entry.service.disconnect());
  }

  async illuminateAll(coords: GpsCoordinates, photoUri: string | null, brightness?: number): Promise<void> {
    const promises = Array.from(this._drones.entries()).map(([_id, entry]) => {
      const cmd: IlluminateCommand = {
        coordinates: coords,
        timestamp: Date.now(),
        photoUri,
        commandId: formatCommandId(),
        brightness,
      };
      return entry.service.illuminate(cmd, entry.settings).catch(() => {});
    });
    await Promise.allSettled(promises);
  }

  getStatuses(): FleetDroneStatus[] {
    return Array.from(this._drones.entries()).map(([id, _entry]) => ({
      id,
      ...this._statuses.get(id)!,
    }));
  }

  getDroneCount(): number {
    return this._drones.size;
  }

  getConnectedCount(): number {
    let count = 0;
    this._statuses.forEach((s) => { if (s.connectionStatus === 'connected') count++; });
    return count;
  }

  getDroneInfo(id: string): { label: string; settings: DroneSettings } | null {
    const entry = this._drones.get(id);
    if (!entry) return null;
    return { label: entry.label, settings: entry.settings };
  }

  getAllDroneInfo(): { id: string; label: string; settings: DroneSettings }[] {
    return Array.from(this._drones.entries()).map(([id, entry]) => ({
      id, label: entry.label, settings: entry.settings,
    }));
  }

  destroy(): void {
    this.disconnectAll();
    this._drones.forEach((entry) => entry.unsubs.forEach((u) => u()));
    this._drones.clear();
    this._statuses.clear();
    this._listeners.clear();
  }
}

export const fleetService = new FleetService();
