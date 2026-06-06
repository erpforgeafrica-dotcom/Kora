# 🚨 KORA: THE GLOBAL BUSINESS OPERATING SYSTEM
## UNIFIED SOURCE OF TRUTH — ARCHITECTURAL BIBLE v2.0

**Version:** 2.0 (Unified — supersedes all prior documents)
**Classification:** Enterprise Core Architecture
**Enforcement:** Absolute. No deviation permitted.

---

## 📋 CHANGE LOG (Inconsistencies Resolved)

| # | Inconsistency Found | Resolution Applied |
|---|---------------------|--------------------|
| 1 | `tenants` table: two conflicting definitions — minimal (5 cols) vs refined (11 cols) | **Merged.** Final `tenants` table includes all columns: `id, name, tenant_code, domain, base_currency, plan_id, industry, region, tier, status, metadata, settings, created_at` |
| 2 | RLS policy names inconsistent: `"Tenant Isolation"`, `tenant_appointment_isolation`, mixed quoted/unquoted | **Standardised.** All isolation policies named `policy_<table>_isolation` |
| 3 | `db/migrations.sql` used `split_settlements` with mutable balance columns — no double-entry | **Removed `split_settlements`.** All financial movement goes through `ledger_entries` (debit/credit pairs only) |
| 4 | `db/migrations.sql` used `merchants` as tenancy root — contradicts `tenants + entity_graph` architecture | **`merchants` removed.** Tenant root is `tenants` + `entity_graph` per Layer A/B |
| 5 | Two identical SSoT files with different filenames (`_FINAL` vs `_OR_TRUTH_FINAL`) | **Both superseded** by this document |
| 6 | `event_stream` absent from `db/migrations.sql` | **Added** with canonical Layer C schema |
| 7 | `billing_plans`, `usage_metering`, `ai_orchestrator` absent from migration | **Added** per Layer I and H |
| 8 | `wallets` had mutable `wallet_balance` column — violates double-entry mandate | **Replaced.** `wallets` stores account metadata only; balance is always derived from `ledger_entries` |
| 9 | `compliance_rules`, `audit_control_plane`, `franchise_tree` absent | **Added** per Layers J and K |
| 10 | `entity_graph` missing `did`, `metadata`, `role`, `timezone` columns | **Added** all columns from refined specification |
| 11 | `ledger_entries` name inconsistent (`universal_ledger_entries` in some references) | **Canonical name:** `ledger_entries` throughout |
| 12 | Duplicate table definitions across files (`event_stream`, `entity_graph`, `billing_plans`) | **Deduplicated.** One definition per table in the final schema below |

---

## 📖 TABLE OF CONTENTS

1. Business Paradigm (What Kora Is)
2. The UI/UX Mandate (The 12-Year-Old Rule)
3. Layer 0 Substrate (Blockchain + AI + Zero-Trust)
4. Layer A–K Architecture (Clean Layer Model)
5. Subscription & Resource Enforcement
6. Multi-Language & Currency Kernel
7. Final PostgreSQL Schema (Resolved & Unified)
8. The 11 Master Execution Prompts
9. 90-Day Sprint Matrix (Phased Build)
10. Monorepo Genesis (Sprint 0 Commands)
11. Validation Checkpoints (The Architect's Gate)

---

## 1. BUSINESS PARADIGM (WHAT KORA IS)

Kora is a **Web3-Enterprise Hybrid Operating System**.

It merges:
- A consumer-facing **"Super-App Marketplace"** (discovery, booking, payments)
- A multi-tenant **Enterprise ERP/CRM backend** (SAP + Salesforce + Stripe scale)
- A **Layer 0 Blockchain** (trustless smart contracts, immutable audit)
- A **Multi-Agent AI Swarm** (tenant-isolated, action-capable cognitive engine)

**The ecosystem supports:**
- Solo freelancers (tutors, drivers, stylists)
- Single-location businesses (salons, clinics, shops)
- Multi-branch enterprises (hospital networks, franchise chains, banks)
- Governments & NGOs (white-label, sovereign infrastructure)

**Core mantra:** *Simple enough for a 12-year-old. Powerful enough for a multinational enterprise.*

---

## 2. THE UI/UX MANDATE (THE "12-YEAR-OLD" RULE)

This is non-negotiable. The backend is an enterprise beast; the frontend must be invisible, luxurious, and frictionless.

### 2.1 Zero Technical Jargon
- No database, infrastructure, or system architecture terms on any user-facing screen.
- Translate system logic into plain human actions.
- ❌ "Execute Ledger Transaction" → ✅ "Complete Payment"
- ❌ "Entity Schema Mismatch" → ✅ "Something went wrong. Try again."

### 2.2 The 12-Year-Old Test
- Every dashboard, booking flow, and setup screen must be operable by a 12-year-old without a manual.
- Break complex forms into step-by-step wizards.
- Never show a massive scrolling form.

### 2.3 High Affordance & Visual Cues
- Universal icons, symbols, and micro-animations.
- Hover states, focus rings, clear drag-and-drop zones.
- A button's purpose must be clear from its shape, icon, and color alone.

### 2.4 Luxury Container
- Public landing page and marketplace: high-end typography, glassmorphism, cinematic scrolling.
- Massive media containers for auto-playing videos, GIFs, high-res images.
- 90+ Lighthouse performance score.

### 2.5 Form Abstraction (Server-Driven UI)
- No hardcoded React forms for business operations.
- JSON-to-UI dynamic form engine for all HRM, CRM, Inventory, POS workflows.
- Forms render from database schemas, not frontend code.

---

## 3. LAYER 0 SUBSTRATE (BLOCKCHAIN + AI + ZERO-TRUST)

This sits below the database, below the microservices, below the API gateway.

### 3.1 Decentralized Identity (DID)
- Every entity (person, org, device, AI agent) receives a DID + keypair on registration.
- No traditional passwords transmitted over the network.

### 3.2 Verifiable Credentials (VCs)
- Business licenses, medical credentials, tax certificates → issued as VCs on-chain.
- System cryptographically verifies, not database queries.

### 3.3 Smart Contracts (Business Rules Engine)
- **Franchise/Royalty Contract:** Intercepts every payment, instantly routes splits.
- **Escrow Contract:** Locks funds until both parties cryptographically sign completion.
- **Payroll Contract:** Timesheets trigger instant salary streaming.

### 3.4 Zero-Trust Micro-Segmentation
- "Never trust, always verify."
- Every service-to-service request must be cryptographically signed by the source's DID.
- Continuous biometric re-authentication for high-risk actions.

### 3.5 The Kora AppChain
- Custom Layer 1 blockchain (Substrate/Cosmos/Hyperledger).
- Zero internal gas fees, sub-second block times.
- Every critical event (invoice.paid, medical_record.updated) is a transaction.
- **PostgreSQL is the indexer/cache.** Blockchain is the source of truth.

### 3.6 Kernel-Level AI (The Immune System)
- AI monitors network layer for anomalies (location velocity, device fingerprinting).
- Autonomous fraud intervention: freezes smart contracts, locks DIDs, escalates incidents.
- Smart contract auditing before deployment.
- Data lake deep learning on immutable blockchain state.

---

## 4. LAYER A–K ARCHITECTURE (CLEAN LAYER MODEL)

No mixing of concerns. Each layer has a single responsibility.

| Layer | Name | Core Responsibility |
|-------|------|---------------------|
| **A** | Tenancy & Isolation | Row Level Security, tenant databases, domains, regional compliance |
| **B** | Identity & Entity Graph | DIDs, entity_graph (person/org/asset), relationships, franchise hierarchies |
| **C** | Event-Driven Core | event_stream, event_subscriptions — system nervous system |
| **D** | API Gateway & Integration | Routes, auth policies, webhooks, integration registry (Stripe, SAP, WhatsApp) |
| **E** | Financial Ledger | Double-entry ledger_entries, wallets, settlements, fx rates |
| **F** | Financial Event Bridge | event → ledger → wallet → settlement synchronization |
| **G** | Data Lake & Semantic Layer | fact_tables, semantic_models (KPI definitions for AI) |
| **H** | AI Orchestration | Multi-agent swarm, tenant memory isolation, action execution |
| **I** | Monetization Engine | billing_plans, usage_metering, subscriptions, overage rules |
| **J** | Governance & Control | compliance_rules (GDPR/HIPAA/PCI), audit_control_plane, tamper detection |
| **K** | Franchise & Hierarchy | franchise_tree, revenue_share, multi-branch management |

### 4.1 Critical Rule: One Engine Per Domain
- ❌ Multiple audit logs → ✅ One `audit_control_plane`
- ❌ Multiple workflow engines → ✅ One workflow runtime
- ❌ Multiple document systems → ✅ One document management

### 4.2 System Spine (Every Action Must Follow)
```
Identity → Event → Workflow → Ledger → Audit → AI → Storage
```

---

## 5. SUBSCRIPTION & RESOURCE ENFORCEMENT

### 5.1 The Four Tiers

| Capability | BASIC (Free) | ESSENTIAL | PROFESSIONAL | ENTERPRISE |
|------------|--------------|-----------|--------------|------------|
| **Target** | Freelancers, gig workers | Single-location small biz | Mid-sized, multi-dept | Hospital networks, franchises |
| **Users** | 1 (owner only) | Up to 5 | Up to 50 | Unlimited |
| **Storage** | 500 MB | 10 GB | 250 GB | 5 TB |
| **AI Tokens/mo** | 5,000 | 100,000 | 2,000,000 | 50,000,000 |
| **Marketplace** | ✅ | ✅ | ✅ | ✅ |
| **Booking Engine** | ✅ | ✅ | ✅ | ✅ |
| **Basic POS** | ✅ | ✅ | ✅ | ✅ |
| **CRM** | Basic | Full | Full | Full |
| **HRM** | ❌ | Basic | Advanced | Full + Payroll |
| **Inventory** | ❌ | Light | Full | Full + Warehouse |
| **Industry Clouds** (EMR/LMS) | ❌ | ❌ | ✅ | ✅ |
| **ERP (GL/Journals)** | ❌ | ❌ | ✅ | ✅ |
| **Workflow Engine** | ❌ | ❌ | ✅ | ✅ |
| **Franchise Engine** | ❌ | ❌ | ❌ | ✅ |
| **Blockchain Audit** | ❌ | ❌ | ❌ | ✅ |
| **White-Label** | ❌ | ❌ | ❌ | ✅ (PLATFORM tier) |

### 5.2 Enforcement Mechanism
- **UI:** `tenant_features` hides unavailable modules.
- **API Gateway:** Returns `403 Forbidden - Upgrade Required`.
- **AI Orchestrator:** Metering table enforces token limits.
- **Smart Contracts:** Dynamic platform fee based on tier (5% Basic → 0.5% Enterprise).

---

## 6. MULTI-LANGUAGE & CURRENCY KERNEL

### 6.1 Global Currencies
All user-facing monetary values reference `global_currencies`. Exchange rates live in `exchange_rates`.

### 6.2 Multi-Language (JSONB)
All user-facing text fields use JSONB:
```json
{ "en": "Haircut", "fr": "Coupe", "es": "Corte", "ar": "قصة شعر" }
```
Applies to: `services.name`, `services.description`, `products.name`, `business_profiles.bio`.

### 6.3 Timezone Compliance
- All timestamps: `TIMESTAMPTZ` (PostgreSQL)
- `entity_graph.timezone` stores IANA timezone string (e.g., `'Africa/Lagos'`)
- Frontend converts UTC to local time; never store local time in DB

---

## 7. FINAL POSTGRESQL SCHEMA (RESOLVED & UNIFIED)

> **Rules enforced in this schema:**
> - Every table with `tenant_id` has RLS enabled and policy named `policy_<table>_isolation`
> - No mutable balance columns — all financial movement via `ledger_entries`
> - UUID only — no serial/autoincrement
> - JSONB for all user-facing multilingual text

### 7.1 Foundation (Pre-Tenant)

```sql
-- global_currencies: no tenant_id, no RLS needed
CREATE TABLE global_currencies (
  code         VARCHAR(3) PRIMARY KEY,
  name         VARCHAR(50) NOT NULL,
  symbol       VARCHAR(5)  NOT NULL,
  decimal_places INT DEFAULT 2
);

-- exchange_rates: no tenant_id, no RLS needed
CREATE TABLE exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   VARCHAR(3) REFERENCES global_currencies(code),
  target_currency VARCHAR(3) REFERENCES global_currencies(code),
  rate            NUMERIC(18,6) NOT NULL,
  effective_date  TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Layer A — Tenancy

```sql
-- FINAL tenants definition (merged from both prior schemas)
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  tenant_code   VARCHAR(100) UNIQUE NOT NULL,
  domain        VARCHAR(255),
  base_currency VARCHAR(3) REFERENCES global_currencies(code) DEFAULT 'USD',
  plan_id       UUID,                          -- FK added after billing_plans created
  industry      VARCHAR(100),                  -- 'HEALTHCARE','BEAUTY','LOGISTICS', etc.
  region        VARCHAR(50),                   -- 'NG','EU','US' (compliance routing)
  tier          VARCHAR(20) NOT NULL DEFAULT 'BASIC',  -- BASIC|ESSENTIAL|PROFESSIONAL|ENTERPRISE
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|SUSPENDED|FROZEN
  metadata      JSONB NOT NULL DEFAULT '{}',
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants can only see their own row
CREATE POLICY policy_tenants_isolation ON tenants
  FOR ALL USING (
    id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );
```

### 7.3 Layer B — Identity & Entity Graph

```sql
CREATE TABLE entity_graph (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type   VARCHAR(50) NOT NULL,  -- 'BUSINESS_OWNER'|'CONSUMER'|'STAFF'|'AI_AGENT'|'DEVICE'
  did           VARCHAR(255) UNIQUE,   -- Decentralized Identity
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  email         VARCHAR(255),
  phone         VARCHAR(50),
  timezone      VARCHAR(50) DEFAULT 'UTC',
  role          VARCHAR(50),           -- 'OWNER'|'MANAGER'|'STAFF'|'CONSUMER'
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entity_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_entity_graph_isolation ON entity_graph
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_entity_graph_tenant_id    ON entity_graph(tenant_id);
CREATE INDEX idx_entity_graph_auth_user_id ON entity_graph(auth_user_id);

-- Entity relationships (franchise hierarchies, org trees)
CREATE TABLE entity_relationships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id     UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  child_id      UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  relationship  VARCHAR(50) NOT NULL, -- 'FRANCHISE_PARENT'|'REPORTS_TO'|'OWNS'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_entity_relationships_isolation ON entity_relationships
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_entity_relationships_tenant_id ON entity_relationships(tenant_id);
```

### 7.4 Layer C — Event-Driven Core

```sql
-- One canonical event_stream (deduplicated)
CREATE TABLE event_stream (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type     VARCHAR(100) NOT NULL,  -- 'invoice.paid'|'appointment.booked'|etc.
  entity_id      UUID,                   -- references the affected entity
  entity_type    VARCHAR(50),
  payload        JSONB NOT NULL DEFAULT '{}',
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_stream ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_event_stream_isolation ON event_stream
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_event_stream_tenant_id   ON event_stream(tenant_id);
CREATE INDEX idx_event_stream_event_type  ON event_stream(event_type);
CREATE INDEX idx_event_stream_occurred_at ON event_stream(occurred_at);

CREATE TABLE event_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type   VARCHAR(100) NOT NULL,
  handler_url  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_event_subscriptions_isolation ON event_subscriptions
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_event_subscriptions_tenant_id ON event_subscriptions(tenant_id);
```

### 7.5 Layer E — Financial Ledger (Double-Entry)

```sql
-- Wallets: account metadata only — NO balance column
CREATE TABLE wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id     UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  account_code  VARCHAR(50) NOT NULL,   -- e.g. 'REVENUE','ESCROW','PLATFORM_FEE'
  currency      VARCHAR(3) REFERENCES global_currencies(code) DEFAULT 'USD',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, entity_id, account_code)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_wallets_isolation ON wallets
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_wallets_tenant_id ON wallets(tenant_id);

-- ledger_entries: the ONLY place financial value moves
-- Balance = SUM(credit) - SUM(debit) for an account_code
CREATE TABLE ledger_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  debit_account  VARCHAR(50) NOT NULL,   -- account_code being debited
  credit_account VARCHAR(50) NOT NULL,   -- account_code being credited
  amount         NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency       VARCHAR(3) NOT NULL REFERENCES global_currencies(code),
  fx_rate        NUMERIC(18,6) NOT NULL DEFAULT 1.0,
  reference_type VARCHAR(50),            -- 'INVOICE'|'PAYROLL'|'REFUND'|'ESCROW_RELEASE'
  reference_id   UUID,                   -- FK to source document (invoice id, etc.)
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ledger_entries_isolation ON ledger_entries
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_ledger_entries_tenant_id    ON ledger_entries(tenant_id);
CREATE INDEX idx_ledger_entries_created_at   ON ledger_entries(created_at);
CREATE INDEX idx_ledger_entries_reference_id ON ledger_entries(reference_id);
```

### 7.6 Layer H — AI Orchestration

```sql
CREATE TABLE ai_orchestrator (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name    VARCHAR(100) NOT NULL,
  agent_type    VARCHAR(50) NOT NULL,   -- 'BOOKING'|'FINANCE'|'CRM'|'COMPLIANCE'
  model         VARCHAR(100) NOT NULL DEFAULT 'gemini-2.0-flash',
  system_prompt TEXT,
  memory        JSONB NOT NULL DEFAULT '{}',  -- tenant-isolated memory blob
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_orchestrator ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ai_orchestrator_isolation ON ai_orchestrator
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_ai_orchestrator_tenant_id ON ai_orchestrator(tenant_id);

CREATE TABLE ai_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id     UUID NOT NULL REFERENCES ai_orchestrator(id) ON DELETE CASCADE,
  action_type  VARCHAR(100) NOT NULL,  -- 'BOOK_APPOINTMENT'|'SEND_MESSAGE'|'CREATE_INVOICE'
  payload      JSONB NOT NULL DEFAULT '{}',
  status       VARCHAR(20) DEFAULT 'PENDING', -- PENDING|EXECUTED|FAILED
  executed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ai_actions_isolation ON ai_actions
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_ai_actions_tenant_id  ON ai_actions(tenant_id);
CREATE INDEX idx_ai_actions_created_at ON ai_actions(created_at);
```

### 7.7 Layer I — Monetization Engine

```sql
-- One canonical billing_plans table (deduplicated)
CREATE TABLE billing_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) UNIQUE NOT NULL,  -- 'BASIC'|'ESSENTIAL'|'PROFESSIONAL'|'ENTERPRISE'
  max_users     INT,
  storage_mb    INT,
  ai_tokens_mo  BIGINT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual  NUMERIC(10,2) NOT NULL DEFAULT 0,
  features      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK now that billing_plans exists
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_plan_id
  FOREIGN KEY (plan_id) REFERENCES billing_plans(id);

CREATE TABLE tenant_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id       UUID NOT NULL REFERENCES billing_plans(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_tenant_subscriptions_isolation ON tenant_subscriptions
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);

-- usage_metering: tracks AI tokens, API calls, storage per tenant
CREATE TABLE usage_metering (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric       VARCHAR(50) NOT NULL,    -- 'AI_TOKENS'|'API_CALLS'|'STORAGE_MB'
  quantity     BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_metering ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_usage_metering_isolation ON usage_metering
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_usage_metering_tenant_id   ON usage_metering(tenant_id);
CREATE INDEX idx_usage_metering_created_at  ON usage_metering(created_at);
```

### 7.8 Layer J — Governance & Control

```sql
-- audit_control_plane: one immutable log — hash-chained
CREATE TABLE audit_control_plane (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES entity_graph(id),
  action          VARCHAR(100) NOT NULL,
  resource_type   VARCHAR(50),
  resource_id     UUID,
  diff            JSONB,               -- before/after snapshot
  ip_address      INET,
  blockchain_hash VARCHAR(255),        -- immutable on-chain reference
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_control_plane ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_audit_control_plane_isolation ON audit_control_plane
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_audit_control_plane_tenant_id   ON audit_control_plane(tenant_id);
CREATE INDEX idx_audit_control_plane_occurred_at ON audit_control_plane(occurred_at);

CREATE TABLE compliance_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  framework   VARCHAR(50) NOT NULL,   -- 'GDPR'|'HIPAA'|'PCI_DSS'
  rule_key    VARCHAR(100) NOT NULL,
  rule_value  JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_compliance_rules_isolation ON compliance_rules
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_compliance_rules_tenant_id ON compliance_rules(tenant_id);
```

### 7.9 Layer K — Franchise & Hierarchy

```sql
CREATE TABLE franchise_tree (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_tenant_id UUID REFERENCES tenants(id),
  name             JSONB NOT NULL DEFAULT '{}',  -- multilingual
  level            INT NOT NULL DEFAULT 0,       -- 0=HQ, 1=Region, 2=Branch
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE franchise_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_franchise_tree_isolation ON franchise_tree
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_franchise_tree_tenant_id ON franchise_tree(tenant_id);

CREATE TABLE revenue_share_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  franchise_id     UUID NOT NULL REFERENCES franchise_tree(id) ON DELETE CASCADE,
  share_percentage NUMERIC(5,2) NOT NULL CHECK (share_percentage BETWEEN 0 AND 100),
  rule_type        VARCHAR(50) NOT NULL, -- 'ROYALTY'|'MARKETING_FUND'|'TECH_FEE'
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE revenue_share_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_revenue_share_rules_isolation ON revenue_share_rules
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_revenue_share_rules_tenant_id ON revenue_share_rules(tenant_id);
```

### 7.10 Business Domain Tables (Services, Bookings, Products, etc.)

```sql
-- services: JSONB for multilingual names
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        JSONB NOT NULL DEFAULT '{}',          -- {"en":"Haircut","fr":"Coupe"}
  description JSONB NOT NULL DEFAULT '{}',
  price       NUMERIC(18,2) NOT NULL,
  currency    VARCHAR(3) REFERENCES global_currencies(code) DEFAULT 'USD',
  duration_minutes INT DEFAULT 30,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_services_isolation ON services
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_services_tenant_id  ON services(tenant_id);
CREATE INDEX idx_services_created_at ON services(created_at);

-- products: JSONB for multilingual names
CREATE TABLE products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  sku        VARCHAR(100),
  price      NUMERIC(18,2) NOT NULL,
  currency   VARCHAR(3) REFERENCES global_currencies(code) DEFAULT 'USD',
  stock_qty  INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_products_isolation ON products
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_products_tenant_id  ON products(tenant_id);

-- business_profiles: JSONB for multilingual bio
CREATE TABLE business_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id   UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  bio         JSONB NOT NULL DEFAULT '{}',
  address     JSONB NOT NULL DEFAULT '{}',
  gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  social_links JSONB NOT NULL DEFAULT '{}',
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_business_profiles_isolation ON business_profiles
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_business_profiles_tenant_id ON business_profiles(tenant_id);

-- bookings
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES entity_graph(id),
  provider_id   UUID NOT NULL REFERENCES entity_graph(id),
  service_id    UUID NOT NULL REFERENCES services(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  channel       VARCHAR(50) NOT NULL DEFAULT 'IN_PERSON',
  status        VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  price_agreed  NUMERIC(18,2) NOT NULL,
  currency      VARCHAR(3) REFERENCES global_currencies(code) DEFAULT 'USD',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_bookings_isolation ON bookings
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_bookings_tenant_id    ON bookings(tenant_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_created_at   ON bookings(created_at);
```

---

## 8. THE 11 MASTER EXECUTION PROMPTS

These prompts must be fed **sequentially** to the AI development swarm. Do not skip. Do not combine.

| # | Name | Objective |
|---|------|-----------|
| **001** | Supabase Kernel & Multi-Tenant Isolation | RLS, double-entry ledger, JSONB localization, UUIDs |
| **002** | Identity Graph & Biometric UX | Registration wizard, entity_graph, context switching |
| **003** | Dynamic Form Engine | JSON-to-UI component, no hardcoded forms |
| **004** | Luxury Marketplace & AI Chatbot | Discovery engine, storefront, omnipresent chatbot |
| **005** | Industry Cloud Orchestration | Dynamic UI based on tenant industry |
| **006** | Multi-Agent AI Orchestrator | Tenant memory isolation, agent specialization, action execution |
| **007** | Layer 0 Smart Contracts & Audit | Fractional payments, immutable hash chain, tamper detection |
| **008** | Mobile Super-App | Single app, context switching, haptic luxury, offline-first |
| **009** | Zero-Downtime CI/CD | Blue/green deployments, edge caching, disaster recovery |
| **010** | Universal Migration Engine | AI CSV mapping, legacy imports (Fresha/Mindbody/Shopify) |
| **011** | God Mode Admin | Global telemetry, infrastructure health, freeze tenant |

---

## 9. 90-DAY SPRINT MATRIX (PHASED BUILD)

| Sprint | Days | Goal | Prompts |
|--------|------|------|---------|
| **Sprint 0** | 1 | Monorepo genesis, Supabase init, first migration | Manual terminal commands |
| **Sprint 1** | 1-15 | Core substrate (bulletproof DB, RLS, multi-tenancy) | 001, 002 |
| **Sprint 2** | 16-30 | Business engine & ledger (dynamic forms, fractional payments) | 003, 007 |
| **Sprint 3** | 31-45 | Consumer super-app (marketplace, mobile, industry clouds) | 004, 005, 008 |
| **Sprint 4** | 46-60 | Intelligence injection (AI swarm, chatbot, actions) | 006 |
| **Sprint 5** | 61-75 | Mass migration & control (importer, god mode) | 010, 011 |
| **Sprint 6** | 76-90 | Hardening, CI/CD, global edge deployment | 009 |

### Architect's Checkpoints (DO NOT PROCEED WITHOUT THESE)

- **Sprint 1 Gate:** User A cannot query Tenant B's data in Supabase.
- **Sprint 2 Gate:** Dynamic form renders from JSON; payment split hits ledger + audit.
- **Sprint 3 Gate:** Marketplace scroll is 60fps; context switching works.
- **Sprint 4 Gate:** AI chatbot can book an appointment via natural language.
- **Sprint 5 Gate:** CSV import populates CRM; freeze tenant returns 403.
- **Sprint 6 Gate:** CI/CD deploys without dropping a single request.

---

## 10. MONOREPO GENESIS (SPRINT 0 COMMANDS)

Execute these manually. Do not delegate to AI.

### 10.1 Folder Structure (Turborepo)
```
kora-os/
├── apps/
│   ├── web-consumer/      # Luxury Marketplace (Next.js)
│   ├── web-business/      # OS Dashboard (Next.js)
│   ├── mobile-superapp/   # React Native / Expo
│   └── admin-godmode/     # Super-Admin (Next.js)
├── packages/
│   ├── ui/                # Shared components (Tailwind/Radix)
│   ├── database/          # Supabase client, migrations, types
│   ├── ai-orchestrator/   # LangChain/Agent logic
│   ├── blockchain-core/   # Smart contracts, audit hashing
│   └── config/            # ESLint, Prettier, TSConfig
└── package.json
```

### 10.2 Terminal Commands
```bash
npx create-turbo@latest kora-os
cd kora-os
npx supabase init
npx supabase start
npm install tailwindcss postcss autoprefixer framer-motion lucide-react
npx supabase migration new 001_genesis_tenancy_identity
```

---

## 11. VALIDATION CHECKPOINTS (THE ARCHITECT'S GATE)

### 11.1 Rejection Responses

| Violation | Response |
|-----------|----------|
| Ugly/unstyled form, standard HTML table | `REJECTED. Violated luxury UI + 12-year-old mandate. Rewrite.` |
| Schema without RLS or double-entry ledger | `REJECTED. Violated Layer A/E. No financial column updates. Double-entry only.` |
| Technical jargon on user screen | `REJECTED. Zero technical jargon. Translate to plain human action.` |
| Monolithic 2000-line component | `REJECTED. Break into modular, reusable components.` |
| AI prompt without tenant isolation | `REJECTED. Fatal security error. tenant_id must hard-filter context.` |
| `balance` column on any table | `REJECTED. Balance is derived from ledger_entries. Remove the column.` |

### 11.2 Daily Discipline
1. Never accept monolithic files.
2. Enforce the 12-Year-Old Rule daily.
3. Test isolation frequently — Tenant A must never access Tenant B's data.
4. If isolation fails → STOP all UI work → fix RLS policies first.

---

## 🚨 FINAL DIRECTIVE

This document **v2.0** is the single source of truth for Project Kora.

- All prior documents (`KORA_SINGLE_SOURCE_OF_TRUTH_FINAL.md`, `KORA_SINGLE_SOURCE_OR_TRUTH_FINAL.md`, `db/migrations.sql`) are superseded.
- All 12 inconsistencies logged above have been resolved.
- The schema is non-contradictory, deduplicated, and RLS-complete.

**✅ KORA UNIFIED SOURCE OF TRUTH v2.0 PRODUCED. AWAITING APPROVAL BEFORE CODE GENERATION.**

---
*End of Unified Source of Truth v2.0*
