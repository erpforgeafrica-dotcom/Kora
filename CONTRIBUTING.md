# Contributing to KÓRA Platform

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL + Redis)
- Git

### Setup
```bash
# 1. Clone and install
git clone <repo>
cd KORA
npm install

# 2. Start infrastructure
docker compose up -d postgres redis

# 3. Setup backend
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed

# 4. Setup frontend
cd ../frontend
npm install

# 5. Start dev servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend (single instance)
cd frontend && npm run dev
```

### Access Dashboards
- Landing: http://localhost:5174/
- Client: http://localhost:5174/app/client?role=client
- Business Admin: http://localhost:5174/app/business-admin?role=business_admin
- Staff: http://localhost:5174/app/staff?role=staff
- Operations: http://localhost:5174/app/operations?role=operations
- Platform Admin: http://localhost:5174/app/kora-admin?role=platform_admin

## Troubleshooting

### Docker Issues
**Error**: `unable to get image` or `pipe/dockerDesktopLinuxEngine`
- **Fix**: Start Docker Desktop, wait for engine to initialize

**Error**: `ECONNREFUSED 127.0.0.1:5432`
- **Fix**: `docker compose up -d postgres redis`

### Disk Space Issues
**Error**: Vite fails to start or crashes randomly
- **Fix**: Clear caches:
```bash
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist backend/dist
npm cache clean --force
```

### Port Conflicts
**Error**: `EADDRINUSE` on port 3000 or 5173
- **Fix**: Kill existing processes:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Unix
lsof -ti:3000 | xargs kill -9
```

## Team Structure

### Team B: Frontend Application Layer
**Owns**: CRUD forms, base UI components, dashboards, POS interface

**Directories**:
- `frontend/src/components/ui/` - Base components
- `frontend/src/components/forms/` - Form framework
- `frontend/src/pages/clients/` - Client CRUD
- `frontend/src/pages/bookings/` - Booking CRUD
- `frontend/src/pages/services/` - Service CRUD
- `frontend/src/pages/staff/` - Staff CRUD

**Responsibilities**:
- ✅ Create/Edit/Delete forms
- ✅ List pages with tables
- ✅ Action buttons (Check-In, Assign, etc.)
- ✅ Base UI library (Button, Input, Modal, etc.)
- ❌ Cannot build external integrations

### Team C: Platform Integrations
**Owns**: Social OAuth, video consultations, AI dashboards, external APIs

**Directories**:
- `frontend/src/pages/social/` - Social features
- `frontend/src/pages/video/` - Video features
- `frontend/src/pages/ai/` - AI dashboards
- `backend/src/modules/social/` - Social backend
- `backend/src/services/meta/` - Meta API

**Responsibilities**:
- ✅ OAuth connection screens
- ✅ Video consultation panels
- ✅ AI analytics dashboards
- ✅ External API integrations
- ❌ Cannot build CRUD forms for core entities
- ❌ Must use Team B's base UI components

## Development Workflow

### Before Creating a Component
1. Check `COMPONENT_OWNERSHIP.md` for ownership
2. Search codebase for similar components
3. Coordinate with other team if overlap
4. Use existing base components
5. Follow theme system (CSS variables only)

### Pull Request Checklist
- [ ] Component ownership verified
- [ ] No duplicate components
- [ ] Uses base UI components (if applicable)
- [ ] Follows theme system (no hardcoded colors)
- [ ] TypeScript types complete
- [ ] JSDoc comments added
- [ ] Route coordination confirmed (if new route)
- [ ] Tests added (if applicable)

### Code Review Gates
❌ Block if:
- Duplicate component detected
- Hardcoded colors found
- Inline styles exceed 50 lines
- Route conflicts with existing route
- Component in wrong team's directory

## Architecture Patterns

### Creating a New Route
```typescript
// backend/src/modules/mymodule/routes.ts
import { Router } from "express";
import { getRequiredOrganizationId } from "../../shared/http.js";

export const myRoutes = Router();

myRoutes.get("/", async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res, req.header("x-org-id"));
    // Your logic
    res.json({ data: [] });
  } catch (err) {
    next(err);
  }
});
```

### Using Theme System
```tsx
// ✅ CORRECT
<button style={{ 
  background: "var(--color-accent)",
  color: "var(--color-bg)",
  border: "1px solid var(--color-border)"
}}>
  Click Me
</button>

// ❌ WRONG
<button style={{ 
  background: "#00e5c8",
  color: "#0c0e14"
}}>
  Click Me
</button>
```

### Multi-Tenancy Pattern
```typescript
// Always validate organization context
const orgId = getRequiredOrganizationId(res, req.header("x-org-id"));

// Include in all queries
const clients = await queryDb(
  "SELECT * FROM clients WHERE org_id = $1",
  [orgId]
);
```

## Testing

### Run Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### E2E Tests (Planned)
```bash
npm run test:e2e
```

## Documentation

### Key Files
- `README.md` - Project overview
- `.github/copilot-instructions.md` - AI assistant guidelines
- `COMPONENT_OWNERSHIP.md` - Team boundaries
- `SYSTEM_INTEGRITY_REVIEW.md` - Architecture audit
- `TEAM_C_IMPLEMENTATION.md` - Integration status

### Architecture Decision Records
See `docs/adr/` for key architectural decisions.

## Performance

### Best Practices
- Use React.memo for expensive components
- Lazy load routes (already implemented)
- Virtualize long lists (100+ rows)
- Cache API responses (use React Query)
- Optimize images (WebP, lazy loading)

### Performance Budgets
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Getting Help

### Resources
- Architecture docs: `SYSTEM_INTEGRITY_REVIEW.md`
- Component ownership: `COMPONENT_OWNERSHIP.md`
- API patterns: `.github/copilot-instructions.md`

### Contact
- Slack: #kora-dev
- Issues: GitHub Issues
- Architecture questions: Principal Software Architect

## License
[Your License]
