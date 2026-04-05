# Render Deployment

This repo deploys cleanly to Render as five resources:

- `kora-postgres` database
- `kora-redis` Redis
- `kora-backend` web service
- `kora-worker` background worker
- `kora-frontend` static site

## Blueprint

Render can create the stack directly from `render.yaml`.

Use Render Blueprint deployment, not the old single Docker web service.

1. In Render, choose `New` -> `Blueprint`.
2. Connect `erpforgeafrica-dotcom/Kora`.
3. Select branch `main`.
4. Confirm Render detects `render.yaml`.
5. Review the resources Render will create:
   `kora-postgres`, `kora-redis`, `kora-backend`, `kora-worker`, `kora-frontend`.
6. Apply the Blueprint.

If you already have an older legacy Docker web service pointing at this repo root, remove it after the Blueprint resources are created. Otherwise you will keep deploying the wrong service and reading the wrong logs.

## Required manual secrets before first production deploy

Set these for both `kora-backend` and `kora-worker`:

- `JWT_SECRET`
- `SESSION_SECRET`
- `API_BASE_URL`
- `CORS_ORIGINS`

Optional:

- `CLERK_SECRET_KEY`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Set these for `kora-frontend`:

- `VITE_API_BASE_URL`
- `VITE_ORG_ID` if your deployment depends on a fixed org fallback

## Expected values

- `VITE_API_BASE_URL`: backend public origin, for example `https://kora-backend.onrender.com`
- `API_BASE_URL`: backend API origin including `/api`, for example `https://kora-backend.onrender.com/api`
- `CORS_ORIGINS`: frontend public origin, for example `https://kora-frontend.onrender.com`

## Deploy notes

- Backend startup now runs `npm run db:migrate:prod` before `npm run start`
- The worker uses the same database and Redis resources as the backend
- The frontend is configured as an SPA and rewrites all routes to `index.html`
- If you rename services in Render, update the manual URL-based environment values to match
