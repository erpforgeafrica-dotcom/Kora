# KÓRA QA Testing Framework

## Team C - Quality Assurance & Release Engineering

### Test Coverage Requirements

| Component Type | Coverage Threshold | Test Types |
|---------------|-------------------|------------|
| UI Components (`src/components/ui/`) | 95% | Unit + Integration |
| Services (`src/services/`) | 90% | Unit + MSW Mocks |
| Hooks (`src/hooks/`) | 95% | Unit + RTL |
| Pages (`src/pages/`) | 85% | E2E + Unit |

### Test Structure

```
frontend/
├── cypress/
│   └── e2e/
│       ├── clients.cy.ts      # CRUD workflow
│       ├── bookings.cy.ts     # Booking lifecycle
│       ├── auth.cy.ts         # Role-based access
│       └── sidebar.cy.ts      # Navigation
├── src/
│   ├── __tests__/
│   │   ├── DataTable.test.tsx # UI component
│   │   ├── Sidebar.test.tsx   # Layout component
│   │   └── useCrud.test.ts    # Custom hook
│   └── test/
│       └── setup.ts           # Test configuration
└── scripts/
    └── validate-rbac.js       # Security validation
```

### Quality Gates (CI Pipeline)

1. **Lint Check** - ESLint + Prettier
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Vitest + RTL (95% coverage)
4. **RBAC Validation** - Security matrix scan
5. **Build Test** - Production build
6. **E2E Tests** - Cypress headless

### Running Tests

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run cypress:run:headless

# Security validation
npm run validate:rbac

# Full quality gate
npm run quality:gate
```

### Test Data Management

- **Unit Tests**: MSW mocks with realistic data
- **E2E Tests**: Seeded test database
- **Security Tests**: Automated RBAC matrix validation

### Enforcement

- **Branch Protection**: All tests must pass before merge
- **Coverage Gates**: Fail build if below thresholds
- **Security Scan**: Block merge on RBAC violations
- **Dual Approval**: Team A + Team B leads must approve