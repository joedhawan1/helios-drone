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

export const DEFAULT_SETTINGS: DroneSettings = {
  host: 'demo',
  port: '8080',
  accessCode: '',
  protocol: 'ws',
};
