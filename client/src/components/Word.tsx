import { useMemo } from 'react';
import type { Role, WordView } from '@saw/shared';

interface Props {
  word: string;
  view: WordView;
  canGuess: boolean;
  onClick?: () => void;
}

function rotationFor(word: string): number {
  // Deterministic small rotation per word, range [-0.7°, +0.7°].
  let h = 0;
  for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) | 0;
  const norm = ((h % 1000) + 1000) % 1000;
  return (norm / 1000) * 1.4 - 0.7;
}

function primaryReveal(view: WordView): Role | null {
  // ASSASSIN > AGENT > NON_AGENT in display priority.
  for (const role of ['ASSASSIN', 'AGENT', 'NON_AGENT'] as const) {
    if (view.revealedOnMine === role) return role;
    if (view.revealedOnTheirs === role) return role;
  }
  return null;
}

const stampLabel: Record<Role, string> = {
  AGENT: 'AGENT',
  NON_AGENT: 'BYSTANDER',
  ASSASSIN: 'ELIMINATED',
};

const stampColor: Record<Role, string> = {
  AGENT: 'text-stamp-blue',
  NON_AGENT: 'text-ink-fade',
  ASSASSIN: 'text-stamp-red',
};

const myMarker: Record<Role, { glyph: string; cls: string }> = {
  AGENT: { glyph: '●', cls: 'text-stamp-blue' },
  NON_AGENT: { glyph: '○', cls: 'text-ink-fade' },
  ASSASSIN: { glyph: '✕', cls: 'text-stamp-red' },
};

export default function Word({ word, view, canGuess, onClick }: Props) {
  const rotation = useMemo(() => rotationFor(word), [word]);
  const reveal = primaryReveal(view);
  const isClickable = canGuess && view.revealedOnTheirs === null && !reveal;
  const marker = myMarker[view.myRole];

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={[
        'case-file relative w-full min-w-0 aspect-[5/3] rounded-[2px] overflow-hidden',
        'px-1 py-1.5 sm:px-2 sm:py-3',
        'flex items-center justify-center text-center',
        'transition-transform duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp-red focus-visible:ring-offset-1 focus-visible:ring-offset-paper-cream',
        isClickable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default',
        reveal ? 'opacity-95' : '',
      ].join(' ')}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={`${word}${reveal ? `, revealed as ${stampLabel[reveal]}` : ''}`}
    >
      {/* My role indicator — small corner marker (the dossier annotation). */}
      <span
        className={`absolute top-0.5 left-1 sm:top-1 sm:left-1.5 text-[9px] sm:text-[10px] font-mono leading-none ${marker.cls}`}
        aria-hidden
      >
        {marker.glyph}
      </span>

      <span
        className={[
          'font-typewriter text-ink uppercase select-none leading-tight',
          'text-[10px] xs:text-[11px] sm:text-sm md:text-[15px]',
          'tracking-[0.04em]',
          'min-w-0 max-w-full truncate',
          reveal ? 'opacity-60' : '',
        ].join(' ')}
      >
        {word}
      </span>

      {/* Stamp overlay when revealed. */}
      {reveal && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={[
              'stamp px-1.5 py-0.5 sm:px-2',
              'text-[10px] sm:text-base',
              stampColor[reveal],
              'animate-stamp-slam',
            ].join(' ')}
            style={{
              border: '1px solid currentColor',
              borderRadius: 2,
            }}
          >
            {stampLabel[reveal]}
          </span>
        </span>
      )}
    </button>
  );
}
