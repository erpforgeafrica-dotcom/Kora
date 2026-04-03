# Multi-stage build for KORA backend
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development stage with hot reload support
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Production runtime stage
FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:render"]
