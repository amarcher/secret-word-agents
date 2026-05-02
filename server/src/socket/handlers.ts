import type { Server, Socket } from 'socket.io';
import {
  MAX_NAME_LENGTH,
  type ClientToServerEvents,
  type InterServerEvents,
  type JoinResult,
  type ServerToClientEvents,
  type SocketData,
} from '@saw/shared';
import type { RoomManager } from './RoomManager.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

function sanitizeCodename(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_NAME_LENGTH);
}

function joinFailure(error: string): JoinResult {
  return { success: false, error };
}

export function registerHandlers(io: IO, manager: RoomManager): void {
  io.on('connection', (socket: IOSocket) => {
    socket.on('room:create', (data, callback) => {
      const codename = sanitizeCodename(data?.codename);
      if (!codename) return callback(joinFailure('Codename is required'));

      const result = manager.createRoom(socket.id, codename);
      socket.join(result.roomCode);
      socket.data.playerId = socket.id;
      socket.data.codename = codename;
      socket.data.roomCode = result.roomCode;
      socket.data.team = result.team;
      socket.data.reconnectToken = result.reconnectToken;

      const room = manager.getRoom(result.roomCode);
      if (!room) return callback(joinFailure('Room missing after create'));

      callback({
        success: true,
        roomCode: result.roomCode,
        reconnectToken: result.reconnectToken,
        team: result.team,
        view: room.getViewForTeam(result.team),
        room: room.getRoomState(),
      });
      room.emitFullState();
    });

    socket.on('room:join', (data, callback) => {
      const codename = sanitizeCodename(data?.codename);
      if (!codename) return callback(joinFailure('Codename is required'));
      if (typeof data?.roomCode !== 'string' || !data.roomCode.trim()) {
        return callback(joinFailure('Room code is required'));
      }

      // Reconnect path: the client provided a token they previously held.
      if (typeof data.reconnectToken === 'string' && data.reconnectToken) {
        const reconnect = manager.reconnect(data.reconnectToken, socket.id, data.roomCode);
        if (reconnect.ok) {
          socket.join(reconnect.roomCode);
          socket.data.playerId = socket.id;
          socket.data.codename = codename;
          socket.data.roomCode = reconnect.roomCode;
          socket.data.team = reconnect.team;
          socket.data.reconnectToken = data.reconnectToken;

          const room = manager.getRoom(reconnect.roomCode);
          if (!room) return callback(joinFailure('Room missing after reconnect'));

          callback({
            success: true,
            roomCode: reconnect.roomCode,
            reconnectToken: data.reconnectToken,
            team: reconnect.team,
            view: room.getViewForTeam(reconnect.team),
            room: room.getRoomState(),
          });
          room.emitFullState();
          return;
        }
        // Reconnect failed (room expired, token unknown). Fall through to a
        // normal join so the client doesn't get stuck in a "stale token" loop.
      }

      const result = manager.joinRoom(socket.id, data.roomCode, codename);
      if (!result.ok) return callback(joinFailure(result.error));

      socket.join(result.roomCode);
      socket.data.playerId = socket.id;
      socket.data.codename = codename;
      socket.data.roomCode = result.roomCode;
      socket.data.team = result.team;
      socket.data.reconnectToken = result.reconnectToken;

      const room = manager.getRoom(result.roomCode);
      if (!room) return callback(joinFailure('Room missing after join'));

      callback({
        success: true,
        roomCode: result.roomCode,
        reconnectToken: result.reconnectToken,
        team: result.team,
        view: room.getViewForTeam(result.team),
        room: room.getRoomState(),
      });
      room.emitFullState();
    });

    socket.on('room:leave', () => {
      manager.leaveRoom(socket.id);
      socket.leave(socket.data.roomCode);
    });

    socket.on('game:guess', (data, callback) => {
      const room = manager.getRoomForSocket(socket.id);
      if (!room) return callback({ success: false, error: 'Not in a room' });
      if (typeof data?.word !== 'string') return callback({ success: false, error: 'Invalid word' });
      const outcome = room.applyGuess(socket.id, data.word);
      if (!outcome) return callback({ success: false, error: 'Guess rejected' });
      callback({ success: true, outcome });
    });

    socket.on('game:giveClue', (data, callback) => {
      const room = manager.getRoomForSocket(socket.id);
      if (!room) return callback({ success: false, error: 'Not in a room' });
      if (typeof data?.word !== 'string' || !data.word.trim()) {
        return callback({ success: false, error: 'Clue word is required' });
      }
      if (typeof data?.count !== 'number' || data.count < 0) {
        return callback({ success: false, error: 'Invalid clue count' });
      }
      const ok = room.applyClue(socket.id, data.word.trim(), Math.floor(data.count));
      if (!ok) return callback({ success: false, error: 'Clue rejected' });
      callback({ success: true });
    });

    socket.on('game:endTurn', () => {
      const room = manager.getRoomForSocket(socket.id);
      if (!room) return;
      room.applyEndTurn(socket.id);
    });

    socket.on('game:newGame', () => {
      const room = manager.getRoomForSocket(socket.id);
      if (!room) return;
      room.newGame();
    });

    socket.on('disconnect', () => {
      manager.handleDisconnect(socket.id);
      const room = manager.getRoomForSocket(socket.id);
      // After mark-disconnected, room may still exist with a ghost slot;
      // re-emit so the partner sees the connected:false flag.
      if (room) room.emitFullState();
    });
  });
}
