# KORA IMPLEMENTATION ROADMAP - MENU FUNCTION BUILD SEQUENCE

**Status**: READY TO BUILD  
**Start Date**: Immediate  
**Estimated Duration**: 12-16 weeks (3-4 months)  
**Team Required**: 8-10 developers  

---

## PHASE 0: PREPARATION (Week -1)

### 0.1 Codebase Organization
```bash
# Create module structure
mkdir -p src/modules/{finance,procurement,inventory,crm,sales,hrm,marketing,support,fieldops,assets,documents,projects,quality,compliance,analytics,knowledge,partnerships,esg}

# Create service layer
mkdir -p src/services/{finance,procurement,inventory,crm,sales,hrm,marketing,support,fieldops,assets,documents,projects,quality,compliance,analytics,knowledge,partnerships,esg}

# Create repository layer
mkdir -p src/db/repositories

# Create API routes
mkdir -p src/routes/{finance,procurement,inventory,crm,sales,hrm,marketing,support,fieldops,assets,documents,projects,quality,compliance,analytics,knowledge,partnerships,esg}

# Create forms
mkdir -p src/components/forms/{finance,procurement,inventory,crm,sales,hrm,marketing,support,fieldops,assets,documents,projects,quality,compliance,analytics,knowledge,partnerships,esg}

# Create dashboards
mkdir -p src/components/dashboards/{finance,procurement,inventory,crm,sales,hrm,marketing,support,fieldops,assets,documents,projects,quality,compliance,analytics,knowledge,partnerships,esg}
```

### 0.2 Database Connection Pool Setup
- [ ] Increase connection pool (Supabase/PostgreSQL)
- [ ] Set up read replicas for analytics
- [ ] Configure backup strategy
- [ ] Set up migration versioning

### 0.3 Testing Infrastructure
- [ ] Set up Jest + Vitest for unit tests
- [ ] Set up integration test database
- [ ] Set up API test fixtures
- [ ] Set up E2E test framework

### 0.4 CI/CD Pipeline
- [ ] Update GitHub Actions for larger test suite
- [ ] Set up database migration CI step
- [ ] Set up performance benchmarks

---

## PHASE 1: TIER 1 - REGISTRATION & VERIFICATION (Weeks 1-2)

### 1.1 Database Migrations

```sql
-- Run these migrations
001_genesis_full_schema.sql (EXISTING)
002_rbac_permissions.sql (EXISTING)
003_verification_forms.sql (NEW)

-- New tables:
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY,
  entity_id UUID,
  entity_type ENUM('company', 'individual'),
  document_type ENUM('cac', 'tax', 'id', 'passport', 'license', 'utility_bill'),
  file_url TEXT,
  ocr_result JSONB,
  verified_by UUID,
  verified_at TIMESTAMP,
  status ENUM('pending', 'verified', 'rejected'),
  created_at TIMESTAMP
);

CREATE TABLE verification_status (
  id UUID PRIMARY KEY,
  entity_id UUID,
  entity_type ENUM('company', 'individual'),
  status ENUM('pending', 'under_review', 'verified', 'rejected'),
  fraud_score NUMERIC,
  blockchain_hash VARCHAR,
  verification_deadline TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE biometric_enrollments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  face_template BYTEA,
  face_confidence NUMERIC,
  fingerprint_template BYTEA,
  fingerprint_confidence NUMERIC,
  enrolled_at TIMESTAMP,
  verified_at TIMESTAMP,
  status ENUM('pending', 'enrolled', 'verified')
);
```

### 1.2 Register Service Implementation

```typescript
// src/services/registration/VerificationService.ts
export class VerificationService {
  
  async verifyCompany(input: CompanyVerificationInput): Promise<VerificationResult> {
    // 1. Validate CAC registration
    // 2. Validate tax registration
    // 3. Verify directors
    // 4. Check for fraud flags
    // 5. Generate blockchain hash
    // 6. Send to audit queue
  }
  
  async verifyFreelancer(input: FreelancerVerificationInput): Promise<VerificationResult> {
    // 1. Validate identity document
    // 2. Verify biometrics
    // 3. Check background
    // 4. Verify certifications
    // 5. Generate blockchain hash
  }
  
  async uploadDocument(userId: string, documentType: string, file: File): Promise<Document> {
    // 1. Validate file
    // 2. Store in cloud storage
    // 3. Run OCR
    // 4. Extract data
    // 5. Return extracted data
  }
  
  async enrollBiometric(userId: string, type: 'face' | 'fingerprint', template: Uint8Array): Promise<void> {
    // 1. Store template
    // 2. Calculate confidence
    // 3. Flag for verification
  }
  
  async verifyBiometric(userId: string, biometric: Uint8Array): Promise<boolean> {
    // 1. Compare with stored template
    // 2. Check confidence threshold
    // 3. Return match result
  }
}
```

### 1.3 Forms Implementation

```typescript
// src/components/forms/CompanyVerificationForm.tsx
export function CompanyVerificationForm() {
  return (
    <form className="space-y-8">
      {/* Section A: Business Identity */}
      <FormSection title="Business Identity">
        <Input label="Legal Name" name="legal_name" required />
        <Input label="Trade Name" name="trade_name" />
        <Input label="Registration Number" name="registration_number" required />
        <Input label="Tax Number" name="tax_number" required />
        <Select label="Country" name="country" options={countries} required />
        <DateInput label="Date Established" name="date_established" required />
      </FormSection>
      
      {/* Section B: Business Address */}
      <FormSection title="Business Address">
        <Input label="Head Office Address" name="head_office_address" required />
        <Input label="State/Province" name="state" required />
        <Input label="City" name="city" required />
        <Input label="Postal Code" name="postal_code" />
        <Input label="GPS Coordinates" name="gps_coordinates" />
      </FormSection>
      
      {/* Section C: Ownership */}
      <FormSection title="Ownership Information">
        <Input label="Owner Name" name="owner_name" required />
        <Input label="Director Name" name="director_name" />
        <Input label="Shareholding %" name="shareholding_percent" />
        <Select label="Nationality" name="nationality" options={countries} required />
      </FormSection>
      
      {/* Section D: Document Uploads */}
      <FormSection title="Business Verification Documents">
        <FileUpload label="Certificate of Incorporation" name="cac_certificate" accept=".pdf,.jpg,.png" required />
        <FileUpload label="Business License" name="business_license" accept=".pdf,.jpg,.png" required />
        <FileUpload label="Tax Certificate" name="tax_certificate" accept=".pdf,.jpg,.png" required />
        <FileUpload label="Proof of Address" name="proof_of_address" accept=".pdf,.jpg,.png,.bill" required />
        <FileUpload label="Insurance Certificate" name="insurance_certificate" accept=".pdf,.jpg,.png" />
        <FileUpload label="Industry Permits" name="industry_permits" accept=".pdf,.jpg,.png" />
      </FormSection>
      
      {/* Section E: Identity Verification */}
      <FormSection title="Identity Verification">
        <FileUpload label="National ID Copy" name="national_id" accept=".pdf,.jpg,.png" required />
        <FileUpload label="Passport Copy" name="passport" accept=".pdf,.jpg,.png" />
        <BiometricCapture label="Face Scan" name="face_biometric" required />
        <BiometricCapture label="Fingerprint" name="fingerprint_biometric" required />
      </FormSection>
      
      <button type="submit">Submit for Verification</button>
    </form>
  );
}
```

### 1.4 Routes Implementation

```typescript
// src/routes/auth/routes.ts
router.post('/verify/company', authenticate, async (req, res) => {
  const result = await verificationService.verifyCompany(req.body);
  res.json(result);
});

router.post('/verify/freelancer', authenticate, async (req, res) => {
  const result = await verificationService.verifyFreelancer(req.body);
  res.json(result);
});

router.post('/verify/upload-document', authenticate, async (req, res) => {
  const doc = await verificationService.uploadDocument(req.user.id, req.body.type, req.files.document);
  res.json(doc);
});

router.post('/verify/biometric/enroll', authenticate, async (req, res) => {
  await verificationService.enrollBiometric(req.user.id, req.body.type, req.body.template);
  res.json({ success: true });
});

router.post('/verify/biometric/verify', authenticate, async (req, res) => {
  const match = await verificationService.verifyBiometric(req.user.id, req.body.biometric);
  res.json({ verified: match });
});
```

---

## PHASE 2: TIER 3 - RBAC SYSTEM (Weeks 3-4)

### 2.1 Database Migrations

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(organization_id, name)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code VARCHAR UNIQUE NOT NULL,
  resource VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP,
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id, organization_id)
);

CREATE TABLE data_scopes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scope_type VARCHAR NOT NULL,
  scope_value UUID,
  created_at TIMESTAMP
);
```

### 2.2 RBAC Service

```typescript
// src/services/enterprise/RBACService.ts
export class RBACService {
  
  // Seed system roles
  async seedSystemRoles() {
    const roles = [
      { name: 'Super Admin', permissions: ['*:*'] },
      { name: 'Organization Owner', permissions: ['organization:*'] },
      { name: 'Finance Manager', permissions: ['finance:*', 'reports:read'] },
      { name: 'Manager', permissions: ['hrm:read', 'staff:read', 'team:manage'] },
      { name: 'Staff', permissions: ['self:read', 'attendance:write', 'leaves:write'] },
      { name: 'Customer', permissions: ['bookings:read', 'bookings:create', 'profile:read'] },
    ];
    // Insert roles...
  }
  
  async assignRoleToUser(userId: string, roleId: string, orgId: string) {
    // Validate user exists
    // Validate role exists
    // Assign role
    // Clear permission cache
    // Log audit trail
  }
  
  async getUserPermissions(userId: string, orgId: string): Promise<Permission[]> {
    // Get user roles
    // Get permissions for each role
    // Aggregate unique permissions
    // Cache result
    return permissions;
  }
  
  async hasPermission(userId: string, action: string, resource: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, orgId);
    return permissions.some(p => 
      (p.action === action || p.action === '*') && 
      (p.resource === resource || p.resource === '*')
    );
  }
  
  async getAccessibleData(userId: string, entityType: string): Promise<string[]> {
    // Get user data scopes
    // Return accessible entity IDs
  }
}
```

### 2.3 Permission Middleware

```typescript
// src/middleware/permissionCheck.ts
export const requirePermission = (resource: string, action: string) => {
  return async (req, res, next) => {
    const hasPermission = await rbacService.hasPermission(
      req.user.id,
      action,
      resource
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    next();
  };
};

// Usage in routes:
router.post('/finance/invoices', requirePermission('finance', 'create'), createInvoice);
router.get('/finance/invoices', requirePermission('finance', 'read'), listInvoices);
```

### 2.4 Dynamic Menu Generation

```typescript
// src/services/MenuService.ts
export class MenuService {
  
  async generateMenuForUser(userId: string, orgId: string): Promise<MenuItem[]> {
    // 1. Get user permissions
    const permissions = await rbacService.getUserPermissions(userId, orgId);
    
    // 2. Get organization industry type
    const org = await organizationService.getById(orgId);
    
    // 3. Get subscription level
    const subscription = await subscriptionService.getForOrg(orgId);
    
    // 4. Load base menu
    let menu = this.getBaseMenu();
    
    // 5. Filter by permissions
    menu = menu.filter(item => 
      permissions.some(p => p.code === item.requiredPermission)
    );
    
    // 6. Add industry-specific items
    if (org.industry_type === 'health') {
      menu.push(...this.getHealthMenuItems());
    }
    
    // 7. Filter by subscription level
    menu = menu.filter(item => item.minSubscriptionTier <= subscription.tier);
    
    return menu;
  }
  
  private getBaseMenu(): MenuItem[] {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        requiredPermission: 'dashboard:read'
      },
      {
        id: 'finance',
        label: 'Finance',
        icon: 'DollarSign',
        requiredPermission: 'finance:read',
        children: [
          { label: 'Invoices', path: '/finance/invoices', requiredPermission: 'finance:read' },
          { label: 'Budgets', path: '/finance/budgets', requiredPermission: 'finance:read' },
          { label: 'Reports', path: '/finance/reports', requiredPermission: 'finance:read' },
        ]
      },
      // ... more menu items
    ];
  }
}
```

---

## PHASE 3: TIER 4 - WORKFLOW ENGINE (Weeks 5-6)

### 3.1 Database Migrations

```sql
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  description TEXT,
  steps JSONB, -- workflow definition
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY,
  workflow_template_id UUID REFERENCES workflow_templates(id),
  entity_type VARCHAR,
  entity_id UUID,
  current_step VARCHAR,
  status VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE workflow_approvals (
  id UUID PRIMARY KEY,
  workflow_instance_id UUID REFERENCES workflow_instances(id),
  approver_id UUID REFERENCES users(id),
  action VARCHAR,
  comment TEXT,
  approved_at TIMESTAMP
);
```

### 3.2 Workflow Service

```typescript
// src/services/enterprise/WorkflowService.ts
export class WorkflowService {
  
  async createWorkflowInstance(
    templateId: string,
    entityType: string,
    entityId: string,
    initiatedBy: string
  ): Promise<WorkflowInstance> {
    // 1. Get template
    // 2. Create instance
    // 3. Move to first step
    // 4. Notify approvers
    // 5. Log audit trail
  }
  
  async approveStep(
    instanceId: string,
    approverId: string,
    comment: string
  ): Promise<void> {
    // 1. Get instance and step
    // 2. Validate approver
    // 3. Record approval
    // 4. Move to next step
    // 5. Notify next approver
    // 6. Check if complete
    // 7. Log audit trail
  }
  
  async rejectStep(
    instanceId: string,
    approverId: string,
    reason: string
  ): Promise<void> {
    // Similar to approve but returns to previous step
  }
}
```

---

## PHASE 4: UNIVERSAL BUSINESS MODULES (Weeks 7-20)

### 4.1 Finance Module (Weeks 7-9)

**Database**: 45 tables  
**Services**: 6 services (ChartOfAccounts, Journal, Invoice, Budget, Payment, Report)  
**Routes**: 25 endpoints  
**Forms**: 15 forms  
**Dashboards**: 3 dashboards  

```
Week 7: Database + Services + Core Routes
Week 8: Forms + API completion
Week 9: Dashboards + Integration
```

### 4.2 Procurement Module (Weeks 10-11)

**Database**: 30 tables  
**Services**: 4 services  
**Routes**: 20 endpoints  
**Forms**: 10 forms  
**Dashboards**: 2 dashboards  

### 4.3 Inventory Module (Weeks 12-13)

**Database**: 35 tables  
**Services**: 4 services  
**Routes**: 20 endpoints  
**Forms**: 10 forms  
**Dashboards**: 2 dashboards  

### 4.4 CRM Module (Week 14)

**Database**: 35 tables  
**Services**: 4 services  
**Routes**: 20 endpoints  
**Forms**: 10 forms  
**Dashboards**: 2 dashboards  

### 4.5 Sales/POS Module (Week 15)

**Database**: 30 tables  
**Services**: 4 services  
**Routes**: 18 endpoints  
**Forms**: 8 forms  
**Dashboards**: 2 dashboards  

### 4.6 HRM Module (Week 16)

**Database**: 40 tables  
**Services**: 5 services  
**Routes**: 25 endpoints  
**Forms**: 12 forms  
**Dashboards**: 3 dashboards  

### 4.7 Marketing Module (Week 17)

**Database**: 25 tables  
**Services**: 3 services  
**Routes**: 15 endpoints  
**Forms**: 8 forms  
**Dashboards**: 2 dashboards  

### 4.8 Remaining Modules (Weeks 18-20)

- Support Module
- Field Operations
- Assets & Maintenance
- Documents Management
- Projects Management
- Quality Management
- Compliance
- Analytics
- Knowledge Management
- Partnerships
- ESG/Sustainability

---

## PHASE 5: INDUSTRY CLOUDS (Weeks 21-32)

### Structure for Each Industry Cloud

Each cloud follows the same pattern:

```typescript
// Industry Cloud Template (Reusable)
// 1. Industry-specific tables
// 2. Industry-specific services
// 3. Industry-specific routes
// 4. Industry-specific forms
// 5. Industry-specific dashboards
// 6. Industry-specific workflows
// 7. Industry-specific AI agents
// 8. Industry-specific reports
```

**Week 21-22**: Health Cloud  
**Week 23-24**: Education Cloud  
**Week 25**: Beauty Cloud  
**Week 26**: Fitness Cloud  
**Week 27**: Tattoo Cloud  
**Week 28**: Real Estate Cloud  
**Week 29**: Finance (Industry) Cloud  
**Week 30**: Insurance Cloud  
**Week 31**: Retail Cloud  
**Week 32**: (Continue with remaining clouds)  

---

## PHASE 6: ENTERPRISE LAYERS (Weeks 33-40)

### 6.1 Payment Engine (Week 33)

- Stripe integration
- PayPal integration
- Flutterwave integration
- Paystack integration
- Wallet management
- Settlement processing

### 6.2 Subscription & Loyalty (Week 34)

- Plan management
- Recurring billing
- Points system
- Rewards redemption
- Tier management
- Referral tracking

### 6.3 Analytics & Reporting (Week 35)

- Data warehouse tables
- ETL processes
- Dashboard framework
- KPI calculations
- Trend analysis
- Custom reports

### 6.4 Integration Hub (Week 36)

- API connector framework
- Webhook framework
- Third-party API integrations
- Data sync scheduling
- Error handling

### 6.5 AI Platform (Week 37)

- AI agent framework
- Prompt templates
- Memory management
- Decision logging
- Recommendation engine

### 6.6 Blockchain Layer (Week 38)

- Blockchain transaction recording
- Hash generation
- Evidence storage
- Audit trail immutability
- Compliance reporting

### 6.7 Final Integration & Testing (Weeks 39-40)

- End-to-end testing
- Performance optimization
- Security hardening
- Documentation
- Deployment preparation

---

## DELIVERABLES BY PHASE

| Phase | Weeks | Deliverables | Status |
|-------|-------|--------------|--------|
| 0 | -1 | Codebase setup, infrastructure | 📋 Planned |
| 1 | 1-2 | Registration, Verification | 📋 Planned |
| 2 | 3-4 | RBAC, Permissions, Dynamic Menu | 📋 Planned |
| 3 | 5-6 | Workflow Engine, Approvals | 📋 Planned |
| 4 | 7-20 | 18 Universal Modules | 📋 Planned |
| 5 | 21-32 | 21 Industry Clouds | 📋 Planned |
| 6 | 33-40 | Enterprise Layers, Integration, AI | 📋 Planned |

---

## TESTING STRATEGY

### Unit Tests
- 1 test per service method
- Mock all dependencies
- Target: 85%+ coverage
- Framework: Jest/Vitest

### Integration Tests
- Test each module's API
- Use integration test database
- Test RBAC enforcement
- Test workflow transitions

### E2E Tests
- Test complete user journeys
- Test cross-module workflows
- Test permission enforcement
- Framework: Cypress/Playwright

### Performance Tests
- Test with 1M+ records
- Test concurrent workflows
- Test report generation
- Identify bottlenecks

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Database Tables | 750+ |
| API Routes | 480+ |
| Service Methods | 160+ |
| Form Components | 250+ |
| Dashboard Components | 70+ |
| Test Coverage | 85%+ |
| Page Load Time | <2s |
| API Response Time | <200ms |
| Uptime | 99.9% |

---

## RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Scope creep | Weekly sprint planning, clear requirements |
| Database complexity | Schema review by DB architect |
| Performance issues | Load testing each phase |
| Team coordination | Daily standups, clear ownership |
| Integration issues | Feature flag rollout, canary deploys |
| Security gaps | Security review each phase, OWASP audit |

---

## CONCLUSION

This roadmap provides a clear, sequential path to building KORA into a complete enterprise operating system matching your Single Source of Truth specification. 

**Key Success Factors**:
1. ✅ Stick to phase sequence - don't skip ahead
2. ✅ Complete testing before moving to next phase
3. ✅ Daily communication within team
4. ✅ Weekly demo/review with stakeholders
5. ✅ Maintain code quality throughout
6. ✅ Document as you build

**Start Date**: Immediate  
**Expected Completion**: 16 weeks from start  
**Team Size**: 8-10 developers  

---

**Ready to Begin Phase 1?**

Next Action: Begin Phase 0 preparation tomorrow morning.
