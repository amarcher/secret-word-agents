# Secret Agent Words

Two-operative cooperative word-guessing game on the web. Each operative sees their own grid of 25 case files; their partner sees a different grid; together they take turns transmitting one-word clues and guessing each other's agents before they run out of turns or pick the wrong card.

Modeled on Codenames Duet's mechanics with a fresh dossier-themed visual language and an original word list.

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

50+ tests cover Game semantics (overlap, mid-turn forfeit, assassin, win), RoomManager (slot assignment, ghost eviction, reconnect rekey, inactivity sweep), GameRoom (broadcast fan-out, push-when-offline), and PushHub (send, 410 drop, transient retention).

## Deploy

See [DEPLOY.md](./DEPLOY.md) for the Fly.io single-port deployment and required production env vars.

## Other docs

- [CLAUDE.md](./CLAUDE.md) — codebase orientation for AI assistants.
- [DESIGN.md](./DESIGN.md) — dossier visual direction (color, type, motion, lexicon).
- `_legacy/` — 2018 Node 8 / Webpack 3 / Redis / Facebook-login codebase, preserved for reference. Not built or shipped.
