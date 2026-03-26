# KORA Platform

AI-powered business platform scaffolded as a modular monolith.

## Stack
- Frontend: React 18, Vite, TypeScript, Tailwind, Zustand
- Backend: Node.js, Express, TypeScript
- Infra: Docker Compose (Postgres + Redis)

## Structure
- `frontend/`: dashboard client
- `backend/`: modular monolith API
- `.github/copilot-instructions.md`: engineering guidance

## Quick Start
1. Start infra:
```bash
docker compose up -d postgres redis
```
2. Backend:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
3. Worker:
```bash
cd backend
npm run dev:worker
```
4. Frontend:
```bash
cd frontend
npm install
npm run dev
```

## URLs
- Frontend: `http://localhost:5174` (single instance, multi-role)
- Backend: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- API docs placeholder: `http://localhost:3000/api/docs`

### Role-Based Dashboards (Single Frontend)
- Landing: `http://localhost:5174/`
- Client: `http://localhost:5174/app/client?role=client`
- Business Admin: `http://localhost:5174/app/business-admin?role=business_admin`
- Staff: `http://localhost:5174/app/staff?role=staff`
- Operations: `http://localhost:5174/app/operations?role=operations`
- Platform Admin: `http://localhost:5174/app/kora-admin?role=platform_admin`

## Auth (Phase 03)
- Backend now verifies Clerk bearer session tokens on protected module routes.
- Required env: `CLERK_SECRET_KEY`
- Optional env: `CLERK_AUTHORIZED_PARTIES` (comma-separated origins)
- Public endpoint: `GET /api/auth/status`
- Protected test endpoint: `GET /api/auth/me`

## Async Workers (Phase 03)
- Queue backend: BullMQ + Redis
- Producer endpoints:
  - `POST /api/notifications/dispatch`
  - `POST /api/reporting/generate`
- Worker entrypoint: `backend/src/workers.ts`

## AI Foundation (Phase 04)
- Multi-provider SDKs installed:
  - Anthropic (`@anthropic-ai/sdk`)
  - OpenAI (`openai`)
  - Google Gemini (`@google/genai`)
  - Mistral (`@mistralai/mistralai`)
- Migration + seed scripts:
  - `npm run db:migrate`
  - `npm run db:seed`
- Required env for provider routing:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GOOGLE_API_KEY`
  - `MISTRAL_API_KEY`

## Live Orchestration (Phase 04+)
- `POST /api/ai/orchestrate/live`
  - Aggregates signals from 8 modules
  - Scores actions using severity, dependencies, role, SLA risk, and historical feedback
  - Optionally auto-executes workflow policies
- `POST /api/ai/orchestrate/feedback`
  - Stores accepted/rejected/executed outcomes to continuously tune ranking quality

## Module Boundaries
- Auth
- Bookings
- Clinical
- Emergency
- Finance
- AI
- Notifications
- Reporting
