# KORA ENTERPRISE SYSTEM CONSTITUTION
## Master Orchestrator Prompt for AI-Driven Development

**Version**: 1.0  
**Status**: ACTIVE GOVERNANCE  
**Last Updated**: Phase 8 Complete  
**Authority**: CTO / Engineering Leadership

---

## I. FOUNDATIONAL PRINCIPLES

### A. Workflow-First Architecture
- **No page-first development**: Every feature begins with workflow definition, not UI mockups
- **Schema → API → Logic → UI → Roles → Integration**: This is the only valid sequence
- **Workflow as source of truth**: All modules derive from documented business workflows
- **No disconnected features**: Every component must integrate into at least one complete workflow

### B. Enterprise-Grade Standards
- **Multi-tenant by design**: Every schema, API, and feature must support multiple organizations
- **Role-based enforcement**: Access control embedded in API layer, not frontend
- **Audit trails mandatory**: All state changes logged with actor, timestamp, reason
- **Data consistency**: Transactional integrity across all operations
- **No fake data**: All dashboards display real, queryable data from actual workflows

### C. Business Domain Focus
- **Service Booking**: Appointment scheduling, availability management, cancellation workflows
- **Telemedicine**: Video sessions, clinical records, provider-patient workflows
- **Emergency Dispatch**: Real-time location tracking, priority routing, incident management
- **Multi-role Operations**: Client, Staff, Business Admin, Operations, Platform Admin

---

## II. MODULE VALIDATION CHECKLIST

**Every module must satisfy ALL of these before merge:**

### 1. Schema Layer ✓
- [ ] Database schema defined (migrations included)
- [ ] Multi-tenant isolation enforced (organization_id on all tables)
- [ ] Audit columns present (created_at, updated_at, created_by, updated_by)
- [ ] Soft deletes implemented where appropriate
- [ ] Indexes on foreign keys and common filters
- [ ] Constraints enforce business rules (NOT NULL, UNIQUE, CHECK)
- [ ] Schema documented in SCHEMA.md

### 2. API Layer ✓
- [ ] REST endpoints defined (GET, POST, PATCH, DELETE)
- [ ] Request/response schemas documented (OpenAPI/Swagger)
- [ ] Authentication required on all endpoints
- [ ] Authorization checks on every operation
- [ ] Input validation with clear error messages
- [ ] Pagination implemented for list endpoints
- [ ] Filtering/sorting on common fields
- [ ] Rate limiting configured
- [ ] API documented in API.md

### 3. Backend Logic ✓
- [ ] Business rules implemented in service layer
- [ ] Workflow state transitions validated
- [ ] Side effects (notifications, webhooks) triggered
- [ ] Error handling with specific error codes
- [ ] Logging at INFO/WARN/ERROR levels
- [ ] Unit tests for critical paths (>80% coverage)
- [ ] Integration tests for workflows
- [ ] Logic documented in LOGIC.md

### 4. Frontend Operational UI ✓
- [ ] List page with search, filter, sort, pagination
- [ ] Detail page showing all relevant data
- [ ] Create form with validation
- [ ] Edit form with change tracking
- [ ] Delete with confirmation and audit trail
- [ ] Bulk operations where applicable
- [ ] Status indicators and badges
- [ ] Loading states and error handling
- [ ] Keyboard shortcuts for power users
- [ ] Responsive design (desktop + tablet)
- [ ] UI documented in COMPONENTS.md

### 5. Role Enforcement ✓
- [ ] Role matrix defined (who can do what)
- [ ] API enforces role checks
- [ ] Frontend hides unavailable actions
- [ ] Audit log shows role of actor
- [ ] Role-based data filtering (users see only their org's data)
- [ ] Roles documented in ROLES.md

### 6. Workflow Integration ✓
- [ ] Module participates in at least one complete workflow
- [ ] Workflow diagram created (Mermaid or similar)
- [ ] State transitions documented
- [ ] Integration points with other modules identified
- [ ] Workflow tested end-to-end
- [ ] Workflow documented in WORKFLOWS.md

---

## III. DIRECTORY STRUCTURE & NAMING

### Backend Structure
```
backend/src/
├── modules/
│   ├── bookings/
│   │   ├── schema.ts              # Database schema
│   │   ├── types.ts               # TypeScript types
│   │   ├── service.ts             # Business logic
│   │   ├── controller.ts          # HTTP handlers
│   │   ├── routes.ts              # Route definitions
│   │   ├── middleware.ts          # Auth/validation
│   │   ├── tests/
│   │   │   ├── service.test.ts
│   │   │   ├── controller.test.ts
│   │   │   └── integration.test.ts
│   │   └── docs/
│   │       ├── SCHEMA.md
│   │       ├── API.md
│   │       ├── LOGIC.md
│   │       ├── ROLES.md
│   │       └── WORKFLOWS.md
│   └── [other modules...]
├── shared/
│   ├── types.ts                   # Global types
│   ├── middleware.ts              # Global middleware
│   ├── errors.ts                  # Error definitions
│   └── utils.ts                   # Utilities
└── migrations/
    └── [numbered migrations]
```

### Frontend Structure
```
frontend/src/
├── pages/
│   ├── [module]/
│   │   ├── ListPage.tsx           # List with search/filter/sort
│   │   ├── DetailPage.tsx         # Read-only detail view
│   │   ├── CreatePage.tsx         # Create form
│   │   ├── EditPage.tsx           # Edit form
│   │   └── docs/
│   │       ├── COMPONENTS.md
│   │       ├── WORKFLOWS.md
│   │       └── ROLES.md
│   └── [other modules...]
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── layout/                    # Layout components
│   └── [module-specific]/
├── hooks/
│   ├── useCrud.ts                 # Generic CRUD
│   ├── useWorkflow.ts             # Workflow state management
│   └── [module-specific]/
└── utils/
    ├── api.ts                     # API client
    └── [module-specific]/
```

---

## IV. DOCUMENTATION REQUIREMENTS

### Every Module Must Include:

#### SCHEMA.md
```markdown
# [Module] Schema

## Tables
- table_name: description, multi-tenant isolation, audit columns

## Relationships
- foreign key definitions
- cascade rules

## Indexes
- performance-critical indexes

## Constraints
- business rule constraints
```

#### API.md
```markdown
# [Module] API

## Endpoints
- GET /api/[module] - List with pagination
- GET /api/[module]/:id - Detail
- POST /api/[module] - Create
- PATCH /api/[module]/:id - Update
- DELETE /api/[module]/:id - Delete

## Request/Response Examples
- Curl examples for each endpoint
- Error responses

## Authentication & Authorization
- Required roles for each endpoint
```

#### LOGIC.md
```markdown
# [Module] Business Logic

## Workflows
- State transitions
- Validation rules
- Side effects

## Error Handling
- Error codes and meanings
- Recovery strategies

## Performance Considerations
- Query optimization
- Caching strategy
```

#### ROLES.md
```markdown
# [Module] Role Matrix

| Role | List | Create | Read | Update | Delete |
|------|------|--------|------|--------|--------|
| client | Own only | No | Own only | Own only | No |
| staff | Org | Yes | Org | Org | No |
| business_admin | Org | Yes | Org | Org | Yes |
| operations | All | Yes | All | All | Yes |
| platform_admin | All | Yes | All | All | Yes |
```

#### WORKFLOWS.md
```markdown
# [Module] Workflows

## Workflow: [Name]
- Actors: [roles involved]
- Steps: [numbered steps]
- State transitions: [diagram]
- Integration points: [other modules]
- Error scenarios: [what can go wrong]
```

#### COMPONENTS.md (Frontend)
```markdown
# [Module] Components

## Pages
- ListPage: search, filter, sort, pagination
- DetailPage: read-only view
- CreatePage: form with validation
- EditPage: form with change tracking

## Features
- Keyboard shortcuts
- Bulk operations
- Export functionality
```

---

## V. DEVELOPMENT WORKFLOW

### Phase 1: Design (Before Code)
1. **Define Workflow**: Document business process with actors, steps, state transitions
2. **Create Schema**: Design database tables with multi-tenant isolation
3. **Plan API**: Define endpoints, request/response schemas, error codes
4. **Specify Roles**: Create role matrix for access control
5. **Design UI**: Sketch pages (list, detail, create, edit)
6. **Get Approval**: CTO/PM review before implementation

### Phase 2: Backend Implementation
1. **Create Schema**: Migrations, indexes, constraints
2. **Implement Service**: Business logic, validation, error handling
3. **Build API**: Controllers, routes, middleware
4. **Add Tests**: Unit tests (>80% coverage), integration tests
5. **Document**: SCHEMA.md, API.md, LOGIC.md, ROLES.md, WORKFLOWS.md
6. **Code Review**: Peer review, CTO approval

### Phase 3: Frontend Implementation
1. **Build Pages**: List, Detail, Create, Edit
2. **Integrate API**: Use useCrud hook, handle loading/error states
3. **Add Features**: Search, filter, sort, bulk operations
4. **Implement Roles**: Hide unavailable actions, show role-based UI
5. **Add Tests**: Component tests, integration tests
6. **Document**: COMPONENTS.md, WORKFLOWS.md, ROLES.md
7. **Code Review**: Peer review, CTO approval

### Phase 4: Integration Testing
1. **End-to-End Workflow**: Test complete workflow across modules
2. **Multi-Tenant**: Verify data isolation between organizations
3. **Role-Based Access**: Test all role combinations
4. **Error Scenarios**: Test error handling and recovery
5. **Performance**: Load testing, query optimization
6. **Security**: Penetration testing, vulnerability scan

### Phase 5: Deployment
1. **Staging**: Deploy to staging environment
2. **Smoke Tests**: Verify critical workflows
3. **Performance Baseline**: Establish metrics
4. **Production**: Deploy with monitoring
5. **Rollback Plan**: Ready to revert if issues

---

## VI. CODE QUALITY STANDARDS

### Backend (Node.js/TypeScript)
```typescript
// ✓ GOOD: Clear, typed, documented
async function createBooking(
  organizationId: string,
  payload: CreateBookingRequest,
  actor: User
): Promise<Booking> {
  // Validate input
  validateCreateBookingRequest(payload);
  
  // Check authorization
  if (!actor.canCreateBooking(organizationId)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // Execute business logic
  const booking = await bookingService.create(organizationId, payload);
  
  // Trigger side effects
  await notificationService.sendBookingConfirmation(booking);
  await auditService.log(organizationId, 'booking.created', booking.id, actor.id);
  
  return booking;
}

// ✗ BAD: Unclear, untyped, no error handling
async function createBooking(req, res) {
  const booking = await db.query('INSERT INTO bookings ...');
  res.json(booking);
}
```

### Frontend (React/TypeScript)
```typescript
// ✓ GOOD: Typed, error handling, loading states
function BookingsList() {
  const { data, loading, error, deleteItem } = useCrud<Booking>('/api/bookings');
  const { showToast } = useToast();
  
  if (loading) return <SkeletonTable rows={8} />;
  if (error) return <ErrorState message={error} />;
  
  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      showToast('Booking deleted', 'success');
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };
  
  return <DataTable columns={columns} data={data} />;
}

// ✗ BAD: No error handling, no loading state
function BookingsList() {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(setBookings);
  }, []);
  return <table>{bookings.map(...)}</table>;
}
```

---

## VII. TESTING REQUIREMENTS

### Backend Testing
- **Unit Tests**: >80% coverage of service layer
- **Integration Tests**: Complete workflows
- **API Tests**: All endpoints with valid/invalid inputs
- **Security Tests**: Authorization checks, SQL injection, XSS
- **Performance Tests**: Query optimization, load testing

### Frontend Testing
- **Component Tests**: Render, user interactions
- **Integration Tests**: Multi-component workflows
- **E2E Tests**: Complete user journeys
- **Accessibility Tests**: WCAG AA compliance
- **Performance Tests**: Lighthouse scores >90

### Test Command
```bash
# Backend
npm run test:unit
npm run test:integration
npm run test:coverage

# Frontend
npm run test:components
npm run test:e2e
npm run test:a11y
npm run test:lighthouse
```

---

## VIII. DEPLOYMENT GATES

**Module cannot be deployed to production unless:**

- [ ] All tests passing (>80% coverage)
- [ ] Code review approved by 2 engineers
- [ ] CTO approval obtained
- [ ] Documentation complete and reviewed
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Staging deployment successful
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured
- [ ] Stakeholder sign-off received

---

## IX. ANTI-PATTERNS (FORBIDDEN)

### ✗ DO NOT DO THIS

1. **Placeholder Pages**: No "Coming Soon" or fake dashboards
2. **Disconnected Modules**: Every feature must integrate into a workflow
3. **Fake Data**: All dashboards show real data from actual workflows
4. **Duplicate Code**: Use shared components and utilities
5. **Untyped Code**: TypeScript required everywhere
6. **No Error Handling**: Every async operation must handle errors
7. **Missing Tests**: No code without tests
8. **Undocumented APIs**: Every endpoint must be documented
9. **Role Bypass**: No frontend-only authorization
10. **Hardcoded Values**: All configuration externalized

---

## X. ORCHESTRATOR DIRECTIVES FOR AI AGENTS

### When Building Any Feature:

1. **START WITH WORKFLOW**: Define business process before code
2. **VALIDATE AGAINST CHECKLIST**: Use Module Validation Checklist
3. **FOLLOW STRUCTURE**: Use prescribed directory structure
4. **DOCUMENT EVERYTHING**: Create all required .md files
5. **TEST THOROUGHLY**: >80% coverage, integration tests
6. **ENFORCE ROLES**: API-layer authorization, not frontend
7. **MULTI-TENANT FIRST**: Every query filters by organization_id
8. **AUDIT TRAIL**: Log all state changes
9. **ERROR HANDLING**: Specific error codes, clear messages
10. **PERFORMANCE**: Query optimization, caching strategy

### When Reviewing Code:

1. **Check Workflow**: Does it fit into a documented workflow?
2. **Verify Schema**: Multi-tenant isolation, audit columns?
3. **Validate API**: Authentication, authorization, validation?
4. **Test Coverage**: >80% coverage, integration tests?
5. **Documentation**: All required .md files present?
6. **Role Enforcement**: API-layer checks, not frontend?
7. **Error Handling**: Specific codes, clear messages?
8. **Performance**: Optimized queries, caching?
9. **Security**: No SQL injection, XSS, auth bypass?
10. **Consistency**: Follows established patterns?

### When Deploying:

1. **Staging First**: Deploy to staging, run smoke tests
2. **Monitor Closely**: Watch error rates, performance metrics
3. **Rollback Ready**: Have previous version ready to deploy
4. **Communicate**: Notify stakeholders of deployment
5. **Verify**: Test critical workflows in production
6. **Document**: Update deployment log with timestamp, version

---

## XI. CURRENT SYSTEM STATE

### Completed (Production Ready)
- ✅ Frontend rebuild (8 phases, 100% complete)
- ✅ Navigation system (single source of truth)
- ✅ Component library (15+ reusable components)
- ✅ CRUD operations (Clients, Bookings, Services, Staff)
- ✅ Search & filtering (debounced, advanced filters)
- ✅ Bulk operations (multi-select, export)
- ✅ Keyboard shortcuts (Cmd+K command palette)
- ✅ Error handling (ErrorBoundary, toast notifications)
- ✅ Documentation (comprehensive README, API docs)

### In Progress
- 🔄 Backend API completion (all modules)
- 🔄 Multi-tenant enforcement (all endpoints)
- 🔄 Role-based access control (all operations)
- 🔄 Audit logging (all state changes)

### Not Started
- ⏳ Telemedicine module (video sessions, clinical records)
- ⏳ Emergency dispatch (real-time tracking, routing)
- ⏳ Advanced analytics (dashboards, reports)
- ⏳ Automation workflows (triggers, actions)

---

## XII. NEXT PRIORITIES

### Immediate (This Sprint)
1. **Complete Backend API**: All CRUD endpoints for core modules
2. **Enforce Multi-Tenancy**: Add organization_id checks to all queries
3. **Implement Role-Based Access**: API-layer authorization
4. **Add Audit Logging**: Track all state changes
5. **Integration Testing**: End-to-end workflow tests

### Short-Term (Next 2 Sprints)
1. **Telemedicine Module**: Video sessions, clinical records
2. **Emergency Dispatch**: Real-time tracking, priority routing
3. **Advanced Filtering**: Date ranges, multi-select filters
4. **Bulk Operations**: Bulk delete, bulk export, bulk update
5. **Performance Optimization**: Query optimization, caching

### Medium-Term (Next Quarter)
1. **Analytics Dashboard**: Real-time metrics, reports
2. **Automation Workflows**: Triggers, actions, scheduling
3. **Mobile App**: React Native for iOS/Android
4. **API Documentation**: OpenAPI/Swagger, interactive docs
5. **Performance Monitoring**: Sentry, Web Vitals, custom metrics

---

## XIII. GOVERNANCE & ESCALATION

### Decision Authority
- **CTO**: Architecture, technology choices, deployment gates
- **PM**: Feature prioritization, business requirements
- **Tech Lead**: Code quality, testing standards, documentation
- **Team**: Implementation details, code review

### Escalation Path
1. **Technical Blocker**: Escalate to Tech Lead
2. **Architecture Question**: Escalate to CTO
3. **Business Requirement**: Escalate to PM
4. **Deployment Issue**: Escalate to DevOps Lead

### Communication
- **Daily**: Standup (15 min)
- **Weekly**: Sprint planning, retrospective
- **Bi-weekly**: Architecture review
- **Monthly**: Stakeholder update

---

## XIV. AMENDMENT PROCESS

This constitution can be amended by:
1. **CTO Proposal**: Document proposed change
2. **Team Review**: 1-week review period
3. **Consensus**: 80% team agreement required
4. **Documentation**: Update this document
5. **Communication**: Announce to all teams

---

## XV. ENFORCEMENT

**Violations of this constitution:**
- Code review rejection (must fix before merge)
- Deployment gate failure (cannot deploy)
- Architecture review failure (must redesign)
- Escalation to CTO (potential disciplinary action)

**Compliance is mandatory for all development.**

---

**APPROVED BY**: CTO / Engineering Leadership  
**EFFECTIVE DATE**: Phase 8 Complete  
**NEXT REVIEW**: End of Q1 2024

**This constitution is the source of truth for all KORA development.**
