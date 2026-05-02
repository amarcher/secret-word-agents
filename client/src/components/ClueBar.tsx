import type { PlayerView, TeamId } from '@saw/shared';

interface Props {
  view: PlayerView;
  myTeam: TeamId;
}

export default function ClueBar({ view, myTeam }: Props) {
  const clue = view.currentClue;

  if (!clue) {
    return (
      <div className="case-file rounded-sm px-3 py-1.5 sm:px-4 sm:py-2 text-ink-fade text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-center">
        Awaiting transmission…
      </div>
    );
  }

  const fromMe = clue.fromTeam === myTeam;
  // Re-key on the word so the typewriter animation re-fires whenever the clue
  // changes — including subsequent clues in the same game.
  const animKey = `${clue.fromTeam}:${clue.word}`;

  return (
    <div className="case-file rounded-sm px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-ink-fade shrink-0">
        {fromMe ? 'You sent' : 'Intercept'}
      </div>
      <div className="flex items-baseline gap-2 sm:gap-3 flex-1 justify-center min-w-0">
        <span
          key={animKey}
          className="font-stencil text-xl sm:text-2xl md:text-3xl tracking-[0.18em] uppercase text-ink truncate animate-typewriter-in"
        >
          {clue.word || '—'}
        </span>
        <span className="font-stencil text-lg sm:text-xl text-stamp-red tracking-[0.18em] tabular-nums">
          {clue.guessesLeft}
        </span>
      </div>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-ink-fade shrink-0">
        guesses
      </div>
    </div>
  );
}
