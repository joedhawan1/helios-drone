export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
}

export interface IlluminatePayload {
  commandId: string;
  coordinates: GpsCoordinates;
  timestamp: number;
}

export type CommandStatus = 'pending' | 'active' | 'completed' | 'error';

export interface ActiveCommand {
  commandId: string;
  coordinates: GpsCoordinates;
  status: CommandStatus;
  receivedAt: number;
}

// Inbound WebSocket messages (from the Helios app)
export type InboundMessage =
  | { type: 'auth'; payload: { code: string } }
  | { type: 'illuminate'; payload: IlluminatePayload };

// Outbound WebSocket messages (to the Helios app)
export type OutboundMessage =
  | { type: 'auth_ok' }
  | { type: 'illuminate_ack'; payload: { commandId: string; eta: number } }
  | { type: 'illuminate_active'; payload: { commandId: string } }
  | { type: 'error'; payload: { message: string } };
