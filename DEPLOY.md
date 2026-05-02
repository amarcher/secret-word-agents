# Deploying Secret Agent Words

Single-port Fly.io deployment. The server (Express + Socket.IO on `:3001`) also serves the built client at `/` in production. No external database — game state is in-memory per process; rooms are swept after 5 minutes of inactivity.

## First-time setup

1. **Generate VAPID keys** (one-time, do not regenerate after subscriptions exist — push subs are bound to the public key):
   ```
   npx web-push generate-vapid-keys --json
   ```

2. **Create the Fly app** and set secrets:
   ```
   fly apps create secret-agent-words
   fly secrets set VAPID_PUBLIC=<public-from-step-1> VAPID_PRIVATE=<private-from-step-1> VAPID_SUBJECT=mailto:you@example.com
   ```

3. **Edit `fly.toml`** — set `app = '<your-name>'` if you used a name other than `secret-agent-words`. `primary_region` defaults to `ewr`; change if you want.

4. **Deploy**:
   ```
   fly deploy
   ```

5. **Point a domain** (optional):
   ```
   fly certs add www.example.com
   ```
   Then add the CNAME / A records Fly prints.

## Required env vars

| Name | Purpose | Required |
| --- | --- | --- |
| `VAPID_PUBLIC` | Public VAPID key — exposed via `/api/push/key` to the browser. | yes (prod) |
| `VAPID_PRIVATE` | Private VAPID key — used by `web-push` to sign push payloads. | yes (prod) |
| `VAPID_SUBJECT` | `mailto:` address Mozilla / FCM use to contact you. | optional (defaults to `mailto:dev@secret-agent-words.local`) |
| `PORT` | HTTP port. Fly injects `8080` automatically; `3001` for local prod runs. | no |
| `NODE_ENV` | Must be `production` on prod. Set in `fly.toml` `[env]`. | yes (prod) |

In dev (`NODE_ENV !== production`), the server auto-generates ephemeral VAPID keys at boot and prints them to the console. Push subscriptions reset every restart — set the env vars locally too if you want stable dev subs.

## Verify deploy

After `fly deploy`:

```
curl https://<app>.fly.dev/api/health           # → {"status":"ok"}
curl https://<app>.fly.dev/api/push/key         # → {"publicKey":"..."}
curl -I https://<app>.fly.dev/manifest.webmanifest
curl -I https://<app>.fly.dev/sw.js
```

Then open `https://<app>.fly.dev/` in two browsers and run a full create → join → clue → guess loop end-to-end. Tap "Enable pings" on one tab, close it, fire a clue from the other — system notification should arrive.

## Rolling back

```
fly releases                # list recent versions
fly deploy --image <ref>    # redeploy a previous image
```

Or revert the offending git commit and `fly deploy` from the fixed branch.

## Local production smoke test

```
npm run build
VAPID_PUBLIC=... VAPID_PRIVATE=... NODE_ENV=production node server/dist/index.js
curl http://localhost:3001/api/health
```

This is the same code path the Fly image runs, minus the Docker layer.
