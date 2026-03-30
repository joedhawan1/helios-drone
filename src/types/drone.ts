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

export const DEFAULT_SETTINGS: DroneSettings = {
  host: 'demo',
  port: '8080',
  accessCode: '',
  protocol: 'ws',
};
