import { useState } from 'react';

interface Props {
  code: string;
  /** What to actually copy to the clipboard (defaults to the code itself). */
  payload?: string;
  /** Tailwind classes for the code text — lets the parent control sizing. */
  codeClassName?: string;
  /** Optional label shown above the code, e.g. "Op Code". */
  label?: string;
}

export default function CopyCode({ code, payload, codeClassName, label }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const text = payload ?? code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / insecure origins: silently no-op. The code is still
      // visible on screen so the user can read/type it manually.
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-baseline gap-2 group focus:outline-none"
      title={`Copy ${payload ?? code}`}
      aria-label="Copy operation code"
    >
      {label && (
        <span className="text-[10px] uppercase tracking-[0.3em] text-ink-fade">
          {label}
        </span>
      )}
      <span
        className={[
          'font-stencil tracking-[0.3em] text-ink',
          'border-b border-dotted border-ink-fade group-hover:border-ink',
          'transition-colors',
          codeClassName ?? 'text-lg',
        ].join(' ')}
      >
        {code}
      </span>
      <span
        className={[
          'stamp text-[9px] tracking-[0.2em]',
          copied ? 'text-stamp-green opacity-100' : 'text-ink-fade opacity-0',
          'transition-opacity duration-200',
        ].join(' ')}
        aria-live="polite"
      >
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
