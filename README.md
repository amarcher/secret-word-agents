# Secret Agent Words

Two-operative cooperative word-guessing game on the web. Each operative sees their own grid of 25 case files; their partner sees a different grid; together they take turns transmitting one-word clues and guessing each other's agents before they run out of turns or pick the wrong card.

Modeled on Codenames Duet's mechanics with a fresh dossier-themed visual language and an original word list.

**▶ Play: https://secret-agent-words.fly.dev**

## How to play

1. Open the link above and pick a codename.
2. Either tap **Open New Mission** to create a room — or paste a 4-character operation code your partner sent you.
3. Share your operation code with one other person (the room URL works too — there's a copy button next to the code).
4. Take turns: one operative transmits a one-word clue + a number; the other taps cards on the board trying to find their partner's agents.
5. Win condition — find all 15 agents across both grids. Lose conditions — pick an assassin, or run out of turns.

The game is best on two devices in the same room or on a voice call. Each player needs to see their own board and *not* their partner's.

## Stack

- TypeScript monorepo (npm workspaces): `shared/`, `server/`, `client/`.
- Server: Express + Socket.IO 4 on `:3001`. In-memory `RoomManager` with reconnect tokens and a 5-min inactivity sweep. Web Push via `web-push`.
- Client: React 19 + Vite + Tailwind. PWA-installable, web-push notifications when your partner sends a clue while your tab is closed.
- No database. Game state lives per process.

## Develop

```
npm install
npm run dev
```

`npm run dev` runs three workspaces concurrently — `shared` in `tsc --watch`, `server` via `tsx watch`, `client` via Vite. Open `http://localhost:5173` in two browser windows to play.

In dev, the server auto-generates ephemeral VAPID keys on boot. Push subscriptions reset every restart. Set `VAPID_PUBLIC` / `VAPID_PRIVATE` in env if you want stable dev subs.

## Test

```
npm test          # vitest run, all workspaces
npm run typecheck # tsc --build across workspace refs
```

50 tests cover Game semantics (overlap, mid-turn forfeit, assassin, win), RoomManager (slot assignment, ghost eviction, reconnect rekey, inactivity sweep), GameRoom (broadcast fan-out, push-when-offline), and PushHub (send, 410 drop, transient retention).

## Deploy

Deployed to Fly.io — see [DEPLOY.md](./DEPLOY.md) for the single-port configuration, required production env vars, and the first-time checklist.

## Other docs

- [CLAUDE.md](./CLAUDE.md) — codebase orientation for AI assistants.
- [DESIGN.md](./DESIGN.md) — dossier visual direction (color, type, motion, lexicon).
- `_legacy/` — 2018 Node 8 / Webpack 3 / Redis / Facebook-login codebase, preserved for reference. Not built or shipped.

## History

Originally built in 2018 as `secret-word-agents` (Node 8 / Webpack 3 / Express + raw `ws` / Redis / Facebook login) with a React Native iOS companion. Hosted on Heroku until the platform's free tier was retired. Revived in 2026 as a TypeScript monorepo on Fly.io with web push notifications and a dossier-themed redesign — the original code is preserved in `_legacy/` for reference.
