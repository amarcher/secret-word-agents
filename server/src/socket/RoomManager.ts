import { randomUUID } from 'node:crypto';
import {
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  ROOM_INACTIVITY_TIMEOUT,
  ROOM_SWEEP_INTERVAL,
  type TeamId,
} from '@saw/shared';
import { GameRoom } from './GameRoom.js';

export interface SocketCallbacks {
  broadcastToRoom: (roomCode: string, event: string, payload: unknown) => void;
  emitToPlayer: (playerId: string, event: string, payload: unknown) => void;
}

interface CreateOk {
  ok: true;
  roomCode: string;
  team: TeamId;
  reconnectToken: string;
}
interface JoinOk {
  ok: true;
  roomCode: string;
  team: TeamId;
  reconnectToken: string;
}
interface JoinErr {
  ok: false;
  error: string;
}
type CreateResult = CreateOk;
export type JoinResult = JoinOk | JoinErr;

interface ReconnectOk {
  ok: true;
  roomCode: string;
  team: TeamId;
}
interface ReconnectErr {
  ok: false;
  error: string;
}
export type ReconnectResult = ReconnectOk | ReconnectErr;

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private tokenToSocket: Map<string, string> = new Map();
  private callbacks: SocketCallbacks;
  private sweepInterval: ReturnType<typeof setInterval> | null = null;
  private now: () => number;

  constructor(callbacks: SocketCallbacks, options: { now?: () => number; autoSweep?: boolean } = {}) {
    this.callbacks = callbacks;
    this.now = options.now ?? Date.now;
    if (options.autoSweep !== false) {
      this.sweepInterval = setInterval(() => this.sweep(), ROOM_SWEEP_INTERVAL);
    }
  }

  createRoom(socketId: string, codename: string): CreateResult {
    const roomCode = this.generateRoomCode();
    const room = new GameRoom(roomCode, this.bindCallbacks(roomCode), this.now);
    const team = room.addPlayer(socketId, codename);
    if (team === null) {
      // Unreachable — fresh room always has space.
      throw new Error('addPlayer returned null on a fresh room');
    }
    this.rooms.set(roomCode, room);
    this.socketToRoom.set(socketId, roomCode);
    const reconnectToken = this.issueToken(socketId);
    return { ok: true, roomCode, team, reconnectToken };
  }

  joinRoom(socketId: string, roomCode: string, codename: string): JoinResult {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'Room not found' };

    // If a slot is held by a *disconnected* ghost with the same codename, evict
    // it — the ghost player has effectively been replaced. Avoids permanently
    // locking out a name when the original player can't reconnect.
    const existing = room.getRoomState().players;
    const ghost = existing.find(p => !p.connected && p.codename.toLowerCase() === codename.toLowerCase());
    if (ghost) {
      room.removePlayer(ghost.id);
      this.socketToRoom.delete(ghost.id);
      this.clearTokenForSocket(ghost.id);
    } else {
      const liveDuplicate = existing.find(p => p.connected && p.codename.toLowerCase() === codename.toLowerCase());
      if (liveDuplicate) return { ok: false, error: 'Codename already in use' };
    }

    const team = room.addPlayer(socketId, codename);
    if (team === null) return { ok: false, error: 'Room is full' };
    this.socketToRoom.set(socketId, code);
    const reconnectToken = this.issueToken(socketId);
    return { ok: true, roomCode: code, team, reconnectToken };
  }

  /**
   * Try to attach `socketId` to the player slot previously identified by
   * `reconnectToken`. Returns the room/team on success.
   */
  reconnect(reconnectToken: string, newSocketId: string, roomCode: string): ReconnectResult {
    const oldSocketId = this.tokenToSocket.get(reconnectToken);
    if (!oldSocketId) return { ok: false, error: 'Unknown reconnect token' };

    const code = roomCode.toUpperCase();
    const storedCode = this.socketToRoom.get(oldSocketId);
    if (storedCode !== code) return { ok: false, error: 'Room mismatch' };

    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'Room no longer exists' };

    if (oldSocketId !== newSocketId) {
      const team = room.rekeyPlayer(oldSocketId, newSocketId);
      if (team === null) return { ok: false, error: 'Player slot not found' };
      this.socketToRoom.delete(oldSocketId);
      this.socketToRoom.set(newSocketId, code);
      this.tokenToSocket.set(reconnectToken, newSocketId);
      return { ok: true, roomCode: code, team };
    }

    room.setPlayerConnected(newSocketId, true);
    const slot = room.getPlayerById(newSocketId);
    if (!slot) return { ok: false, error: 'Player slot not found' };
    return { ok: true, roomCode: code, team: slot.team };
  }

  /** Mark a player offline; keep the slot for grace-period reconnect. */
  handleDisconnect(socketId: string): { roomCode: string; team: TeamId } | null {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;
    const room = this.rooms.get(code);
    if (!room) return null;
    const slot = room.getPlayerById(socketId);
    if (!slot) return null;
    room.setPlayerConnected(socketId, false);
    return { roomCode: code, team: slot.team };
  }

  /** Explicit leave — removes the slot immediately. */
  leaveRoom(socketId: string): { roomCode: string; team: TeamId } | null {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;
    const room = this.rooms.get(code);
    if (!room) return null;
    const team = room.removePlayer(socketId);
    this.socketToRoom.delete(socketId);
    this.clearTokenForSocket(socketId);
    if (!room.hasPlayers()) {
      this.destroyRoom(code);
    }
    return team !== null ? { roomCode: code, team } : null;
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getRoomForSocket(socketId: string): GameRoom | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  /** Sweep inactive rooms. Public so tests can drive it deterministically. */
  sweep(): string[] {
    const destroyed: string[] = [];
    const now = this.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity > ROOM_INACTIVITY_TIMEOUT) {
        this.destroyRoom(code);
        destroyed.push(code);
      }
    }
    return destroyed;
  }

  destroy(): void {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
    for (const code of [...this.rooms.keys()]) {
      this.destroyRoom(code);
    }
  }

  /** Visible for tests. */
  roomCount(): number {
    return this.rooms.size;
  }

  private destroyRoom(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    this.callbacks.broadcastToRoom(code, 'room:closed', { message: 'Room closed' });
    this.rooms.delete(code);
    for (const [socketId, rc] of this.socketToRoom) {
      if (rc === code) {
        this.socketToRoom.delete(socketId);
        this.clearTokenForSocket(socketId);
      }
    }
  }

  private clearTokenForSocket(socketId: string): void {
    for (const [token, sid] of this.tokenToSocket) {
      if (sid === socketId) this.tokenToSocket.delete(token);
    }
  }

  private issueToken(socketId: string): string {
    const token = randomUUID();
    this.tokenToSocket.set(token, socketId);
    return token;
  }

  private bindCallbacks(roomCode: string) {
    return {
      broadcastToRoom: (event: string, payload: unknown) =>
        this.callbacks.broadcastToRoom(roomCode, event, payload),
      emitToPlayer: this.callbacks.emitToPlayer,
    };
  }

  private generateRoomCode(): string {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }
}
