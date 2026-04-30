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
    <div className="case-file rounded-sm px-4 py-2 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.25em] text-ink-fade">
      <CopyCode label="Op Code" code={roomCode} payload={shareUrl} />
      <div className="flex items-center gap-4">
        <Stat label="Turns" value={view.turnsLeft} accent={view.turnsLeft <= 2} />
        <Stat label="Op-I" value={view.agentsLeftTeam1} />
        <Stat label="Op-II" value={view.agentsLeftTeam2} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px]">{label}</span>
      <span
        className={[
          'font-stencil text-lg tracking-widest',
          accent ? 'text-stamp-red' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
