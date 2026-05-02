import express from 'express';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@saw/shared';
import { RoomManager } from './socket/RoomManager.js';
import { registerHandlers } from './socket/handlers.js';
import { PushHub, loadVapidConfig } from './push/PushHub.js';

const app = express();
app.use(express.json({ limit: '32kb' }));

const httpServer = createServer(app);
const isProd = process.env.NODE_ENV === 'production';

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: isProd
      ? undefined
      : {
          origin: ['http://localhost:5173', 'http://localhost:4173'],
          methods: ['GET', 'POST'],
        },
  },
);

const pushHub = new PushHub(loadVapidConfig());

const manager = new RoomManager(
  {
    broadcastToRoom: (roomCode, event, payload) => {
      io.to(roomCode).emit(event as keyof ServerToClientEvents, payload as never);
    },
    emitToPlayer: (playerId, event, payload) => {
      io.to(playerId).emit(event as keyof ServerToClientEvents, payload as never);
    },
  },
  { pushHub },
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/push/key', (_req, res) => {
  res.json({ publicKey: pushHub.publicKey });
});

app.post('/api/push/subscribe', (req, res) => {
  const { reconnectToken, subscription } = req.body ?? {};
  if (typeof reconnectToken !== 'string' || !reconnectToken) {
    return res.status(400).json({ error: 'reconnectToken required' });
  }
  if (
    !subscription ||
    typeof subscription !== 'object' ||
    typeof subscription.endpoint !== 'string'
  ) {
    return res.status(400).json({ error: 'subscription required' });
  }
  pushHub.register(reconnectToken, subscription);
  res.status(204).end();
});

app.post('/api/push/unsubscribe', (req, res) => {
  const { reconnectToken } = req.body ?? {};
  if (typeof reconnectToken === 'string' && reconnectToken) {
    pushHub.unregister(reconnectToken);
  }
  res.status(204).end();
});

registerHandlers(io, manager);

if (isProd) {
  const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`Secret Agent Words server listening on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  manager.destroy();
  httpServer.close();
});
