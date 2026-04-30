import type { PlayerView, TeamId } from '@saw/shared';

interface Props {
  view: PlayerView;
  myTeam: TeamId;
}

export default function ClueBar({ view, myTeam }: Props) {
  const clue = view.currentClue;

  if (!clue) {
    return (
      <div className="case-file rounded-sm px-4 py-2 text-ink-fade text-xs uppercase tracking-[0.3em] text-center">
        Awaiting transmission…
      </div>
    );
  }

  const fromMe = clue.fromTeam === myTeam;
  return (
    <div className="case-file rounded-sm px-4 py-3 flex items-center justify-between gap-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-ink-fade">
        {fromMe ? 'You transmitted' : 'Intercept'}
      </div>
      <div className="flex items-baseline gap-3 flex-1 justify-center">
        <span className="font-stencil text-2xl sm:text-3xl tracking-[0.18em] uppercase text-ink">
          {clue.word || '—'}
        </span>
        <span className="font-stencil text-xl text-stamp-red tracking-[0.18em]">
          {clue.guessesLeft}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-ink-fade">
        guesses
      </div>
    </div>
  );
}
