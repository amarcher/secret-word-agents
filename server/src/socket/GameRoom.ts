import {
  Game,
  type GuessOutcome,
  type PlayerView,
  type RoomPlayer,
  type RoomState,
  type TeamId,
} from '@saw/shared';
import type { PushHub } from '../push/PushHub.js';

export interface GameRoomCallbacks {
  /** Emit an event to every socket in this room. */
  broadcastToRoom: (event: string, payload: unknown) => void;
  /** Emit an event to a single socket id. */
  emitToPlayer: (playerId: string, event: string, payload: unknown) => void;
}

interface PlayerSlot {
  id: string;
  codename: string;
  team: TeamId;
  connected: boolean;
  /** Reconnect token — also doubles as the push subscription key. */
  reconnectToken: string;
}

export class GameRoom {
  readonly roomCode: string;
  private game: Game;
  private slots: Map<TeamId, PlayerSlot> = new Map();
  private callbacks: GameRoomCallbacks;
  private now: () => number;
  private pushHub?: PushHub;
  lastActivity: number;

  constructor(
    roomCode: string,
    callbacks: GameRoomCallbacks,
    now: () => number = Date.now,
    pushHub?: PushHub,
  ) {
    this.roomCode = roomCode;
    this.callbacks = callbacks;
    this.now = now;
    this.pushHub = pushHub;
    this.game = new Game();
    this.lastActivity = now();
  }

  /** Returns the assigned team, or null if both slots are full. */
  addPlayer(id: string, codename: string, reconnectToken = ''): TeamId | null {
    if (!this.slots.has(1)) {
      this.slots.set(1, { id, codename, team: 1, connected: true, reconnectToken });
      this.touch();
      return 1;
    }
    if (!this.slots.has(2)) {
      this.slots.set(2, { id, codename, team: 2, connected: true, reconnectToken });
      this.touch();
      return 2;
    }
    return null;
  }

  /** Update the reconnect token for an existing slot (used after reconnect rekey). */
  setSlotToken(socketId: string, reconnectToken: string): void {
    for (const slot of this.slots.values()) {
      if (slot.id === socketId) {
        slot.reconnectToken = reconnectToken;
        return;
      }
    }
  }

  /** Move a player slot from old socket id → new socket id (reconnect). */
  rekeyPlayer(oldId: string, newId: string): TeamId | null {
    for (const [team, slot] of this.slots) {
      if (slot.id === oldId) {
        slot.id = newId;
        slot.connected = true;
        this.touch();
        return team;
      }
    }
    return null;
  }

  removePlayer(id: string): TeamId | null {
    for (const [team, slot] of this.slots) {
      if (slot.id === id) {
        this.slots.delete(team);
        this.touch();
        return team;
      }
    }
    return null;
  }

  setPlayerConnected(id: string, connected: boolean): void {
    for (const slot of this.slots.values()) {
      if (slot.id === id) {
        slot.connected = connected;
        this.touch();
        return;
      }
    }
  }

  getPlayerById(id: string): PlayerSlot | undefined {
    for (const slot of this.slots.values()) {
      if (slot.id === id) return slot;
    }
    return undefined;
  }

  getPlayerByTeam(team: TeamId): PlayerSlot | undefined {
    return this.slots.get(team);
  }

  hasPlayers(): boolean {
    return this.slots.size > 0;
  }

  hasConnectedPlayers(): boolean {
    for (const slot of this.slots.values()) {
      if (slot.connected) return true;
    }
    return false;
  }

  getRoomState(): RoomState {
    const players: RoomPlayer[] = [];
    for (const slot of this.slots.values()) {
      players.push({ id: slot.id, codename: slot.codename, team: slot.team, connected: slot.connected });
    }
    return { roomCode: this.roomCode, players };
  }

  getViewForTeam(team: TeamId): PlayerView {
    return this.game.getViewForPlayer(team);
  }

  /** Fan out the per-player view + room state to every connected socket. */
  emitFullState(): void {
    for (const slot of this.slots.values()) {
      if (!slot.connected) continue;
      this.callbacks.emitToPlayer(slot.id, 'game:view', this.getViewForTeam(slot.team));
    }
    this.callbacks.broadcastToRoom('room:state', this.getRoomState());
  }

  applyGuess(playerId: string, word: string): GuessOutcome | null {
    const slot = this.getPlayerById(playerId);
    if (!slot) return null;
    const outcome = this.game.guess(word, slot.team);
    if (!outcome) return null;
    this.touch();
    this.callbacks.broadcastToRoom('game:guess', { ...outcome, guesserTeam: slot.team });
    if (outcome.turnEnded) {
      this.callbacks.broadcastToRoom('game:turn', { turnsLeft: outcome.turnsLeft });
    }
    if (outcome.result) {
      this.callbacks.broadcastToRoom('game:over', { result: outcome.result });
    }
    this.emitFullState();
    void this.pushPartner(slot.team, {
      type: 'guess',
      title: `${slot.codename} guessed "${word}"`,
      body:
        outcome.role === 'AGENT'
          ? '✓ Agent — keep going.'
          : outcome.role === 'NON_AGENT'
            ? 'Bystander. Turn ended.'
            : 'Assassin. Mission failed.',
      roomCode: this.roomCode,
    });
    if (outcome.result) {
      void this.pushPartner(slot.team, {
        type: 'over',
        title:
          outcome.result === 'win'
            ? 'Mission accomplished'
            : outcome.result === 'loss-assassin'
              ? 'Operative down'
              : 'Operation timed out',
        body: 'Open the dossier to review the report.',
        roomCode: this.roomCode,
      });
    }
    return outcome;
  }

  applyClue(playerId: string, word: string, count: number): boolean {
    const slot = this.getPlayerById(playerId);
    if (!slot) return false;
    this.game.giveClue(slot.team, word, count);
    this.touch();
    this.callbacks.broadcastToRoom('game:clue', { fromTeam: slot.team, word, count });
    this.emitFullState();
    void this.pushPartner(slot.team, {
      type: 'clue',
      title: `${slot.codename} sent a clue`,
      body: `“${word.toUpperCase()}” · ${count} ${count === 1 ? 'guess' : 'guesses'}`,
      roomCode: this.roomCode,
    });
    return true;
  }

  /** Send a push to the team OPPOSITE to `fromTeam`. No-ops if no sub. */
  private async pushPartner(fromTeam: TeamId, payload: object): Promise<void> {
    if (!this.pushHub) return;
    const partnerTeam: TeamId = fromTeam === 1 ? 2 : 1;
    const partner = this.slots.get(partnerTeam);
    if (!partner || !partner.reconnectToken) return;
    // Skip the push when the partner is online — they already see the in-app
    // event over the socket. Pushes are purely for backgrounded tabs.
    if (partner.connected) return;
    await this.pushHub.send(partner.reconnectToken, payload);
  }

  applyEndTurn(playerId: string): void {
    const slot = this.getPlayerById(playerId);
    if (!slot) return;
    this.game.endTurn();
    this.touch();
    this.callbacks.broadcastToRoom('game:turn', { turnsLeft: this.game.getTurnsLeft() });
    this.emitFullState();
  }

  newGame(): void {
    this.game = new Game();
    this.touch();
    this.emitFullState();
  }

  private touch(): void {
    this.lastActivity = this.now();
  }
}
