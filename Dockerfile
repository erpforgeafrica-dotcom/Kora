FROM node:20-alpine AS base
WORKDIR /app

# ---- Frontend build stage ----
FROM base AS frontend-builder
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend ./
RUN npm run build

# ---- Backend build stage ----
FROM base AS backend-builder
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci
COPY backend ./
RUN npm run build

# ---- Production stage ----
FROM base AS production
RUN apk add --no-cache dumb-init
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/dist/db/migrations ./dist/db/migrations
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||10000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
