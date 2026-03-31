import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config';
import { ledController } from './ledController';
import { createCommandManager } from './commandManager';
import type { InboundMessage, OutboundMessage } from './types';

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Track WebSocket clients that have authenticated
const authenticatedClients = new Set<WebSocket>();

function send(ws: WebSocket, msg: OutboundMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(msg: OutboundMessage): void {
  authenticatedClients.forEach((client) => send(client, msg));
}

// Wire up command manager with broadcast callbacks
const commandManager = createCommandManager({
  onAck: (commandId, eta) =>
    broadcast({ type: 'illuminate_ack', payload: { commandId, eta } }),
  onActive: (commandId) =>
    broadcast({ type: 'illuminate_active', payload: { commandId } }),
  onError: (commandId, message) =>
    broadcast({ type: 'error', payload: { message } }),
});

// ─── WebSocket Handler ────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  const requiresAuth = config.accessCode !== '';

  // If no access code is configured, auto-authenticate immediately
  if (!requiresAuth) {
    authenticatedClients.add(ws);
  }

  ws.on('message', (raw) => {
    let msg: InboundMessage;
    try {
      msg = JSON.parse(raw.toString()) as InboundMessage;
    } catch {
      send(ws, { type: 'error', payload: { message: 'Invalid JSON' } });
      return;
    }

    if (msg.type === 'auth') {
      if (requiresAuth && msg.payload.code !== config.accessCode) {
        send(ws, { type: 'error', payload: { message: 'Invalid access code' } });
        ws.close();
        return;
      }
      authenticatedClients.add(ws);
      send(ws, { type: 'auth_ok' });
      console.log('[WS] Client authenticated');
      return;
    }

    if (msg.type === 'illuminate') {
      if (!authenticatedClients.has(ws)) {
        send(ws, { type: 'error', payload: { message: 'Not authenticated' } });
        return;
      }
      console.log(`[WS] Illuminate command received: ${msg.payload.commandId}`);
      commandManager.execute(msg.payload);
      return;
    }
  });

  ws.on('close', () => {
    authenticatedClients.delete(ws);
  });

  ws.on('error', () => {
    authenticatedClients.delete(ws);
  });
});

// ─── HTTP Endpoints ───────────────────────────────────────────────────────────

// Health check — used by the app's HTTP "connect" flow
app.get('/ping', (_req, res) => {
  res.json({ status: 'online' });
});

// Send illuminate command via HTTP
app.post('/illuminate', (req, res) => {
  const { commandId, coordinates, timestamp, brightness } = req.body as {
    commandId?: string;
    coordinates?: { latitude: number; longitude: number; altitude: number | null };
    timestamp?: number;
    brightness?: number;
  };

  if (!commandId || !coordinates) {
    res.status(400).json({ error: 'commandId and coordinates are required' });
    return;
  }

  // Optional: validate access code via Authorization header or body field
  if (config.accessCode) {
    const provided =
      (req.headers['x-access-code'] as string | undefined) ??
      (req.body as { accessCode?: string }).accessCode;
    if (provided !== config.accessCode) {
      res.status(401).json({ error: 'Invalid access code' });
      return;
    }
  }

  console.log(`[HTTP] Illuminate command received: ${commandId}`);
  const eta = commandManager.execute({ commandId, coordinates, timestamp: timestamp ?? Date.now(), brightness });
  res.status(202).json({ commandId, eta });
});

// Poll command status — used by the app's HTTP polling flow
app.get('/status/:commandId', (req, res) => {
  const status = commandManager.getStatus(req.params.commandId);
  if (status === null) {
    res.status(404).json({ error: 'Command not found' });
    return;
  }
  res.json({ status });
});

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(config.port, '0.0.0.0', () => {
  console.log(`[Helios Drone Server] Listening on port ${config.port}`);
  console.log(`[Config] Mock GPIO: ${config.mockGpio}`);
  console.log(`[Config] LED pin: BCM ${config.ledPin}`);
  console.log(`[Config] Auth required: ${config.accessCode !== ''}`);
  console.log(`[Config] Illuminate duration: ${config.illuminateDurationMs}ms`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(): void {
  console.log('\n[Server] Shutting down...');
  commandManager.cancelAll();
  ledController.off();
  ledController.destroy();
  httpServer.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
