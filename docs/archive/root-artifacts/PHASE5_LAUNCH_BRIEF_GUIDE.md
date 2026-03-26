# Phase 5 Launch Brief Integration Guide

## Component Location
- **File**: `frontend/src/components/Kora_Phase5Launch.tsx`
- **Import**: `import KoraPhase5Launch from './Kora_Phase5Launch'`

## Integration Options

### Option 1: Dedicated Route (Recommended)
Add to `frontend/src/App.tsx`:
```tsx
<Route path="/phase5-launch" element={<KoraPhase5Launch />} />
```

Add to sidebar in `frontend/src/components/layout/AppShell.tsx`:
```tsx
{ icon: "📋", label: "Phase 5 Spec", path: "/phase5-launch", key: "phase5" }
```

### Option 2: Modal/Drawer
```tsx
<button onClick={() => setShowPhase5Modal(true)}>View Phase 5 Brief</button>
{showPhase5Modal && (
  <div style={{ position:'fixed', inset:0, zIndex:9999 }}>
    <KoraPhase5Launch />
    <button onClick={() => setShowPhase5Modal(false)}>Close</button>
  </div>
)}
```

### Option 3: Tab in PlanningCenter
Add "Phase 5 Brief" as 4th tab option in existing PlanningCenter component.

## Key Features

### Three Navigation Tabs
1. **Overview** - Visual timeline of P5-P10, human moment, 6 KPI cards
2. **Deliverables** - All 15 work items by agent with effort estimates (32 hours total)
3. **Prompt** - Full specification for Agent A or Agent B (copy-to-clipboard)

### Agent Prompts
- **AGENT A (Backend)** - Database migration, Stripe client, payment service, routes, webhooks, AI worker, signal aggregator, tests
- **AGENT B (Frontend)** - Type contracts, API client extensions, CheckoutPanel, RCMDashboard, TransactionHistory, navigation wiring

### Copy Functionality
- Click "COPY PROMPT" button to copy entire specification to clipboard
- Button shows confirmation: "✓ COPIED" (2.2s feedback)
- Prompts are syntax-highlighted with color coding:
  - Teal: Dividers & KÓRA branding
  - Orange: Task labels
  - Blue: API endpoints
  - Green: SQL statements
  - Gray: Comments

## Visual Styling
- Dark theme (matches KORA existing UI)
- Monospace font: DM Mono / Fira Code fallback
- Animated status indicators and glow effects
- Responsive grid layout
- Scrollable prompt area

## Phase 5 Timeline
- **Duration**: 4 weeks (Weeks 1-4 of 32 total)
- **Current Phase**: Phase 5 (Payments)
- **Roadmap**: P5 → P6 (CRM) → P7 (Clinical) → P8 (Field+HR) → P9 (Mobile) → P10 (Ecosystem)

## Next Steps
1. Route the component to `/phase5-launch`
2. Both agents can view full spec by switching tabs and copying prompts
3. Agents sign off with `PHASE5_AGENT_A_REPORT.md` and `PHASE5_AGENT_B_REPORT.md`
4. Cross-check reports will verify API contracts match between backend/frontend
