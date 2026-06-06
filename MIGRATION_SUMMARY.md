# KORA COMPLETE MIGRATION SUMMARY
## All 14 Migrations - Ready to Run

**Total Files:** 14 migration files + 1 master runner  
**Total Tables:** 133+ tables  
**All with RLS:** ✅ Row Level Security enabled  

---

## MIGRATION FILES CONFIRMED

✅ **001_genesis_full_schema.sql** (19 tables)
- Core foundation
- Helper function: `kora_current_tenant_id()`
- Global currencies, billing plans, tenants, entity graph
- Event stream, wallets, ledger entries, AI orchestrator
- Services, products, bookings, business profiles

✅ **002_rbac_permissions.sql** (4 tables)
- Roles (50+ pre-seeded system roles)
- Permissions (200+ actions across all modules)
- Role permissions matrix
- User role assignments

✅ **003_universal_mdm.sql** (10 tables)
- Addresses, contacts, persons, organizations
- Complete industry taxonomy (20+ company categories, 20+ freelancer categories)
- Branches, departments, teams, team members

✅ **004_verification_trust.sql** (4 tables)
- Organization verifications (KYC/KYB)
- Biometric profiles
- User documents
- Trust scores

✅ **005_hrm_core.sql** (7 tables)
- Employees, contracts, shifts
- Attendance (with biometric clock-in)
- Leave management
- Payroll, performance reviews, staff rewards

✅ **006_workflow_approvals.sql** (7 tables)
- Workflow templates, steps, instances
- Workflow actions
- Approval policies, levels, rules, approvals

✅ **007_finance_erp.sql** (6 tables)
- Chart of accounts, journal entries
- Budgets, bank accounts
- Bank transactions, reconciliation

✅ **008_procurement_inventory.sql** (11 tables)
- Vendors, purchase requests, RFQ
- Vendor quotes, purchase orders
- Goods received notes
- Warehouses, inventory items, stock movements, batches

✅ **009_crm_erp.sql** (7 tables)
- CRM leads, opportunities, pipelines
- Deal stages, activities
- Contact interactions, notes

✅ **010_booking_communications.sql** (12 tables)
- Appointments, availability, slot templates
- Notifications, notification preferences
- Conversations, messages, message attachments
- Email templates, SMS logs

✅ **011_ai_blockchain_security.sql** (9 tables)
- AI assistant contexts (global learning)
- Blockchain blocks, transactions
- Smart contracts, contract executions
- Security events, fraud detection rules, fraud alerts

✅ **012_content_media_multilang.sql** (11 tables)
- AI content generations (13 content types)
- Media library, social media accounts, social posts
- Blog posts, landing pages
- Languages (17+), currencies extended, countries (flags + phone codes)
- Phone verification, unverified account cleanup

✅ **013_subscription_ai_management.sql** (8 tables)
- Subscription module access (plan-based permissions)
- AI resource allocations (token limits)
- AI usage logs
- Customer behavior profiles (churn/loyalty scoring)
- AI recommendations, business predictions
- ML training data, subscription upgrade triggers

✅ **014_settings_cms_omnichannel.sql** (18 tables)
- Global theme settings (5 themes)
- User settings, tenant settings, admin settings
- CMS components, CMS templates, landing pages
- Chatbots, chatbot conversations, chatbot messages
- Communication channels, messages unified
- Landing page analytics, AI SEO optimization
- AI trend monitoring, notification templates

---

## HOW TO RUN

### Option 1: Supabase SQL Editor (RECOMMENDED)
1. Open https://supabase.com → Your Project
2. Go to **Database** → **SQL Editor**
3. Run each file **in order** (001 through 014)
4. Wait for "Success" after each
5. Run verification queries (below)

### Option 2: Command Line (if you have psql)
```bash
cd c:\Users\hp\Downloads\KORA\db

# Set your connection string
set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Run the batch script
run_migrations.bat
```

---

## VERIFICATION QUERIES

After running all migrations, run these in SQL Editor:

```sql
-- Should return 133+ tables
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Should show many tables with RLS enabled
SELECT COUNT(*) AS rls_enabled_tables
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Should show all tenant isolation policies
SELECT COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public';

-- Verify helper function exists
SELECT kora_current_tenant_id();
-- Should return NULL (before login) or UUID (after login)

-- Check default data
SELECT * FROM billing_plans; -- Should show 4 plans
SELECT * FROM global_currencies; -- Should show 10+ currencies
SELECT * FROM languages; -- Should show 17+ languages
SELECT * FROM countries; -- Should show 15+ countries
SELECT * FROM global_theme_settings; -- Should show 5 themes
```

---

## MIGRATION ORDER (CRITICAL)

**DO NOT change the order!** Each migration depends on previous ones:

1. 001 → Core foundation (creates helper function)
2. 002 → RBAC (uses tenants from 001)
3. 003 → MDM (uses tenants, references 002)
4. 004 → Verification (uses organizations from 003)
5. 005 → HRM (uses employees, departments from 003)
6. 006 → Workflow (uses entity_graph from 001)
7. 007 → Finance (uses tenants from 001)
8. 008 → Procurement (uses employees, warehouses)
9. 009 → CRM (uses entity_graph, organizations)
10. 010 → Bookings (uses services from 001)
11. 011 → AI & Blockchain (uses tenants, entity_graph)
12. 012 → Content & Media (uses tenants, media)
13. 013 → Subscriptions (uses billing_plans, tenants)
14. 014 → Settings & CMS (uses everything)

---

## TROUBLESHOOTING

**Error: "extension pgcrypto does not exist"**
- Run first: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`

**Error: "function kora_current_tenant_id does not exist"**
- Migration 001 didn't complete successfully
- Re-run migration 001

**Error: "relation does not exist"**
- You skipped a migration or ran them out of order
- Start over and run in sequence

**Error: "duplicate key value"**
- Default data already inserted (safe to ignore)
- Or you ran the migration twice

---

## AFTER MIGRATION

1. ✅ Update `.env.local` with your Supabase URL and keys
2. ✅ Set up Supabase Storage buckets (media, documents, avatars)
3. ✅ Configure authentication providers
4. ✅ Connect frontend to Supabase
5. ✅ Test RLS policies with test users
6. ✅ Deploy to production

---

## SUPPORT

All migrations are:
- ✅ Idempotent (safe to re-run with `IF NOT EXISTS`)
- ✅ RLS-protected (tenant isolation enforced)
- ✅ Indexed (performance optimized)
- ✅ Foreign keys (referential integrity)
- ✅ Check constraints (data validation)

**Status:** READY TO MIGRATE ✅

---

**Last Updated:** $(date +%Y-%m-%d)
