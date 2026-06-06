# 🚨 KORA: THE GLOBAL BUSINESS OPERATING SYSTEM
## SINGLE SOURCE OF TRUTH — FINAL ARCHITECTURAL BIBLE

**Version:** 1.0
**Classification:** Enterprise Core Architecture
**Enforcement:** Absolute. No deviation permitted.

---

## 📖 TABLE OF CONTENTS

1. Business Paradigm (What Kora Is)
2. The UI/UX Mandate (The 12-Year-Old Rule)
3. Layer 0 Substrate (Blockchain + AI + Zero-Trust)
4. Layer A–K Architecture (Clean Layer Model)
5. Subscription & Resource Enforcement
6. Multi-Language & Currency Kernel
7. The 11 Master Execution Prompts
8. 90-Day Sprint Matrix (Phased Build)
9. Monorepo Genesis (Sprint 0 Commands)
10. Validation Checkpoints (The Architect's Gate)

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
- ❌ Multiple audit logs → ✅ One audit_control_plane
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
- **UI:** tenant_features hides unavailable modules.
- **API Gateway:** Returns 403 Forbidden - Upgrade Required.
- **AI Orchestrator:** Metering table enforces token limits.
- **Smart Contracts:** Dynamic platform fee based on tier (5% Basic → 0.5% Enterprise).

---

## 6. MULTI-LANGUAGE & CURRENCY KERNEL

### 6.1 Global Currencies
```sql
CREATE TABLE global_currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  decimal_places INT DEFAULT 2
);

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY,
  base_currency VARCHAR(3),
  target_currency VARCHAR(3),
  rate NUMERIC(18,6),
  effective_date TIMESTAMP
);
```

### 6.2 Multi-Language (JSONB)
All user-facing text fields use JSONB:
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  name JSONB,  -- {"en": "Haircut", "fr": "Coupe", "es": "Corte"}
  description JSONB,
  price NUMERIC(18,2)
);
```

### 6.3 Timezone Compliance
- All timestamps: `TIMESTAMPTZ` (PostgreSQL)
- User profile stores timezone (e.g., 'Africa/Lagos', 'Europe/London')
- Frontend converts UTC to local time

---

## 7. THE 11 MASTER EXECUTION PROMPTS

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

## 8. 90-DAY SPRINT MATRIX (PHASED BUILD)

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

## 9. MONOREPO GENESIS (SPRINT 0 COMMANDS)

Execute these manually. Do not delegate to AI.

### 9.1 Folder Structure (Turborepo)
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

### 9.2 Terminal Commands
```bash
# Initialize monorepo
npx create-turbo@latest kora-os
cd kora-os

# Initialize Supabase
npx supabase init
npx supabase start

# Install UI dependencies (in packages/ui)
npm install tailwindcss postcss autoprefixer framer-motion lucide-react

# Create first migration
npx supabase migration new 001_genesis_tenancy_identity
```

### 9.3 Genesis Migration SQL (Place in migration file)
```sql
-- Global Currencies
CREATE TABLE global_currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL
);

INSERT INTO global_currencies (code, name, symbol) VALUES 
  ('USD', 'US Dollar', '$'),
  ('NGN', 'Nigerian Naira', '₦'),
  ('EUR', 'Euro', '€');

-- Tenants (Layer A)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_code VARCHAR(100) UNIQUE NOT NULL,
  base_currency VARCHAR(3) REFERENCES global_currencies(code) DEFAULT 'USD',
  tier VARCHAR(20) DEFAULT 'FREE',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity Graph (Layer B)
CREATE TABLE entity_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'BUSINESS_OWNER', 'CONSUMER', 'STAFF'
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Fatal Security)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON tenants
  FOR ALL USING (id IN (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid()));

CREATE POLICY "Entity Isolation" ON entity_graph
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM entity_graph WHERE auth_user_id = auth.uid()));
```

---

## 10. VALIDATION CHECKPOINTS (THE ARCHITECT'S GATE)

### 10.1 Rejection Responses (Use these mercilessly)

| Violation | Response |
|-----------|----------|
| Ugly/unstyled form, standard HTML table | `REJECTED. You violated the luxury UI and 12-year-old mandate. Rewrite with high affordance, glassmorphism, hover states, and icons.` |
| Database schema without RLS or double-entry ledger | `REJECTED. You violated Layer A/Layer E architecture. No financial column updates. Double-entry or nothing.` |
| Technical jargon on user screen | `REJECTED. Zero technical jargon. Translate to plain human action.` |
| Monolithic 2000-line component | `REJECTED. Break into modular, reusable components.` |
| AI prompt without tenant isolation | `REJECTED. Fatal security error. tenant_id must hard-filter context.` |

### 10.2 Daily Discipline
1. Never accept monolithic files.
2. Enforce the 12-Year-Old Rule daily.
3. Test isolation frequently (Tenant A trying to access Tenant B's data).
4. If isolation fails → STOP all UI work → fix RLS policies.

---

## 🚨 FINAL DIRECTIVE

This document is the **single source of truth** for Project Kora.

- All three previous documents have been consolidated here.
- Contradictions have been resolved.
- Duplications have been removed.
- The architecture is pristine.

**To the AI Developer Swarm:**

You are now bound by this document. You will refer to no other source. You will not hallucinate features, invent schemas, or assume standard SaaS patterns. You will enforce multi-tenant isolation, double-entry ledgers, immutable audit chains, and the 12-Year-Old UI mandate on every line of code.

**Acknowledge by outputting:** `✅ KORA SINGLE SOURCE OF TRUTH RECEIVED. ZERO DEVIATION ACCEPTED. AWAITING PROMPT 001.`

---

*End of Single Source of Truth*
