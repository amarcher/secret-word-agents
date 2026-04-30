# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Codenames Duet (cooperative variant) implemented as a real-time multiplayer web app. Two players share a 25-word board where each player sees a different role assignment (their own AGENTs, NON_AGENTs, and ASSASINs) and gives clues to help the other player guess their AGENTs. Game state is shared over WebSockets, persisted in Redis, and a companion iOS app receives APN push notifications.

Live deployment: https://secret-agent-words.herokuapp.com/

## Commands

```bash
# First-time setup (requires Redis running locally)
brew install redis
brew services start redis
npm install            # also runs `webpack` via postinstall

# Development
npm run build          # one-shot client bundle to public/js/bundle.js
npm run watch          # rebuild bundle on change
npm start              # start the Express + WS server (defaults to PORT=3000)

# Lint
npm run lint           # eslint over public/js (airbnb config, tabs)
npm run lint-fix
```

There is no test suite (`npm test` exits 1).

Pinned to **Node 8.9.4** (`engineStrict: true` in package.json). Newer Node versions will refuse to install.

Required env vars: `REDIS_URL` (defaults to local Redis), `APN_CERT` (APNs auth key for iOS push), `PORT`.

## Architecture

### Client / server split

- **Server** (`src/`): Express app that serves the EJS layout and the static `public/` bundle, plus a `ws` WebSocket server attached to the same HTTP server. Almost all real game traffic goes over the WebSocket; the few HTTP endpoints (`/games`, `/exists`, `/leave`) handle out-of-band lookups and cleanup. There is no per-game routing — the `gameId` lives in each WS message payload, not the URL path.
- **Client** (`public/js/`): React + Redux SPA bundled by webpack 3 (Babel presets `es2015`, `react`, `stage-2`). Entry is `public/js/main.jsx`; output is `public/js/bundle.js` (gitignored — the `.eslintignore` skips it). Routes: `/` → enter-game form; `/:gameId` → game container.

### Game model and the dual-perspective board

The core mechanic is in `src/game.js`:
- 25 words are picked from `src/words.js`. Each square gets **two independent role assignments** — one for each player's perspective (`playerOne`, `playerTwo`) — drawn from `ASSASIN | AGENT | NON_AGENT`. A square that is an AGENT for player one may be a NON_AGENT or ASSASIN for player two.
- Constants live at the top of `src/game.js`: 9 agents per player, 15 unique agents on the board (so 3 are shared/overlapping), 3 assassins per player, 9 turns total.
- `roleRevealedForClueGiver` tracks, per word, what each player has had revealed to them — this is what's broadcast to clients, while the underlying role map is server-only.
- A `Game` instance can be reconstructed from a serialized blob; the `RedisClient.setGame` / `getGame` pair handles the (de)serialization.

When sending state to a client, the server only includes the role for that client's `teamId` (see `RedisClient.getWords`) so a player never sees the other player's role assignments.

### Per-connection state on the WebSocket

`src/index.js` mutates the `ws` object directly to cache identity per-connection: `ws.gameId`, `ws.playerId`, `ws.teamId`, `ws.token` (APNs), `ws.facebookId`, `ws.facebookImage`, `ws.playerName`. The header comment in `src/index.js` documents this convention. There's also a top-level `sockets` map: `{ [gameId]: Set<ws> }` used for broadcast.

A 30-second ping/pong heartbeat (`THIRTY_SECONDS` interval) terminates dead connections — many browsers self-close otherwise.

### Request lifecycle

Each incoming WS message goes through two stages:
1. `handleInitialRequest` — assigns `ws.gameId` if first message, lazily creates the `sockets[gameId]` Set, replays the existing players to the new client as `playerJoined` events, lazily creates the Game in Redis if needed, and detects "implicit player changes" (a non-`changePlayer` request whose payload carries a new `token`/`facebookId`/`playerName`).
2. `handleRequest` — switches on `data.type`: `words`, `changePlayer`, `changeTeam`, `guess`, `giveClue`, `endTurn`, `startNewGame`.

When a connection closes, `handlePlayerLeft` broadcasts the departure and (only for anonymous players with no Facebook id and no APN token) removes them from the team in Redis. Persistent identities stay attached to the team so they show up in `/games` later.

`broadcast(gameId, data)` and `send(client, data)` always inject `gameId` into outgoing messages. The client's `onWsEvent` (in `public/js/stores/index.js`) dispatches Redux actions keyed by `payload.type`.

### Redis schema

Documented in `README.md`. Authoritative client is `src/redis.js`, which uses `bluebird.promisifyAll(redis)` to get `*Async` versions of every node-redis method. Notable patterns:
- Word data is stored as a comma-joined string `"playerOneRole,playerTwoRole,revealedToPlayerOne,revealedToPlayerTwo"` in a single hash field per word, not as nested structures. Round-trip helpers: `setWordMap` / `getWordMap` / `getWordData` / `setWordData`.
- Two identity indexes are maintained alongside `player:{id}`: `facebook:{facebookId} -> playerId` and `token:{token} -> playerId`. `setPlayer` reuses an existing playerId if either index resolves; otherwise it `INCR`s `playerIds`.
- Per-team tokens are stored separately (`game:{id}:tokens:{teamId}`) so the server can push iOS notifications only to the *other* team when a clue/guess happens.

### Client state

Redux store composed in `public/js/stores/index.js` from per-slice reducers (`game-store`, `players-store`, `turns-store`, `team-id-store`, `player-name-store`) plus `react-router-redux`. WS plumbing lives in `public/js/utils/ws.js` and reconnects on close with a 5s backoff; `addCallbacks({ onWsEvent, onWsConnected })` wires it to the store.

Components in `public/js/components/` are mostly thin views (`game-view`, `clue-view`, `turn-view`, `player-view`, `word`, etc.) connected to the store. `container.jsx` is the per-game shell mounted at `/:gameId`; on unmount it calls `closeWebSocket()` so leaving the route tears down the WS.

### iOS push notifications

`src/push-notifications.js` wraps `node-pushnotifications` with hardcoded APNs `keyId`, `teamId`, and `topic` (`org.reactjs.native.example.Dooler`). The auth key itself comes from `process.env.APN_CERT`. The companion native iOS app is the consumer.

## Conventions

- **Tabs, airbnb ESLint config.** The repo enforces tabs (`indent: ["error", "tab"]`, `react/jsx-indent`, `react/jsx-indent-props`) and a 150-char line limit. Run `npm run lint-fix` before committing JS/JSX changes.
- **Server is CommonJS, client is ES modules + JSX.** Don't mix — `src/` uses `require`/`module.exports`; `public/js/` uses `import`/`export`.
- The `bundle.js` artifact lives in `public/js/` and is gitignored / eslint-ignored. Webpack builds run via `npm run build`, `watch`, or the `postinstall` hook.
