import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  GameResult,
  GuessOutcome,
  JoinResult,
  PlayerView,
  RoomState,
  ServerToClientEvents,
  TeamId,
} from '@saw/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const RECONNECT_KEY = 'saw:reconnectToken';
const ROOM_KEY = 'saw:roomCode';
const CODENAME_KEY = 'saw:codename';

function persisted(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setPersisted(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

const socket: TypedSocket = io(
  import.meta.env.PROD ? window.location.origin : 'http://localhost:3001',
  {
    autoConnect: false,
    transports: ['websocket', 'polling'],
  },
);

export interface UseGameOptions {
  /** Called when the room is closed by the server (timeout, partner left, etc). */
  onRoomClosed?: (msg: string) => void;
}

export interface UseGameValue {
  connected: boolean;
  view: PlayerView | null;
  room: RoomState | null;
  team: TeamId | null;
  codename: string | null;
  lastGuess: (GuessOutcome & { guesserTeam: TeamId }) | null;
  result: GameResult | null;
  createRoom: (codename: string) => Promise<JoinResult>;
  joinRoom: (roomCode: string, codename: string) => Promise<JoinResult>;
  reconnectIfStored: (roomCode: string) => Promise<JoinResult | null>;
  giveClue: (word: string, count: number) => Promise<{ success: boolean; error?: string }>;
  guess: (word: string) => Promise<{ success: boolean; outcome?: GuessOutcome; error?: string }>;
  endTurn: () => void;
  newGame: () => void;
  leaveRoom: () => void;
}

export function useGame(opts: UseGameOptions = {}): UseGameValue {
  const [connected, setConnected] = useState(socket.connected);
  const [view, setView] = useState<PlayerView | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [team, setTeam] = useState<TeamId | null>(null);
  const [codename, setCodename] = useState<string | null>(persisted(CODENAME_KEY));
  const [lastGuess, setLastGuess] = useState<(GuessOutcome & { guesserTeam: TeamId }) | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const onRoomClosedRef = useRef(opts.onRoomClosed);
  onRoomClosedRef.current = opts.onRoomClosed;

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onView = (next: PlayerView) => {
      setView(next);
      setResult(next.result);
    };
    const onRoomState = (next: RoomState) => setRoom(next);
    const onGuess = (g: GuessOutcome & { guesserTeam: TeamId }) => setLastGuess(g);
    const onOver = (data: { result: GameResult }) => setResult(data.result);
    const onClosed = (data: { message: string }) => {
      setView(null);
      setRoom(null);
      setTeam(null);
      setLastGuess(null);
      setResult(null);
      setPersisted(RECONNECT_KEY, null);
      setPersisted(ROOM_KEY, null);
      onRoomClosedRef.current?.(data.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game:view', onView);
    socket.on('room:state', onRoomState);
    socket.on('game:guess', onGuess);
    socket.on('game:over', onOver);
    socket.on('room:closed', onClosed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game:view', onView);
      socket.off('room:state', onRoomState);
      socket.off('game:guess', onGuess);
      socket.off('game:over', onOver);
      socket.off('room:closed', onClosed);
    };
  }, []);

  const applyJoinResult = useCallback((res: JoinResult, name: string) => {
    if (!res.success) return;
    setTeam(res.team);
    setView(res.view);
    setRoom(res.room);
    setResult(res.view.result);
    setCodename(name);
    setPersisted(RECONNECT_KEY, res.reconnectToken);
    setPersisted(ROOM_KEY, res.roomCode);
    setPersisted(CODENAME_KEY, name);
  }, []);

  const createRoom = useCallback(
    (name: string) =>
      new Promise<JoinResult>(resolve => {
        socket.emit('room:create', { codename: name }, res => {
          applyJoinResult(res, name);
          resolve(res);
        });
      }),
    [applyJoinResult],
  );

  const joinRoom = useCallback(
    (roomCode: string, name: string) =>
      new Promise<JoinResult>(resolve => {
        socket.emit('room:join', { roomCode, codename: name }, res => {
          applyJoinResult(res, name);
          resolve(res);
        });
      }),
    [applyJoinResult],
  );

  const reconnectIfStored = useCallback(
    (roomCode: string) => {
      const token = persisted(RECONNECT_KEY);
      const name = persisted(CODENAME_KEY);
      if (!token || !name) return Promise.resolve(null);
      return new Promise<JoinResult>(resolve => {
        socket.emit(
          'room:join',
          { roomCode, codename: name, reconnectToken: token },
          res => {
            applyJoinResult(res, name);
            resolve(res);
          },
        );
      });
    },
    [applyJoinResult],
  );

  const giveClue = useCallback(
    (word: string, count: number) =>
      new Promise<{ success: boolean; error?: string }>(resolve => {
        socket.emit('game:giveClue', { word, count }, resolve);
      }),
    [],
  );

  const guess = useCallback(
    (word: string) =>
      new Promise<{ success: boolean; outcome?: GuessOutcome; error?: string }>(resolve => {
        socket.emit('game:guess', { word }, resolve);
      }),
    [],
  );

  const endTurn = useCallback(() => socket.emit('game:endTurn'), []);
  const newGame = useCallback(() => {
    socket.emit('game:newGame');
    setLastGuess(null);
    setResult(null);
  }, []);
  const leaveRoom = useCallback(() => {
    socket.emit('room:leave');
    setView(null);
    setRoom(null);
    setTeam(null);
    setLastGuess(null);
    setResult(null);
    setPersisted(RECONNECT_KEY, null);
    setPersisted(ROOM_KEY, null);
  }, []);

  return {
    connected,
    view,
    room,
    team,
    codename,
    lastGuess,
    result,
    createRoom,
    joinRoom,
    reconnectIfStored,
    giveClue,
    guess,
    endTurn,
    newGame,
    leaveRoom,
  };
}

export { socket };
