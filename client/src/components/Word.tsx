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
        'case-file relative w-full aspect-[5/3] rounded-[2px] px-2 py-3',
        'flex items-center justify-center text-center',
        'transition-transform duration-150',
        isClickable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default',
        reveal ? 'opacity-95' : '',
      ].join(' ')}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={`${word}${reveal ? `, revealed as ${stampLabel[reveal]}` : ''}`}
    >
      {/* My role indicator — small corner marker (the dossier annotation). */}
      <span
        className={`absolute top-1 left-1.5 text-[10px] font-mono ${marker.cls}`}
        aria-hidden
      >
        {marker.glyph}
      </span>

      <span
        className={[
          'font-typewriter text-ink uppercase select-none',
          'text-sm sm:text-base md:text-[15px]',
          'tracking-[0.05em]',
          reveal ? 'opacity-60' : '',
        ].join(' ')}
      >
        {word}
      </span>

      {/* Stamp overlay when revealed. */}
      {reveal && (
        <span
          className={[
            'absolute inset-0 flex items-center justify-center pointer-events-none',
            'animate-stamp-slam',
          ].join(' ')}
        >
          <span
            className={[
              'stamp text-[14px] sm:text-base px-2 py-0.5',
              stampColor[reveal],
              'border border-current/40',
            ].join(' ')}
            style={{
              borderColor: 'currentColor',
              borderRadius: 2,
              transform: 'rotate(-3deg)',
            }}
          >
            {stampLabel[reveal]}
          </span>
        </span>
      )}
    </button>
  );
}
