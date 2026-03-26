# COMPONENT OWNERSHIP REGISTRY
## Team B vs Team C Boundaries

**Purpose**: Prevent duplicate components and routing conflicts  
**Enforcement**: Code review gates, automated checks  
**Last Updated**: 2024

---

## TEAM B: FRONTEND APPLICATION LAYER

### Owned Directories
```
frontend/src/components/ui/          ← Base UI components
frontend/src/components/forms/       ← Form framework
frontend/src/pages/clients/          ← Client CRUD
frontend/src/pages/bookings/         ← Booking CRUD
frontend/src/pages/services/         ← Service CRUD
frontend/src/pages/staff/            ← Staff CRUD
frontend/src/pages/categories/       ← Category CRUD
frontend/src/components/dashboard/   ← Dashboard primitives
frontend/src/components/widgets/     ← Live widgets
frontend/src/components/payments/    ← Payment UI (POS, gateway selector)
```

### Owned Components
- ✅ `Button.tsx` - Reusable button
- ✅ `Input.tsx` - Reusable input
- ✅ `Select.tsx` - Reusable select
- ✅ `Modal.tsx` - Reusable modal
- ✅ `Card.tsx` - Reusable card
- ✅ `Table.tsx` - Reusable table
- ✅ `FormLayout.tsx` - Form wrapper
- ✅ `FormSection.tsx` - Form section
- ✅ `FormField.tsx` - Form field
- ✅ `FormActions.tsx` - Form actions
- ✅ `FileUploader.tsx` - Unified file upload (merged from MediaUpload + DragDropUploader)
- ✅ `POSInterface.tsx` - Point-of-sale payment
- ✅ `LiveWidget.tsx` - Dashboard widget base
- ✅ `CrudTable.tsx` - CRUD table with actions
- ✅ `ActionToolbar.tsx` - Page action toolbar

### Owned Routes
```
/app/clients
/app/clients/create
/app/clients/:id/edit
/app/clients/:id

/app/bookings
/app/bookings/create
/app/bookings/:id/edit
/app/bookings/:id

/app/services
/app/services/create
/app/services/:id/edit
/app/services/:id

/app/staff
/app/staff/create
/app/staff/:id/edit
/app/staff/:id

/app/categories
/app/categories/create
/app/categories/:id/edit

/app/business-admin (dashboard)
/app/operations (dashboard)
/app/staff (dashboard)
/app/client (dashboard)
```

### Responsibilities
- ✅ All CRUD forms (Create/Edit pages)
- ✅ List pages with tables
- ✅ Detail/profile pages
- ✅ Action buttons (Create, Edit, Delete, Assign, Check-In, Check-Out, etc.)
- ✅ POS payment interface
- ✅ Dashboard widgets
- ✅ Base UI component library
- ✅ Form framework
- ✅ Workflow action buttons

### Forbidden Actions
- ❌ Cannot implement business logic
- ❌ Cannot create API endpoints
- ❌ Cannot modify database schema
- ❌ Cannot build external integrations (OAuth, webhooks, etc.)

---

## TEAM C: PLATFORM INTEGRATIONS

### Owned Directories
```
frontend/src/components/integrations/ ← Integration-specific UI
frontend/src/pages/social/            ← Social media features
frontend/src/pages/video/             ← Video consultation features
frontend/src/pages/ai/                ← AI analytics dashboards
frontend/src/services/meta/           ← Meta API integration
backend/src/modules/social/           ← Social backend
backend/src/modules/video/            ← Video backend
backend/src/services/meta/            ← Meta services
```

### Owned Components
- ✅ `SocialConnectionsPage.tsx` - OAuth connection management
- ✅ `SocialPostComposer.tsx` - Multi-platform post creation
- ✅ `VideoSessionPage.tsx` - Video consultation management
- ✅ `MarketplaceInsightsPage.tsx` - AI analytics dashboard
- ✅ `MetaConnect.tsx` - Meta OAuth flow
- ✅ `VideoCall.tsx` - Video call interface
- ✅ `RecordingPlayer.tsx` - Video playback

### Owned Routes
```
/app/business-admin/social-connections
/app/business-admin/social-posts
/app/business-admin/video-sessions
/app/business-admin/ai-insights
/app/business-admin/marketplace (AI-powered)
```

### Owned Backend Routes
```
POST /api/social/auth/connect
POST /api/social/auth/callback
POST /api/video/consultations/sessions
GET  /api/video/consultations/sessions
POST /api/video/consultations/sessions/:id/join
POST /api/video/consultations/sessions/:id/end
```

### Responsibilities
- ✅ Social OAuth connection screens
- ✅ Video consultation panels
- ✅ AI analytics dashboards
- ✅ External API integrations (Meta, Google, TikTok, Twitter)
- ✅ Webhook handlers
- ✅ Integration-specific UI surfaces
- ✅ Third-party SDK wrappers

### Forbidden Actions
- ❌ Cannot build CRUD forms for core entities (clients, bookings, services, staff)
- ❌ Cannot duplicate Team B components
- ❌ Cannot create routes without coordination
- ❌ Must use Team B's base UI components (Button, Input, Modal, etc.)
- ❌ Cannot create custom file upload components (use Team B's FileUploader)

---

## SHARED RESPONSIBILITIES

### Both Teams Must
- ✅ Follow theme system (use CSS variables only)
- ✅ Use TypeScript with proper types
- ✅ Write JSDoc comments for components
- ✅ Follow naming conventions
- ✅ Coordinate on new routes
- ✅ Use Team B's base UI components

### Shared Utilities
```
frontend/src/hooks/useAuth.ts        ← Both teams
frontend/src/hooks/useLiveData.ts    ← Both teams
frontend/src/services/api.ts         ← Both teams
frontend/src/types/                  ← Both teams
frontend/src/contexts/ThemeContext.tsx ← Both teams
```

---

## CONFLICT RESOLUTION PROCESS

### Before Creating a Component

1. **Check Registry**: Is this component already owned by another team?
2. **Check Existing**: Does a similar component already exist?
3. **Coordinate**: If overlap, discuss with other team
4. **Use Base Components**: Always use Team B's base UI components
5. **Document**: Add new component to this registry

### If Conflict Detected

1. **Identify Owner**: Check this registry
2. **Merge Components**: Combine features into single component
3. **Assign Owner**: Owner maintains component going forward
4. **Update Registry**: Document resolution

### Example: Media Upload Conflict

**Conflict**:
- Team B created `components/media/MediaUpload.tsx`
- Team C created `components/integrations/DragDropUploader.tsx`

**Resolution**:
- Merge into `components/ui/FileUploader.tsx`
- Team B owns component
- Team C uses it in integrations
- Delete duplicate components

---

## CODE REVIEW GATES

### Automated Checks (CI/CD)

```bash
# Block PR if:
- Duplicate component detected
- Hardcoded colors found (not using CSS variables)
- Inline styles exceed 50 lines
- Route conflicts with existing route
- Component created in wrong team's directory
```

### Manual Review Checklist

- [ ] Component ownership verified
- [ ] No duplicate components
- [ ] Uses base UI components
- [ ] Follows theme system
- [ ] TypeScript types complete
- [ ] JSDoc comments added
- [ ] Route coordination confirmed

---

## WEEKLY SYNC SCHEDULE

### Monday
- **Team B**: Share planned components for the week
- **Team C**: Share planned integrations for the week

### Tuesday
- **Architect**: Review plans for conflicts
- **Both Teams**: Discuss overlaps

### Wednesday
- **Architect**: Approve/reject plans
- **Both Teams**: Resolve conflicts before coding

### Thursday
- **Both Teams**: Code review and feedback

### Friday
- **Both Teams**: Merge approved PRs
- **Architect**: Update registry if needed

---

## COMPONENT MIGRATION PLAN

### Phase 1: Consolidate Duplicates (Week 1)
- [ ] Merge MediaUpload + DragDropUploader → FileUploader
- [ ] Verify no other duplicates
- [ ] Update all imports

### Phase 2: Create Base UI Library (Week 1-2)
- [ ] Button.tsx
- [ ] Input.tsx
- [ ] Select.tsx
- [ ] Modal.tsx
- [ ] Card.tsx
- [ ] Table.tsx

### Phase 3: Refactor Existing Pages (Week 2-3)
- [ ] Refactor CreateClientPage to use base components
- [ ] Refactor CreateBookingPage to use base components
- [ ] Refactor all Team B pages

### Phase 4: Team C Adoption (Week 3-4)
- [ ] Team C refactors to use Team B base components
- [ ] Remove any custom UI components from Team C
- [ ] Verify consistency

---

## ENFORCEMENT

### Pull Request Template

```markdown
## Component Ownership Check

- [ ] Component ownership verified in COMPONENT_OWNERSHIP.md
- [ ] No duplicate components created
- [ ] Uses Team B base UI components (if applicable)
- [ ] Follows theme system (CSS variables only)
- [ ] Route coordination confirmed (if new route)
- [ ] Updated COMPONENT_OWNERSHIP.md (if new component)

## Team Assignment
- [ ] Team B (Frontend Application Layer)
- [ ] Team C (Platform Integrations)
```

### Automated Linting

```json
// .eslintrc.json
{
  "rules": {
    "no-hardcoded-colors": "error",
    "use-base-components": "warn",
    "component-ownership": "error"
  }
}
```

---

## CONTACT

**Questions about ownership?**
- Slack: #kora-architecture
- Email: architect@kora.com
- Weekly sync: Wednesdays 2pm

**Conflict resolution?**
- Escalate to: Principal Software Architect
- Response time: 24 hours
- Decision is final

---

**Last Updated**: 2024  
**Next Review**: After Priority 1 tasks complete  
**Status**: ACTIVE
