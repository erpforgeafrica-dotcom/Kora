## Partner Code Review — Agent A -> Agent B

### ✅ What Agent B got right
- Frontend API client includes bearer token handling and org header support.
- Polling logic exists for periodic AI data refresh in `useAIInsights` (30s).
- Dashboard has an AI section placeholder and metric auto-refresh behavior.
- AI command center UX intent is strong: ranking cards, feedback actions, follow-up display, policy section.

### 🔴 Issues found in frontend
- Prop contract mismatch between dashboard and command center:
  - `frontend/src/pages/Dashboard.tsx:52` passes `insights/suggestions/predictions`.
  - `frontend/src/components/AICommandCenter.tsx:4` expects `result: LiveOrchestrationResult`.
- Orchestration endpoint not actually used by `useAIInsights`:
  - `frontend/src/hooks/useAIInsights.ts:27` calls `/api/ai/insights`, `/suggestions`, `/predictions` only.
  - It does not call `POST /api/ai/orchestrate/live`.
- `orchestrateLive` request body misses `userRole`:
  - `frontend/src/services/api.ts:179` sends `{ topN, autoExecute }` only.
- Duplicate `APIError` declaration in API client:
  - `frontend/src/services/api.ts:10` imports `APIError`.
  - `frontend/src/services/api.ts:28` redeclares `class APIError`.
- Command center expects fields not returned by backend orchestration response:
  - Frontend uses `candidateId/module/confidence` at `frontend/src/components/AICommandCenter.tsx:138`, `:203`, `:223`.
  - Backend returns `id/sourceModule/score/reasoning/followUpChain`.
- Reasoning/follow-up shape mismatch:
  - Frontend expects `reasoning[{metric,value}]` and `followUpChain[{module,action}]` (`frontend/src/components/AICommandCenter.tsx:248`, `:273`).
  - Backend currently returns `reasoning: string[]`, `followUpChain: string[]`.
- Policy outcome shape mismatch:
  - Frontend expects `policy_id/policy_name` (`frontend/src/components/AICommandCenter.tsx:337`, `:344`).
  - Backend currently returns `policyId/description`.
- Frontend references `/api/ai/query` but backend route is missing:
  - `frontend/src/services/api.ts:219`.

### 💡 Innovation suggestions for frontend
- Render a dual-layer orchestration timeline:
  - layer 1: current ranked actions
  - layer 2: AI-predicted next 3 actions over next 60 minutes
- Add trust telemetry UI:
  - show policy dry-run confidence + explainability badges before operator approval
- Add streaming orchestration mode:
  - show partial rank updates via WebSocket instead of waiting full poll cycle
- Add role-calibrated interaction profile:
  - operator sees concise action list
  - admin sees causality + budget + risk simulation panes

### Schema alignment confirmation
- Tables Agent B queries that DO exist:
  - `anomaly_events` (via `/api/ai/anomalies`)
  - `ai_insights`, `ai_predictions`, `ai_requests` (indirectly through AI APIs)
- Tables Agent B queries that DON'T exist:
  - none directly from frontend, but endpoint `/api/ai/query` does not exist server-side
- Type mismatches between frontend expectations and backend response model:
  - action key: `candidateId` vs `id`
  - module key: `module` vs `sourceModule`
  - reasoning shape: object array vs string array
  - follow-up shape: object array vs string array
  - policy key: `policy_id/policy_name` vs `policyId/description`

## Phase 2 Additions
- POST `/api/ai/query`: implemented and wired in [routes.ts](/c:/Users/hp/KORA/backend/src/modules/ai/routes.ts)
- DB migration verification:
  - `docker compose up -d postgres redis`: BLOCKED (Docker Engine unavailable)
  - `npm run db:migrate`: BLOCKED (`ECONNREFUSED` to `localhost:5432`)
  - Physical table checklist (pending DB availability):
    - ☐ organizations
    - ☐ users
    - ☐ bookings
    - ☐ clinical_records
    - ☐ incidents
    - ☐ invoices
    - ☐ ai_requests
    - ☐ notifications
    - ☐ audit_logs
    - ☐ reports
    - ☐ ai_insights
    - ☐ ai_budgets
    - ☐ ai_command_candidates
    - ☐ ai_action_feedback
    - ☐ ai_orchestration_events
    - ☐ anomaly_events
- Final typecheck: PASS
- Final test run: 3/3 PASS
