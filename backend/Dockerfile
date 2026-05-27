# ── Stage 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production ──────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JS
COPY --from=builder /app/dist ./dist

# Copy migration SQL files (drizzle reads them at runtime)
COPY --from=builder /app/src/infrastructure/database/migrations ./dist/infrastructure/database/migrations

EXPOSE 3000

# Run migrations → seed → start server
CMD ["sh", "-c", "node dist/infrastructure/database/migrate.js && node dist/infrastructure/database/seed.js && node dist/main.js"]
