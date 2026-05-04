# Multi-stage build for KORA frontend
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development stage with hot reload support
FROM base AS development
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage - accepts environment variables as build args
FROM base AS builder
ARG VITE_API_BASE_URL=https://kora-production-7661.up.railway.app
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_ORG_ID=org_production
ARG VITE_APP_NAME=KORA

# Export as environment variables so Vite can pick them up during build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
ENV VITE_ORG_ID=${VITE_ORG_ID}
ENV VITE_APP_NAME=${VITE_APP_NAME}

RUN npm ci
COPY . .
RUN npm run build

# Production runtime stage
FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init && npm install -g serve
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["serve", "-s", "dist", "-l", "5173"]
