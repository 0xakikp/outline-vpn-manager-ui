# Outline VPN Manager UI — Production Dockerfile
# Multi-stage build: build React app → serve with lightweight Node server

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first (for layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Only copy the built app + server
COPY --from=builder /app/dist ./dist
COPY server.cjs ./

ENV PORT=3002
ENV NODE_ENV=production
ENV ALLOWED_ORIGIN=https://outline.akikp.in

EXPOSE 3002

CMD ["node", "server.cjs"]
