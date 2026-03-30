import type { GpsCoordinates, ConnectionStatus, IlluminationStatus } from '../types/drone';

export function formatCoords(coords: GpsCoordinates): string {
  const lat = Math.abs(coords.latitude).toFixed(4);
  const latDir = coords.latitude >= 0 ? 'N' : 'S';
  const lon = Math.abs(coords.longitude).toFixed(4);
  const lonDir = coords.longitude >= 0 ? 'E' : 'W';
  const alt = coords.altitude != null ? `  ALT ${coords.altitude.toFixed(0)}m` : '';
  return `${lat}° ${latDir}   ${lon}° ${lonDir}${alt}`;
}

export function formatCommandId(): string {
  return `${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export function formatConnectionStatus(status: ConnectionStatus): string {
  switch (status) {
    case 'connected': return 'CONNECTED';
    case 'connecting': return 'CONNECTING...';
    case 'disconnected': return 'DISCONNECTED';
    case 'error': return 'CONNECTION ERROR';
  }
}

export function formatIlluminationStatus(status: IlluminationStatus): string {
  switch (status) {
    case 'idle': return 'READY';
    case 'sending': return 'SENDING COMMAND...';
    case 'acknowledged': return 'COMMAND RECEIVED';
    case 'active': return 'ILLUMINATING';
    case 'error': return 'COMMAND FAILED';
  }
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString().slice(11, 19) + ' UTC';
}
