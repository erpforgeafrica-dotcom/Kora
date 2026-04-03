FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci
COPY backend ./
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src/db/migrations ./src/db/migrations
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:render"]
