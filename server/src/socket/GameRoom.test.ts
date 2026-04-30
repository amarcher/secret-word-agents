import { describe, expect, it, vi } from 'vitest';
import { GameRoom } from './GameRoom.js';

function makeCallbacks() {
  return {
    broadcastToRoom: vi.fn(),
    emitToPlayer: vi.fn(),
  };
}

describe('GameRoom slot assignment', () => {
  it('fills team 1 then team 2', () => {
    const room = new GameRoom('AAAA', makeCallbacks());
    expect(room.addPlayer('s1', 'Alice')).toBe(1);
    expect(room.addPlayer('s2', 'Bob')).toBe(2);
    expect(room.addPlayer('s3', 'Charlie')).toBeNull();
  });

  it('frees a slot on remove and refills it on next add', () => {
    const room = new GameRoom('AAAA', makeCallbacks());
    room.addPlayer('s1', 'Alice');
    room.addPlayer('s2', 'Bob');
    expect(room.removePlayer('s1')).toBe(1);
    expect(room.addPlayer('s3', 'Charlie')).toBe(1);
  });
});

describe('GameRoom.applyClue', () => {
  it('broadcasts game:clue and emits per-player views', () => {
    const cb = makeCallbacks();
    const room = new GameRoom('AAAA', cb);
    room.addPlayer('s1', 'Alice');
    room.addPlayer('s2', 'Bob');

    cb.broadcastToRoom.mockClear();
    cb.emitToPlayer.mockClear();

    expect(room.applyClue('s1', 'OBSERVE', 2)).toBe(true);

    expect(cb.broadcastToRoom).toHaveBeenCalledWith(
      'game:clue',
      expect.objectContaining({ fromTeam: 1, word: 'OBSERVE', count: 2 }),
    );
    // Per-player view emitted to both connected sockets.
    const viewCalls = cb.emitToPlayer.mock.calls.filter(([, ev]) => ev === 'game:view');
    expect(viewCalls).toHaveLength(2);
    const recipients = viewCalls.map(([id]) => id).sort();
    expect(recipients).toEqual(['s1', 's2']);
  });

  it('rejects clue from an unknown socket', () => {
    const room = new GameRoom('AAAA', makeCallbacks());
    expect(room.applyClue('ghost', 'X', 1)).toBe(false);
  });
});

describe('GameRoom.applyGuess', () => {
  it('broadcasts game:guess including guesserTeam, plus updated views', () => {
    const cb = makeCallbacks();
    const room = new GameRoom('AAAA', cb);
    room.addPlayer('s1', 'Alice');
    room.addPlayer('s2', 'Bob');
    room.applyClue('s1', 'WORD', 1);

    cb.broadcastToRoom.mockClear();
    cb.emitToPlayer.mockClear();

    // Pick any word from the generated board and have team 2 guess it.
    const view = room.getViewForTeam(1);
    const word = Object.keys(view.words)[0]!;
    const outcome = room.applyGuess('s2', word);
    expect(outcome).not.toBeNull();

    const guessCall = cb.broadcastToRoom.mock.calls.find(([ev]) => ev === 'game:guess');
    expect(guessCall).toBeDefined();
    expect(guessCall![1]).toEqual(expect.objectContaining({ guesserTeam: 2, word }));
  });

  it('returns null and skips broadcasts when the word is unknown', () => {
    const cb = makeCallbacks();
    const room = new GameRoom('AAAA', cb);
    room.addPlayer('s1', 'Alice');
    room.addPlayer('s2', 'Bob');
    room.applyClue('s1', 'WORD', 1);

    cb.broadcastToRoom.mockClear();
    expect(room.applyGuess('s2', 'NOT_ON_BOARD')).toBeNull();
    expect(cb.broadcastToRoom).not.toHaveBeenCalled();
  });
});

describe('GameRoom presence', () => {
  it('reports connected status in room state', () => {
    const room = new GameRoom('AAAA', makeCallbacks());
    room.addPlayer('s1', 'Alice');
    room.addPlayer('s2', 'Bob');
    expect(room.hasConnectedPlayers()).toBe(true);

    room.setPlayerConnected('s1', false);
    const state = room.getRoomState();
    expect(state.players.find(p => p.id === 's1')?.connected).toBe(false);
    expect(room.hasConnectedPlayers()).toBe(true);

    room.setPlayerConnected('s2', false);
    expect(room.hasConnectedPlayers()).toBe(false);
  });

  it('rekeys a slot on reconnect', () => {
    const room = new GameRoom('AAAA', makeCallbacks());
    room.addPlayer('s1', 'Alice');
    expect(room.rekeyPlayer('s1', 's1-new')).toBe(1);
    expect(room.getPlayerById('s1-new')?.team).toBe(1);
    expect(room.getPlayerById('s1')).toBeUndefined();
  });
});
