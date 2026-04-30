import type { GameResult, GuessOutcome, PlayerView, TeamId } from './game/types.js';

export interface RoomPlayer {
  id: string;
  codename: string;
  team: TeamId;
  connected: boolean;
}

export interface RoomState {
  roomCode: string;
  players: RoomPlayer[];
}

export interface JoinSuccess {
  success: true;
  roomCode: string;
  reconnectToken: string;
  team: TeamId;
  view: PlayerView;
  room: RoomState;
}

export interface JoinFailure {
  success: false;
  error: string;
}

export type JoinResult = JoinSuccess | JoinFailure;

export interface ClientToServerEvents {
  'room:create': (
    data: { codename: string },
    callback: (res: JoinResult) => void,
  ) => void;
  'room:join': (
    data: { roomCode: string; codename: string; reconnectToken?: string },
    callback: (res: JoinResult) => void,
  ) => void;
  'room:leave': () => void;

  'game:guess': (
    data: { word: string },
    callback: (res: { success: boolean; outcome?: GuessOutcome; error?: string }) => void,
  ) => void;
  'game:giveClue': (
    data: { word: string; count: number },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'game:endTurn': () => void;
  'game:newGame': () => void;
}

export interface ServerToClientEvents {
  /** Per-player view; emitted to a single socket. */
  'game:view': (view: PlayerView) => void;
  /** Room presence + team assignments; broadcast to room. */
  'room:state': (state: RoomState) => void;
  /** A guess landed. Both clients receive this. */
  'game:guess': (outcome: GuessOutcome & { guesserTeam: TeamId }) => void;
  /** A clue was given. */
  'game:clue': (data: { fromTeam: TeamId; word: string; count: number }) => void;
  /** Turn ended (manual or auto). */
  'game:turn': (data: { turnsLeft: number }) => void;
  /** Game over. */
  'game:over': (data: { result: GameResult }) => void;
  /** Generic error broadcast (e.g. partner left). */
  'room:error': (data: { message: string }) => void;
  /** Room was closed by the server. */
  'room:closed': (data: { message: string }) => void;
}

export interface InterServerEvents {
  // unused for now
  _unused?: never;
}

export interface SocketData {
  playerId: string;
  codename: string;
  roomCode: string;
  team: TeamId;
  reconnectToken: string;
}
