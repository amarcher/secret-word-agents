import { useEffect, useRef, useState } from 'react';
import type { PlayerView } from '@saw/shared';
import CopyCode from './CopyCode.tsx';

interface Props {
  view: PlayerView;
  roomCode: string;
}

export default function InfoBar({ view, roomCode }: Props) {
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomCode}`
    : roomCode;

  return (
    <div className="case-file rounded-sm px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.25em] text-ink-fade">
      <CopyCode label="Code" code={roomCode} payload={shareUrl} />
      <div className="flex items-center gap-3 sm:gap-4">
        <Stat label="Turns" value={view.turnsLeft} accent={view.turnsLeft <= 2} />
        <Stat label="I" value={view.agentsLeftTeam1} />
        <Stat label="II" value={view.agentsLeftTeam2} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  // Bump the React `key` when value changes so the inner span remounts and the
  // count-pulse keyframe replays.
  const [pulseKey, setPulseKey] = useState(0);
  const lastValue = useRef(value);
  useEffect(() => {
    if (lastValue.current !== value) {
      setPulseKey(k => k + 1);
      lastValue.current = value;
    }
  }, [value]);

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[9px] sm:text-[10px]">{label}</span>
      <span
        key={pulseKey}
        className={[
          'font-stencil text-base sm:text-lg tracking-widest tabular-nums inline-block',
          accent ? 'text-stamp-red' : 'text-ink',
          pulseKey > 0 ? 'animate-count-pulse' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
