# Render Deployment

This repo deploys cleanly to Render as four resources:

- `kora-postgres` database
- `kora-redis` Redis
- `kora-backend` web service
- `kora-worker` background worker
- `kora-frontend` static site

## Blueprint

Render can create the stack directly from `render.yaml`.

## Required manual secrets before first production deploy

Set these for both `kora-backend` and `kora-worker`:

- `JWT_SECRET`
- `SESSION_SECRET`
- `CLERK_SECRET_KEY`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `API_BASE_URL`
- `CORS_ORIGINS`

Set these for `kora-frontend`:

- `VITE_API_BASE_URL`
- `VITE_ORG_ID` if your deployment depends on a fixed org fallback

## Expected values

- `VITE_API_BASE_URL`: backend public origin, for example `https://kora-backend.onrender.com`
- `API_BASE_URL`: backend API origin including `/api`, for example `https://kora-backend.onrender.com/api`
- `CORS_ORIGINS`: frontend public origin, for example `https://kora-frontend.onrender.com`

## Deploy notes

- Backend startup now runs `npm run db:migrate` before `npm run start`
- The worker uses the same database and Redis resources as the backend
- The frontend is configured as an SPA and rewrites all routes to `index.html`
- If you rename services in Render, update the manual URL-based environment values to match
