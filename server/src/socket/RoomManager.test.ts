import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROOM_INACTIVITY_TIMEOUT } from '@saw/shared';
import { RoomManager } from './RoomManager.js';

function makeCallbacks() {
  return {
    broadcastToRoom: vi.fn(),
    emitToPlayer: vi.fn(),
  };
}

let now = 1_000_000;

beforeEach(() => {
  now = 1_000_000;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RoomManager.createRoom', () => {
  it('creates a room and assigns the creator to team 1', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const result = manager.createRoom('socket-A', 'Alice');
    expect(result.team).toBe(1);
    expect(result.roomCode).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.reconnectToken).toBeTruthy();
    manager.destroy();
  });

  it('produces distinct room codes across many creates', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(manager.createRoom(`socket-${i}`, `Op-${i}`).roomCode);
    }
    expect(codes.size).toBe(50);
    manager.destroy();
  });
});

describe('RoomManager.joinRoom', () => {
  it('assigns the second player to team 2', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    const join = manager.joinRoom('socket-B', create.roomCode, 'Bob');
    expect(join).toEqual(expect.objectContaining({ ok: true, team: 2 }));
    manager.destroy();
  });

  it('rejects a third joiner', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    manager.joinRoom('socket-B', create.roomCode, 'Bob');
    const third = manager.joinRoom('socket-C', create.roomCode, 'Charlie');
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.error).toMatch(/full/i);
    manager.destroy();
  });

  it('rejects duplicate live codenames', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    const dup = manager.joinRoom('socket-B', create.roomCode, 'alice');
    expect(dup.ok).toBe(false);
    manager.destroy();
  });

  it('evicts a ghost player who shares the new joiner\'s codename', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    manager.handleDisconnect('socket-A'); // Alice goes offline
    const rejoin = manager.joinRoom('socket-A2', create.roomCode, 'Alice');
    expect(rejoin.ok).toBe(true);
    if (rejoin.ok) {
      // Alice took over slot 1 (ghost evicted; new player took the open seat).
      expect(rejoin.team).toBe(1);
    }
    manager.destroy();
  });

  it('rejects unknown room codes', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const join = manager.joinRoom('socket-X', 'ZZZZ', 'Eve');
    expect(join.ok).toBe(false);
    manager.destroy();
  });
});

describe('RoomManager.reconnect', () => {
  it('rekeys an existing player on reconnect with a valid token', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    manager.handleDisconnect('socket-A');

    const result = manager.reconnect(create.reconnectToken, 'socket-A2', create.roomCode);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.team).toBe(1);
      const room = manager.getRoom(create.roomCode);
      expect(room?.getPlayerById('socket-A2')?.connected).toBe(true);
      expect(room?.getPlayerById('socket-A')).toBeUndefined();
    }
    manager.destroy();
  });

  it('rejects unknown reconnect tokens', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    const result = manager.reconnect('not-a-real-token', 'socket-X', create.roomCode);
    expect(result.ok).toBe(false);
    manager.destroy();
  });

  it('rejects reconnect when room code does not match', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    const result = manager.reconnect(create.reconnectToken, 'socket-A2', 'WRONG');
    expect(result.ok).toBe(false);
    manager.destroy();
  });
});

describe('RoomManager.handleDisconnect', () => {
  it('marks the player offline but keeps the slot', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    manager.handleDisconnect('socket-A');
    const room = manager.getRoom(create.roomCode);
    expect(room?.getPlayerById('socket-A')?.connected).toBe(false);
    expect(room?.hasPlayers()).toBe(true);
    manager.destroy();
  });
});

describe('RoomManager.leaveRoom', () => {
  it('destroys the room when the last player leaves', () => {
    const cb = makeCallbacks();
    const manager = new RoomManager(cb, { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    manager.leaveRoom('socket-A');
    expect(manager.getRoom(create.roomCode)).toBeUndefined();
    expect(cb.broadcastToRoom).toHaveBeenCalledWith(create.roomCode, 'room:closed', expect.anything());
    manager.destroy();
  });

  it('keeps the room alive when a partner remains', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false });
    const create = manager.createRoom('socket-A', 'Alice');
    manager.joinRoom('socket-B', create.roomCode, 'Bob');
    manager.leaveRoom('socket-A');
    expect(manager.getRoom(create.roomCode)).toBeDefined();
    manager.destroy();
  });
});

describe('RoomManager.sweep', () => {
  it('destroys rooms whose lastActivity exceeds the inactivity timeout', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false, now: () => now });
    const create = manager.createRoom('socket-A', 'Alice');
    expect(manager.roomCount()).toBe(1);

    now += ROOM_INACTIVITY_TIMEOUT + 1;
    const destroyed = manager.sweep();
    expect(destroyed).toContain(create.roomCode);
    expect(manager.roomCount()).toBe(0);
    manager.destroy();
  });

  it('does not destroy active rooms', () => {
    const manager = new RoomManager(makeCallbacks(), { autoSweep: false, now: () => now });
    manager.createRoom('socket-A', 'Alice');
    now += 1_000;
    expect(manager.sweep()).toHaveLength(0);
    expect(manager.roomCount()).toBe(1);
    manager.destroy();
  });
});
