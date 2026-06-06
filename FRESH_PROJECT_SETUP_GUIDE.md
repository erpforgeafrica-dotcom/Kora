# KORA Fresh Project Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Enter:
   - **Name**: KORA
   - **Database Password**: (save securely)
   - **Region**: (closest to you)
4. Wait 2 minutes for provisioning

### Step 2: Pre-Flight Check

Run this in your **NEW** project's SQL Editor:

```sql
-- Verify project is empty/fresh
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT IN ('schema_migrations'); -- Supabase internal

-- Expected result: 0 or 1 (only schema_migrations is okay)
```

**If you see more than 1 table, STOP - This project is not empty!**

### Step 3: Run Migrations Sequentially

Copy and paste each migration file **one at a time** in Supabase SQL Editor:

#### Migration 001 (Foundation) - CRITICAL
```bash
File: db/001_genesis_full_schema.sql
```
- Creates `kora_current_tenant_id()` helper function (REQUIRED for all RLS)
- Creates tenants, entity_graph, ledger_entries, services, products, bookings
- Enables RLS on all 19 tables

**Verification Query:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'kora_current_tenant_id';
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM entity_graph;
```
✅ Expected: Function exists, tables exist (0 rows is fine)

---

#### Migration 002 (RBAC)
```bash
File: db/002_rbac_permissions.sql
```
- Creates roles, permissions, role_permissions, user_roles
- Seeds 50+ system roles
- Seeds 200+ permissions

**Verification Query:**
```sql
SELECT COUNT(*) FROM roles WHERE is_system = TRUE;
SELECT COUNT(*) FROM permissions;
```
✅ Expected: ~50 roles, ~200+ permissions

---

#### Migration 003 (Master Data Management)
```bash
File: db/003_universal_mdm.sql
```
- Creates addresses, contacts, persons, organizations
- Creates branches, departments, teams, team_members
- Complete industry taxonomy

**Verification Query:**
```sql
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM persons;
```
✅ Expected: Tables exist (0 rows is fine)

---

#### Migration 004 (Verification & Trust)
```bash
File: db/004_verification_trust.sql
```

**Verification Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%verification%' OR table_name LIKE '%biometric%';
```

---

#### Migration 005 (HRM Core)
```bash
File: db/005_hrm_core.sql
```

**Verification Query:**
```sql
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('employees', 'attendance', 'payroll');
```

---

#### Migration 006 (Workflow & Approvals)
```bash
File: db/006_workflow_approvals.sql
```

---

#### Migration 007 (Finance ERP)
```bash
File: db/007_finance_erp.sql
```

---

#### Migration 008 (Procurement & Inventory)
```bash
File: db/008_procurement_inventory.sql
```

---

#### Migration 009 (CRM ERP)
```bash
File: db/009_crm_erp.sql
```

---

#### Migration 010 (Booking & Communications)
```bash
File: db/010_booking_communications.sql
```

---

#### Migration 011 (AI, Blockchain, Security)
```bash
File: db/011_ai_blockchain_security.sql
```

---

#### Migration 012 (Content, Media, Multi-language)
```bash
File: db/012_content_media_multilang.sql
```

---

#### Migration 013 (Subscription & AI Management)
```bash
File: db/013_subscription_ai_management.sql
```

---

#### Migration 014 (Settings, CMS, Omnichannel)
```bash
File: db/014_settings_cms_omnichannel.sql
```

---

### Step 4: Final Verification

Run this comprehensive check:

```sql
-- 1. Check helper function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'kora_current_tenant_id';

-- 2. Count all tables
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Expected: 133+ tables

-- 3. Check RLS is enabled on all tenant-scoped tables
SELECT 
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(pol.polname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy pol ON pol.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
GROUP BY c.relname, c.relrowsecurity
HAVING c.relrowsecurity = FALSE
ORDER BY c.relname;

-- Expected: Empty result (all tables should have RLS enabled)

-- 4. List all RLS policies
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- Expected: Most tables should have at least 1 policy
```

---

## ⚠️ Troubleshooting

### Error: "relation X does not exist"
**Cause**: Skipped a migration or ran out of order
**Fix**: Start over with fresh project OR manually create missing table

### Error: "function kora_current_tenant_id does not exist"
**Cause**: Migration 001 didn't complete
**Fix**: Run migration 001 again (it's idempotent with IF NOT EXISTS)

### Error: "duplicate key value violates unique constraint"
**Cause**: Running same migration twice
**Fix**: Safe to ignore if using ON CONFLICT DO NOTHING

### RLS Errors: "new row violates row-level security policy"
**Cause**: Trying to insert data without proper tenant context
**Fix**: Ensure entity_graph has records linking auth.uid() to tenant_id

---

## 🎯 Success Checklist

- [ ] New Supabase project created
- [ ] Pre-flight check shows 0 tables
- [ ] Migration 001 completed (helper function exists)
- [ ] Migration 002 completed (roles & permissions seeded)
- [ ] Migration 003 completed (MDM tables exist)
- [ ] Migrations 004-014 completed sequentially
- [ ] Final verification shows 133+ tables
- [ ] All tenant-scoped tables have RLS enabled
- [ ] All tables have at least 1 RLS policy

---

## 📊 Expected Final State

| Component | Count |
|-----------|-------|
| Total Tables | 133+ |
| System Roles | ~50 |
| Permissions | 200+ |
| RLS Policies | 130+ |
| Helper Functions | 3-5 |

---

## Next Steps After Migration

1. **Create your first tenant**:
```sql
INSERT INTO tenants (name, tenant_code, tier, status)
VALUES ('Demo Company', 'DEMO001', 'BASIC', 'ACTIVE')
RETURNING id;
```

2. **Create entity_graph entry** (links Supabase auth user to tenant):
```sql
INSERT INTO entity_graph (auth_user_id, tenant_id, entity_type, first_name, last_name, email, role)
VALUES (
  'YOUR_AUTH_USER_ID',  -- Get from auth.users table
  'YOUR_TENANT_ID',      -- From step 1
  'BUSINESS_OWNER',
  'John',
  'Doe',
  'john@example.com',
  'OWNER'
);
```

3. **Test RLS is working**:
```sql
-- This should only return data for your tenant
SELECT * FROM tenants;
SELECT * FROM services;
```

---

## 🆘 Need Help?

If migrations fail:
1. Copy the error message
2. Note which migration number failed
3. Check which line in the SQL file caused the error
4. Common fixes:
   - Missing dependencies → Run earlier migrations
   - Syntax errors → Check PostgreSQL version compatibility
   - RLS errors → Verify helper function exists
