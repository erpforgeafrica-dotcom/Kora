# PlanningCenter Integration Guide

## Overview
The `PlanningCenter` component is an interactive reference tool for the KÓRA Phases 5–10 implementation roadmap. It includes:
- Phase selector with deliverables
- 5 innovation moments
- Master prompt (copy-paste ready for AI agents)
- Live integration at `/planning` inside the existing `AppShell`

---

## Installation Steps

### 1. Verify File Structure
```
frontend/src/
├── data/
│   └── koraGapClosure.ts       ← Data source
├── components/
│   └── PlanningCenter.tsx       ← Component
└── App.tsx                      ← Main app
```

### 2. Live Integration State

The current workspace now includes:
- `frontend/src/App.tsx` route handling for `/planning`
- `frontend/src/components/layout/AppShell.tsx` sidebar navigation entry for `Planning`

If you want to move it later, these are still valid patterns:

#### Option A: Route
```tsx
// Current workspace pattern
if (pathname === "/planning") {
  content = <PlanningCenter />;
}
```

#### Option B: Modal/Drawer
```tsx
// Wrap in a modal component
import { Modal } from 'your-ui-lib';
import PlanningCenter from './components/PlanningCenter';

<Modal open={isPlanningOpen} onClose={() => setIsPlanningOpen(false)}>
  <PlanningCenter />
</Modal>
```

---

## Component API

### Props
Currently, `PlanningCenter` accepts no props (uses internal state).

### Styling
- Uses the app theme tokens from `index.css`
- Respects `AppShell`
- Responsive for narrow viewports
- Font: `'DM Mono', 'Fira Code', 'Courier New'`

### Customization Options

#### Change Initial Tab
```tsx
// Edit PlanningCenter.tsx, line 10
const [tab, setTab] = useState("phases"); // or "moments", "prompt"
```

#### Change Active Phase
```tsx
// Default starts at phase5, can change to phase6, phase7, etc.
const [activePhase, setActivePhase] = useState("phase5");
```

#### Modify Colors/Styling
Colors are defined in `koraGapClosure.ts` per phase:
```tsx
{
  id: "phase5",
  color: "#00e5c8",  // Teal — edit here
  // ...
}
```

---

## Key Features

### 1. Phase Selector (Left Sidebar)
- Click any phase to view details
- Left border highlight indicates active phase
- Shows phase number, subtitle, and timeline

### 2. Phase Detail (Right Pane)
- Main title + icon + timeline
- Empathy context quote
- 2-column grid of deliverables
- Build order checklist

### 3. Innovation Moments Tab
- 5 cards describing moments that earn loyalty
- Each linked to a phase
- Philosophy note at bottom

### 4. Master Prompt Tab
- Full 32-week implementation brief
- Syntax highlighting:
  - Phase headers: Purple
  - API endpoints: Blue
  - SQL statements: Green
  - Comments: Dark gray
- **Copy to Clipboard** button at top-right
- Line count display

---

## Data Structure

### Phase Interface
```typescript
interface Phase {
  id: string;           // "phase5", "phase6", etc.
  label: string;        // "PHASE 5"
  subtitle: string;     // "Payment Infrastructure"
  weeks: string;        // "Weeks 1–4"
  color: string;        // hex color
  icon: string;         // Unicode symbol
  domains: string[];    // deliverable categories
  why: string;          // empathy statement
}
```

### Moment Interface
```typescript
interface Moment {
  title: string;        // "The Pre-Appointment Brief"
  icon: string;         // Unicode symbol
  color: string;        // hex color
  desc: string;         // detailed description
}
```

---

## Integration with Existing Systems

### AI Agent Briefing
1. In PlanningCenter, click **COPY PROMPT** (top-right)
2. Paste into agent briefing document
3. Agent now has full context for implementing Phase N

### Dashboard Indicator
Add a badge showing current implementation status:
```tsx
// frontend/src/components/StatusBadge.tsx
<div style={{ color: "#00e5c8", fontSize: 10 }}>
  ▸ Currently Building: Phase 5 (Payment Infrastructure)
</div>
```

### Navigation Entry
Add to main navigation:
```tsx
{
  label: "Implementation Plan",
  href: "/planning",
  icon: "📋"
}
```

---

## Troubleshooting

### Component Not Rendering
**Problem:** Blank screen after navigation  
**Solution:** Verify import path is correct `../data/koraGapClosure`

### Copy Button Not Working
**Problem:** "COPY PROMPT" button doesn't copy  
**Solution:** Ensure HTTPS in production (clipboard API requires secure context)

### Styling Looks Off
**Problem:** Colors not displaying correctly  
**Solution:** 
- Verify dark theme is active in parent container
- Check CSS not overriding inline styles
- Verify font files are loaded

### Tab Switching Doesn't Work
**Problem:** Tabs don't respond to clicks  
**Solution:** Check browser console for React errors; state management may be blocked

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (responsive)

**Note:** Clipboard API (`navigator.clipboard`) requires HTTPS or localhost

---

## Development Notes

### State Management
Uses React `useState` hooks only. No external state needed.

### Performance
- Rendering is local-only with no API calls
- Prompt lines are memoized once per mount
- Tab switching is effectively instant for this data size

### Accessibility
- Keyboard navigation through all actionable controls
- `type="button"` on actions to avoid accidental form submit behavior
- Clipboard falls back when `navigator.clipboard` is unavailable

---

## Extending the Component

### Add a New Phase (Phase 11)
1. Edit `frontend/src/data/koraGapClosure.ts`
2. Add to PHASES array:
```typescript
{
  id: "phase11",
  label: "PHASE 11",
  subtitle: "Your Phase Name",
  weeks: "Weeks 33–40",
  color: "#your-color",
  icon: "◈",
  domains: ["Domain 1", "Domain 2"],
  why: "Why this phase matters..."
}
```
3. It automatically appears in the selector

### Add a New Moment
1. Edit `frontend/src/data/koraGapClosure.ts`
2. Add to INNOVATION_MOMENTS array:
```typescript
{
  title: "Your Moment Title",
  icon: "◈",
  color: "#your-color",
  desc: "Your moment description..."
}
```
3. It automatically appears in the Moments tab

### Update the Master Prompt
1. Edit `MASTER_PROMPT` in `koraGapClosure.ts`
2. Changes appear immediately in the Prompt tab
3. Syntax highlighting updates automatically

---

## Performance & Deployment

### Bundle Size
Exact minified size depends on the current Vite build. Verify with `npm run build` if you need a measured figure.

### Production Checklist
- [ ] Test copy-paste in browser (HTTPS required)
- [ ] Verify monospace font loads
- [ ] Check mobile responsiveness (overflow handling)
- [ ] Test all tab switching
- [ ] Confirm syntax highlighting loads

---

## Support & Updates

### Updating the Brief
Phases 5–10 brief updates should be made in `koraGapClosure.ts`:
```typescript
export const MASTER_PROMPT = `
// Update your brief here
`;
```

### Version History
- **v1.0** (2026-03-06): Initial 6-phase roadmap, 3-tab interface

---

**Questions?** Refer to master brief in PlanningCenter → PROMPT tab
