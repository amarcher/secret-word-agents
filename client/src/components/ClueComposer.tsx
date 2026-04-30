import { useState } from 'react';

interface Props {
  onSubmit: (word: string, count: number) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  agentsLeft: number;
}

export default function ClueComposer({ onSubmit, disabled, agentsLeft }: Props) {
  const [word, setWord] = useState('');
  const [count, setCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    const w = word.trim();
    if (!w) return setError('Clue word required.');
    setPending(true);
    const res = await onSubmit(w, count);
    setPending(false);
    if (!res.success) {
      setError(res.error ?? 'Clue rejected.');
      return;
    }
    setWord('');
    setCount(1);
  };

  return (
    <div className="case-file rounded-sm px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-ink-fade mb-2">
        Briefing — Compose Transmission
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={word}
          onChange={e => setWord(e.target.value)}
          placeholder="ONE-WORD CLUE"
          maxLength={24}
          className="ink-underline flex-1 font-typewriter text-xl uppercase tracking-[0.1em] text-ink"
          onKeyDown={e => {
            if (e.key === 'Enter') submit();
          }}
          disabled={disabled || pending}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCount(c => Math.max(0, c - 1))}
            disabled={disabled || pending}
            className="font-stencil text-xl px-2 text-ink-fade hover:text-ink"
            aria-label="Decrement count"
          >
            −
          </button>
          <span className="font-stencil text-2xl tracking-[0.1em] text-stamp-red w-6 text-center">
            {count}
          </span>
          <button
            type="button"
            onClick={() => setCount(c => Math.min(agentsLeft, c + 1))}
            disabled={disabled || pending}
            className="font-stencil text-xl px-2 text-ink-fade hover:text-ink"
            aria-label="Increment count"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || pending || !word.trim()}
          className="font-stencil text-base tracking-[0.18em] uppercase text-ink hover:text-stamp-red disabled:opacity-40"
        >
          Send &rarr;
        </button>
      </div>
      {error && <div className="mt-2 stamp-red text-xs tracking-widest">{error}</div>}
    </div>
  );
}
