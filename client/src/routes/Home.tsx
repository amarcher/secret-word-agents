import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH } from '@saw/shared';
import { useGame } from '../lib/socket.ts';

export default function Home() {
  const navigate = useNavigate();
  const { connected, codename: storedCodename, createRoom, joinRoom } = useGame();
  const [codename, setCodename] = useState(storedCodename ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submitCreate = async () => {
    setError(null);
    const name = codename.trim();
    if (!name) return setError('Codename required.');
    setPending(true);
    const res = await createRoom(name);
    setPending(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    navigate(`/room/${res.roomCode}`);
  };

  const submitJoin = async () => {
    setError(null);
    const name = codename.trim();
    const code = roomCode.trim().toUpperCase();
    if (!name) return setError('Codename required.');
    if (code.length !== ROOM_CODE_LENGTH) return setError(`Operation code must be ${ROOM_CODE_LENGTH} characters.`);
    setPending(true);
    const res = await joinRoom(code, name);
    setPending(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    navigate(`/room/${res.roomCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="font-stencil text-5xl tracking-[0.18em] text-ink leading-none">
            SECRET <span className="block text-stamp-red">AGENT</span> WORDS
          </h1>
          <p className="mt-3 text-ink-fade text-xs uppercase tracking-[0.3em]">
            Two-Operative Cooperative Briefing
          </p>
        </header>

        <section className="case-file rounded-sm p-6 mb-4">
          <label className="block text-xs uppercase tracking-[0.25em] text-ink-fade mb-2">
            Operative Codename
          </label>
          <input
            type="text"
            value={codename}
            onChange={e => setCodename(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. RAVEN-7"
            className="ink-underline w-full font-typewriter text-2xl text-ink"
            autoFocus
          />
        </section>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={submitCreate}
            disabled={pending || !connected}
            className="case-file rounded-sm py-4 font-stencil text-2xl tracking-[0.2em] uppercase text-ink hover:translate-y-[-1px] transition-transform disabled:opacity-50"
          >
            Open New Mission
          </button>

          <div className="text-center font-typewriter text-ink-fade text-xs uppercase tracking-[0.4em] my-2">— or —</div>

          <section className="case-file rounded-sm p-4">
            <label className="block text-xs uppercase tracking-[0.25em] text-ink-fade mb-2">
              Operation Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH))}
                maxLength={ROOM_CODE_LENGTH}
                placeholder="A1B2"
                className="ink-underline flex-1 font-stencil text-3xl tracking-[0.4em] text-ink uppercase"
                onKeyDown={e => {
                  if (e.key === 'Enter') submitJoin();
                }}
              />
              <button
                type="button"
                onClick={submitJoin}
                disabled={pending || !connected || roomCode.length !== ROOM_CODE_LENGTH}
                className="font-stencil text-lg tracking-[0.18em] uppercase text-ink-fade hover:text-ink disabled:opacity-40"
              >
                Join &rarr;
              </button>
            </div>
          </section>
        </div>

        {error && (
          <p className="mt-4 stamp-red text-center text-sm tracking-widest uppercase">{error}</p>
        )}

        <footer className="mt-10 text-center text-ink-fade text-[10px] uppercase tracking-[0.3em]">
          Classified · For Internal Use Only
        </footer>
      </div>
    </div>
  );
}
