import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Board from '../components/Board.tsx';
import ClueBar from '../components/ClueBar.tsx';
import ClueComposer from '../components/ClueComposer.tsx';
import CopyCode from '../components/CopyCode.tsx';
import EndTurnButton from '../components/EndTurnButton.tsx';
import GameOver from '../components/GameOver.tsx';
import InfoBar from '../components/InfoBar.tsx';
import TeamPanel from '../components/TeamPanel.tsx';
import { useGame } from '../lib/socket.ts';

export default function Room() {
  const { roomCode = '' } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const {
    connected,
    view,
    room,
    team,
    result,
    reconnectIfStored,
    giveClue,
    guess,
    endTurn,
    newGame,
    leaveRoom,
  } = useGame({
    onRoomClosed: msg => setClosedReason(msg),
  });

  // On hard reload, attempt reconnect using the stored token. If we have no
  // token (or it's stale), bounce back to home where the user can rejoin.
  useEffect(() => {
    if (view || !connected) return;
    let cancelled = false;
    (async () => {
      const res = await reconnectIfStored(roomCode);
      if (cancelled) return;
      if (!res || !res.success) {
        navigate('/', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, view, roomCode, reconnectIfStored, navigate]);

  if (closedReason) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="case-file rounded-sm px-6 py-8 max-w-md w-full text-center">
          <div className="stamp-red text-2xl mb-3">Room Closed</div>
          <p className="font-typewriter text-ink-fade text-sm mb-6">{closedReason}</p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="font-stencil text-base tracking-[0.18em] uppercase text-ink hover:text-stamp-red"
          >
            Return to Briefing &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (!view || !room || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="font-typewriter text-ink-fade tracking-[0.3em] uppercase text-sm animate-pulse">
          Establishing secure channel…
        </div>
      </div>
    );
  }

  // Whose turn it is to GUESS:
  //   if a clue is active, the team that didn't give it is guessing.
  //   if no clue, neither team is guessing yet.
  const guesserTeam = view.currentClue ? (view.currentClue.fromTeam === 1 ? 2 : 1) : null;
  const canGuess = guesserTeam === team && result === null;
  const canClue = view.currentClue === null && result === null;
  const isPartnerOffline = !!room.players.find(p => p.team !== team && !p.connected);
  const isWaitingForPartner = room.players.length < 2;

  const handleLeave = () => {
    leaveRoom();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-paper-cream/95 backdrop-blur-sm border-b border-paper-edge px-3 py-2">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <InfoBar view={view} roomCode={roomCode} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TeamPanel players={room.players} myTeam={team} />
            <ClueBar view={view} myTeam={team} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-3 py-4">
        {isWaitingForPartner && (
          <div className="max-w-3xl mx-auto mb-4 case-file rounded-sm px-4 py-3 flex items-center justify-center gap-3 text-ink-fade text-xs uppercase tracking-[0.3em]">
            <span>Awaiting second operative · share</span>
            <CopyCode
              code={roomCode}
              payload={`${window.location.origin}/room/${roomCode}`}
              codeClassName="text-xl"
            />
          </div>
        )}

        {isPartnerOffline && !isWaitingForPartner && (
          <div className="max-w-3xl mx-auto mb-4 case-file rounded-sm px-4 py-2 text-center text-stamp-red text-xs uppercase tracking-[0.3em]">
            Partner offline — awaiting reconnect
          </div>
        )}

        <Board view={view} canGuess={canGuess} onGuess={w => guess(w)} />
      </main>

      <footer className="sticky bottom-0 bg-paper-cream/95 backdrop-blur-sm border-t border-paper-edge px-3 py-3">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {canClue ? (
            <div className="flex-1">
              <ClueComposer
                onSubmit={(word, count) => giveClue(word, count)}
                disabled={isWaitingForPartner}
                agentsLeft={Math.max(view.agentsLeftTeam1, view.agentsLeftTeam2)}
              />
            </div>
          ) : (
            <div className="flex-1 case-file rounded-sm px-4 py-3 text-center text-ink-fade text-xs uppercase tracking-[0.3em]">
              {canGuess ? 'Awaiting your guess on the board above.' : 'Partner is guessing…'}
            </div>
          )}

          {canGuess && (
            <EndTurnButton onClick={endTurn} />
          )}

          <button
            type="button"
            onClick={handleLeave}
            className="font-stencil text-sm tracking-[0.18em] uppercase text-ink-fade hover:text-stamp-red"
          >
            Leave
          </button>
        </div>
      </footer>

      {result && <GameOver result={result} onNewGame={newGame} onLeave={handleLeave} />}
    </div>
  );
}
