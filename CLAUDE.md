# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Two-operative cooperative word-guessing game (Codenames-Duet-mechanic). Originally written in 2018 on Node 8 / Webpack 3 / Express + raw `ws` / Redis / Facebook login / RN iOS companion (see `_legacy/`). Rewritten in 2026 as a Node 22 TypeScript monorepo modeled on `/Users/archer/Programs/contexto-multiplayer`. Web-only, in-memory state, dossier-themed PWA with web-push notifications.

The dual-perspective game logic is the only piece worth preserving — it's the genuinely interesting part. Plumbing is fresh.

## Commands

```
npm install
npm run dev        # concurrent: shared (tsc --watch) + server (tsx watch) + client (vite)
npm run build      # shared → server → client
npm test           # vitest run, all workspaces
npm run typecheck  # tsc --build (project references)
```

Single test file: `npx vitest run path/to/file.test.ts`.

Single workspace build: `npm run build -w shared` / `-w server` / `-w client`.

The dev server runs on `:3001` (server) and `:5173` (client, with proxy for `/socket.io` and `/api`). Open the client at `http://localhost:5173`.

Production: `npm run build` then `NODE_ENV=production node server/dist/index.js`. The server serves the built client at `/`.

## Architecture

### Workspaces

```
shared/   @saw/shared   game logic + Socket.IO event types + constants
server/   @saw/server   Express + Socket.IO + RoomManager + PushHub
client/   @saw/client   React 19 + Vite + Tailwind + service worker
```

Each has its own `tsconfig.json` extending `tsconfig.base.json` with project references. `shared` is `composite: true` so it builds independently and the others reference its emitted `dist/`.

ESM throughout. All workspaces are `"type": "module"`. Imports between workspaces use the package name (`@saw/shared`); inside a workspace, relative imports must include the `.js` extension (Node ESM rule), e.g. `import { Game } from './game/Game.js'`.

### The game model

`shared/src/game/Game.ts` is the only piece carrying real domain logic. Every square holds **two role assignments**, one per team — what's an AGENT for team 1 may be a NON_AGENT or ASSASSIN for team 2. Reveals accumulate per grid: when team 2 guesses a word, the role from team 1's grid becomes `revealedOnTeam1`. Overlapping AGENTS (the 3 words that are AGENT on both grids) decrement both teams' counters in a single guess and reveal on both grids.

Win = both `agentsLeftTeam1` and `agentsLeftTeam2` hit zero. Loss = ASSASSIN guessed (turnsLeft → 0) or turnsLeft exhausted from non-agent guesses + mid-turn clue forfeits.

`Game.getViewForPlayer(team)` is the security boundary. **It must never include the partner's role assignments.** Test `Game.test.ts > 'only exposes the requesting team's role'` asserts this via `JSON.stringify` not containing the partner's value.

### Room lifecycle (server)

`server/src/socket/`:
- **`GameRoom.ts`** — wraps one `Game` plus two `PlayerSlot`s. Owns curried broadcast/emit callbacks (the room code is bound at construction). `applyClue` / `applyGuess` / `applyEndTurn` / `newGame` mutate the game then fan out events plus per-player views. Each slot carries its `reconnectToken` so push fan-out can resolve.
- **`RoomManager.ts`** — `Map<roomCode, GameRoom>` plus `socketToRoom` and `tokenToSocket` registries. Generates 4-char room codes (alphabet excludes I/O/0/1). On reconnect, rekeys the existing slot to the new socket id. Inactivity sweep runs every 60 s with a 5-min idle threshold (`ROOM_INACTIVITY_TIMEOUT` in `shared/src/constants.ts`). Tests inject a fake `now` to drive the sweep deterministically.
- **`handlers.ts`** — single `registerHandlers(io, manager)` wires Socket.IO events to RoomManager calls. The `room:join` handler tries the reconnect token branch first, falls through to a fresh join on stale tokens.

### Push (server + service worker)

`server/src/push/PushHub.ts` keeps a `Map<reconnectToken, PushSubscription>`. `GameRoom.applyClue` and `applyGuess` call `pushPartner(...)` which fires only when the partner slot is `connected: false` — connected partners already see the in-app socket event. Dead subscriptions (404/410) are dropped automatically.

`client/public/sw.js` handles `push` (renders Notification with `tag: saw-<roomCode>` for renotify) and `notificationclick` (focuses an existing tab on `/room/<code>` or opens one).

VAPID keys: `loadVapidConfig()` reads `VAPID_PUBLIC` / `VAPID_PRIVATE` / `VAPID_SUBJECT` from env; auto-generates ephemerals in dev with a loud warning; **hard-fails** in production.

### Client

React Router v7 with two routes: `Home` (`/`) and `Room` (`/room/:roomCode`). `client/src/lib/socket.ts` exports a singleton typed `Socket<ServerToClientEvents, ClientToServerEvents>` plus a `useGame()` hook that owns the connection, persists `reconnectToken` / `roomCode` / `codename` in localStorage, and exposes action emitters.

On hard reload of `/room/XXXX`, `Room.tsx`'s effect calls `reconnectIfStored(roomCode)`. If the token is missing, stale, or the room was swept, it navigates back to `/`.

### Visual language

Dossier theme. See `DESIGN.md` for the full token list. Tailwind config lives in `client/tailwind.config.ts`. Highlights:
- Color tokens: `paper-cream`, `paper-aged`, `paper-edge`, `ink`, `ink-fade`, `stamp-red`, `stamp-blue`, `stamp-green`, `caution`. **Never use raw hex** — always reference tokens.
- Type stack: Big Shoulders Stencil for stamps/headers; Special Elite (typewriter) for body and word cards; Courier Prime for UI controls.
- Animations: `stamp-slam` on word reveals, `typewriter-in` on new clues (clip-path), `count-pulse` on agents-left changes, `folder-slide` on overlays. All gated by `prefers-reduced-motion`.

User-facing copy uses the lexicon (operative / codename / op code / briefing / intercept / case file / mission / dossier). Never write "Codenames" in any public-facing string — gameplay mechanic is fine, brand isn't.

## Conventions

- **Tabs vs spaces**: 2-space indent throughout the new code (TS / JSX). The `_legacy/` codebase uses tabs; ignore its style.
- **Imports**: relative imports inside a workspace include `.js`; cross-workspace use the package name.
- **Don't reach into `_legacy/`** for live code paths. It's reference only — the new build does not consume it. Verify any "this used to work" claims by reading the new files first.
- **Tests live next to their source**: `Foo.ts` + `Foo.test.ts`. Vitest workspace config in `vitest.workspace.ts`.
- **Player identity is ephemeral**. There is no auth, no user accounts, no DB. Reconnect tokens persist across page reloads via localStorage but die with the server process. Don't add an account system unless explicitly asked.

## Don't

- Don't reintroduce Redis, Facebook login, or APN tokens. Those are intentionally gone.
- Don't touch `_legacy/` or `dooler_native` (sibling RN app). Both are dormant.
- Don't use "Codenames" in user-visible strings, marketing copy, or asset names. Internal docs (this file, plan files, commit messages) may reference the lineage.
- Don't add `applicationServerKey: Uint8Array` directly — the strict-TS subtype is `Uint8Array<ArrayBufferLike>` which isn't `BufferSource`-compatible. Build a fresh `ArrayBuffer` and wrap with `Uint8Array` (see `client/src/lib/push.ts:urlBase64ToUint8Array`).
