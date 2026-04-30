import type { RoomPlayer, TeamId } from '@saw/shared';

interface Props {
  players: RoomPlayer[];
  myTeam: TeamId | null;
}

export default function TeamPanel({ players, myTeam }: Props) {
  const slots: Array<{ team: TeamId; player: RoomPlayer | undefined }> = [
    { team: 1, player: players.find(p => p.team === 1) },
    { team: 2, player: players.find(p => p.team === 2) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map(({ team, player }) => {
        const me = team === myTeam;
        return (
          <div
            key={team}
            className={[
              'case-file rounded-sm px-3 py-2',
              me ? 'border-stamp-red' : '',
            ].join(' ')}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-ink-fade flex items-center justify-between">
              <span>Operative {team === 1 ? 'I' : 'II'}</span>
              {me && <span className="stamp-red text-[9px]">You</span>}
            </div>
            {player ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-typewriter text-base text-ink truncate">
                  {player.codename}
                </span>
                {!player.connected && (
                  <span className="text-[9px] uppercase tracking-widest text-ink-fade">
                    · offline
                  </span>
                )}
              </div>
            ) : (
              <div className="font-typewriter text-base text-ink-fade italic mt-1">
                — vacant —
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
