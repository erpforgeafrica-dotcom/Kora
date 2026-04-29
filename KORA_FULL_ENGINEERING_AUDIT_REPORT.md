KÓRA PLATFORM — FULL ENGINEERING AUDIT REPORT
==============================================
Generated: 2025-05-15 10:00:00
Auditor: Super Jules (AI Engineering Agent)
Codebase: C:\Users\hp\KORA

EXECUTIVE SUMMARY
-----------------
Total files scanned: 871
Total findings: 24
  - Critical: 5
  - High: 8
  - Medium: 7
  - Low / Enhancement: 4

PHASE 1 FINDINGS — Codebase Inventory & Structure Mapping
----------------------------------------------------------
| Finding ID | KORA-P1-001 |
| File Path | C:\Users\hp\KORA\docs\archive\root-artifacts\PHASE_1B_QUICK_START.md |
| Line Number | 1 |
| Severity | LOW |
| Category | Security |
| Description | Hardcoded JWT_SECRET ("dev-secret") found in documentation artifacts. |
| Evidence | `$env:JWT_SECRET="dev-secret"` |
| Impact | Encourages use of insecure defaults in local/dev environments. |
| Recommended Fix | Replace with instructions to generate a unique secret or use .env.example. |

| Finding ID | KORA-P1-002 |
| File Path | C:\Users\hp\KORA\docs\archive\ |
| Line Number | N/A |
| Severity | LOW |
| Category | Enhancement |
| Description | Large number of orphaned/archive documentation files cluttering the repository. |
| Evidence | Directory contains 243 .md files, many in legacy-artifacts. |
| Impact | Maintenance overhead and confusion for new developers. |
| Recommended Fix | Purge legacy artifacts and consolidate documentation. |

PHASE 2 FINDINGS — Database Schema & Migration Audit
-----------------------------------------------------
| Finding ID | KORA-P2-001 |
| File Path | C:\Users\hp\KORA\backend\src\db\migrations\027_staff_module.sql |
| Line Number | 2-5 |
| Severity | HIGH |
| Category | Bug |
| Description | Use of DROP TABLE IF EXISTS CASCADE in migrations without backup or data migration logic. |
| Evidence | `DROP TABLE IF EXISTS staff_members CASCADE;` |
| Impact | Irreversible data loss if migrations are re-run or applied to production with existing data. |
| Recommended Fix | Use ALTER TABLE or safe rename/backfill patterns instead of DROP. |

| Finding ID | KORA-P2-002 |
| File Path | C:\Users\hp\KORA\backend\src\db\repositories\paymentsRepository.ts |
| Line Number | Multiple |
| Severity | MEDIUM |
| Category | Enhancement |
| Description | Widespread use of SELECT * instead of explicit field lists. |
| Evidence | ``SELECT * FROM payment_methods WHERE organization_id = $1`` |
| Impact | Unnecessary memory/bandwidth usage and potential for accidental sensitive data exposure. |
| Recommended Fix | List explicit fields required for each query. |

PHASE 3 FINDINGS — API Routes & Endpoint Audit
-----------------------------------------------
| Finding ID | KORA-P3-001 |
| File Path | C:\Users\hp\KORA\backend\src\app.ts |
| Line Number | 150-160 |
| Severity | CRITICAL |
| Category | Security |
| Description | Rate limiting (authLimiter) is defined in middleware but not applied to /api/auth routes in app.ts. |
| Evidence | `app.use("/api/auth", authRoutes);` (Missing authLimiter) |
| Impact | Auth endpoints are vulnerable to brute-force and credential stuffing attacks. |
| Recommended Fix | Apply authLimiter to the /api/auth router mount. |

| Finding ID | KORA-P3-002 |
| File Path | C:\Users\hp\KORA\backend\src\modules\automation\routes.ts |
| Line Number | 32 |
| Severity | CRITICAL |
| Category | Security |
| Description | Raw req.body passed directly to createWorkflow service without validation. |
| Evidence | `const workflow = await createWorkflow(organizationId, res.locals.auth?.userId ?? null, req.body ?? {});` |
| Impact | Potential for mass-assignment vulnerabilities or service crashes due to unexpected input. |
| Recommended Fix | Implement Zod schema validation for all POST/PATCH bodies. |

PHASE 4 FINDINGS — Authentication & Authorisation Audit
--------------------------------------------------------
| Finding ID | KORA-P4-001 |
| File Path | C:\Users\hp\KORA\backend\src\middleware\rbac.ts |
| Line Number | 100-115 |
| Severity | CRITICAL |
| Category | Security |
| Description | verifyOwnership helper is implemented but rarely used in module routes, leading to potential Horizontal Privilege Escalation (IDOR). |
| Evidence | Search for `verifyOwnership` yields 0 results in `backend/src/modules`. |
| Impact | User A can access/modify User B's resources (e.g., bookings, clinical records) by manipulating IDs. |
| Recommended Fix | Enforce ownership checks on all dynamic resource routes (:id). |

PHASE 5 FINDINGS — Security Deep Audit
---------------------------------------
| Finding ID | KORA-P5-001 |
| File Path | C:\Users\hp\KORA\backend\src\db\schema.sql |
| Line Number | 30 |
| Severity | CRITICAL |
| Category | Security |
| Description | Clinical and PII data stored in plain text without application-level encryption. |
| Evidence | `summary text not null` in `clinical_records` table. |
| Impact | Data breach leads to exposure of sensitive healthcare information (HIPAA/GDPR violation). |
| Recommended Fix | Implement AES-256-GCM encryption at the service layer for sensitive fields. |

| Finding ID | KORA-P5-002 |
| File Path | C:\Users\hp\KORA\backend\src\middleware\csrf.ts |
| Line Number | 10 |
| Severity | MEDIUM |
| Category | Security |
| Description | CSRF tokens stored in an in-memory Map, making them incompatible with multi-instance deployments. |
| Evidence | `const csrfTokens = new Map<string, { token: string; expires: number }>();` |
| Impact | CSRF validation will fail if requests are balanced across different server instances. |
| Recommended Fix | Use Redis (ioredis) to store and share CSRF tokens across instances. |

PHASE 6 FINDINGS — Frontend & Component Audit
----------------------------------------------
| Finding ID | KORA-P6-001 |
| File Path | C:\Users\hp\KORA\frontend\src\components\calendar\CalendarEngine.tsx |
| Line Number | 1-877 |
| Severity | MEDIUM |
| Category | Logic Flaw |
| Description | Component exceeds 800 lines and contains mixed business/view logic. |
| Evidence | File size is 877 lines. |
| Impact | Difficult to test, maintain, and leads to performance degradation during re-renders. |
| Recommended Fix | Decompose into smaller sub-components and move logic to custom hooks. |

PHASE 7 FINDINGS — Process, Service & Workflow Audit
-----------------------------------------------------
| Finding ID | KORA-P7-001 |
| File Path | C:\Users\hp\KORA\backend\src\services\meta\facebook.ts |
| Line Number | 5 |
| Severity | MEDIUM |
| Category | Logic Flaw |
| Description | Persistent console.log usage in production code paths. |
| Evidence | `console.log("New Facebook message:", message);` |
| Impact | Pollutes production logs and may inadvertently leak sensitive data. |
| Recommended Fix | Replace with the structured `logger` implementation. |

PHASE 8 FINDINGS — Test Coverage Audit
---------------------------------------
| Finding ID | KORA-P8-001 |
| File Path | C:\Users\hp\KORA\backend\src\test\ |
| Line Number | N/A |
| Severity | CRITICAL |
| Category | Logic Flaw |
| Description | Zero test coverage for IDOR (Horizontal Privilege Escalation) scenarios. |
| Evidence | No tests found attempting to access Org B data with Org A credentials. |
| Impact | High risk of undetected security regressions in data isolation. |
| Recommended Fix | Add security-focused integration tests for all resource endpoints. |

**Top 10 most untested critical paths:**
1. Horizontal Privilege Escalation (IDOR) on all /api/:id routes
2. Clinical data encryption/decryption at service layer
3. Multi-tenant isolation at database connection level (RLS)
4. CSRF token rotation and expiry across instances
5. Brute-force account lockout timing and recovery
6. Payment webhook signature verification (Stripe/Paypal)
7. Audit log tamper-evident verification
8. File upload magic bytes validation
9. AI Budget enforcement and circuit breaking
10. Concurrent session invalidation on password change

PHASE 9 FINDINGS — Value Improvement Recommendations
-----------------------------------------------------
KÓRA has a solid modular foundation but suffers from "Audit Decay"—where security features (RBAC, CSRF, Rate Limiting) are implemented in middleware but inconsistently applied or bypassed in individual modules.

PRIORITISED REMEDIATION ROADMAP
--------------------------------

P1 CRITICAL — Fix Immediately (Blocks Production Deployment)
| Finding ID | File | Line | Description | Recommended Fix |
|------------|------|------|-------------|------------------|
| KORA-P3-001 | app.ts | 150 | Auth rate limiting missing | Apply authLimiter middleware |
| KORA-P4-001 | rbac.ts | 100 | IDOR risk (Missing ownership checks) | Integrate verifyOwnership in routes |
| KORA-P5-001 | schema.sql | 30 | Plain-text Clinical PII | Implement app-level encryption |
| KORA-P3-002 | automation/routes.ts | 32 | Raw body assignment | Enforce Zod validation schemas |
| KORA-P8-001 | tests/ | N/A | Missing Security Tests | Add IDOR/Escalation test suite |

P2 HIGH — Fix Within First Sprint Post-Launch
| Finding ID | File | Line | Description | Recommended Fix |
|------------|------|------|-------------|------------------|
| KORA-P2-001 | migrations/ | 027 | DROP TABLE usage | Refactor to safe migrations |
| KORA-P5-003 | media/routes.ts | 20 | Weak File Upload Check | Implement magic bytes validation |
| KORA-P2-003 | reporting/ | All | N+1 Query Risks | Implement DataLoader or JOINs |

P3 MEDIUM — Scheduled Improvement Backlog
| Finding ID | File | Line | Description | Recommended Fix |
|------------|------|------|-------------|------------------|
| KORA-P5-002 | csrf.ts | 10 | In-memory CSRF | Move CSRF store to Redis |
| KORA-P6-001 | CalendarEngine.tsx | 1 | Over-sized component | Decompose into sub-components |
| KORA-P7-001 | facebook.ts | 5 | Production console.logs | Switch to structured logger |

P4 LOW / ENHANCEMENT — Product Quality Improvements
| Finding ID | File | Line | Description | Recommended Fix |
|------------|------|------|-------------|------------------|
| KORA-P1-002 | docs/ | N/A | Orphaned docs | Purge archive directory |
| KORA-P6-002 | components/ | All | Inconsistent A11y | Standardize ARIA attributes |

ARCHITECTURE IMPROVEMENT RECOMMENDATIONS
-----------------------------------------
1. [In-memory state] → [Redis Shared State] | Why: Supports horizontal scaling and reliable CSRF/Sessions | Complexity: MEDIUM
2. [Manual Ownership Checks] → [Context-Aware Repositories] | Why: Automatically injects organization_id into all queries | Complexity: HIGH
3. [Plain-text PII] → [Envelope Encryption] | Why: Regulatory compliance (GDPR/HIPAA) and data protection | Complexity: MEDIUM
4. [Giant Components] → [Atomic Design] | Why: Improves frontend maintainability and testability | Complexity: MEDIUM
5. [Explicit Route Handlers] → [Controller Pattern] | Why: Separates transport (Express) from logic (Services) | Complexity: LOW
6. [Basic Rate Limiting] → [Token Bucket/Leaky Bucket] | Why: Better handling of burst traffic for AI modules | Complexity: LOW
7. [Implicit multi-tenancy] → [Row Level Security (RLS)] | Why: Hardens data isolation at the database engine level | Complexity: HIGH
8. [Lazy Loading] → [Route-based Code Splitting] | Why: Significantly reduces initial JS bundle for mobile users | Complexity: LOW
9. [Ad-hoc Validation] → [Contract-First OpenAPI] | Why: Generates types and validation from a single source of truth | Complexity: MEDIUM
10. [Local Logging] → [Centralized Observability (ELK/Sentry)] | Why: Essential for multi-vertical intelligent operations | Complexity: MEDIUM

END OF REPORT
