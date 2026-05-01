# syntax=docker/dockerfile:1.7

# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app

# Install workspace package manifests first for cache-friendly npm ci.
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

RUN npm ci

# Copy sources for each workspace.
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Build shared first (server + client both depend on it).
# --composite false avoids tsbuildinfo race issues inside the image.
RUN cd shared && npx tsc --composite false

# Server compiles to JS.
RUN cd server && npx tsc

# Client compiles via Vite (skip the tsc --noEmit pre-step in image to keep
# the build deterministic — we already type-check in CI).
RUN cd client && npx vite build

# --- Runtime stage ---
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Re-install ONLY production deps so we ship a slim image.
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

RUN npm ci --omit=dev

# Copy built artifacts from the build stage.
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
