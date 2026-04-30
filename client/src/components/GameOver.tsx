import type { GameResult } from '@saw/shared';

interface Props {
  result: GameResult;
  onNewGame: () => void;
  onLeave: () => void;
}

const headline: Record<GameResult, string> = {
  win: 'Mission Accomplished',
  'loss-assassin': 'Operative Down',
  'loss-turns': 'Operation Timed Out',
};

const tone: Record<GameResult, string> = {
  win: 'text-stamp-green',
  'loss-assassin': 'text-stamp-red',
  'loss-turns': 'text-ink-fade',
};

const subhead: Record<GameResult, string> = {
  win: 'All agents extracted. Both grids cleared.',
  'loss-assassin': 'Compromised target identified.',
  'loss-turns': 'Window closed. No further transmissions possible.',
};

export default function GameOver({ result, onNewGame, onLeave }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper-cream/90 paper-grain animate-fade-in-slow">
      <div className="case-file rounded-sm px-8 py-10 max-w-md w-[90%] text-center animate-folder-slide">
        <div className="text-[10px] uppercase tracking-[0.4em] text-ink-fade mb-4">
          Mission Report
        </div>
        <div className={`stamp text-3xl sm:text-4xl mb-3 ${tone[result]}`}>
          {headline[result]}
        </div>
        <p className="font-typewriter text-ink-fade text-sm mb-8">
          {subhead[result]}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onNewGame}
            className="font-stencil text-lg tracking-[0.18em] uppercase text-ink hover:text-stamp-red"
          >
            New Mission
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="font-stencil text-sm tracking-[0.18em] uppercase text-ink-fade hover:text-ink"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
