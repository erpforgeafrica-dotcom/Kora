# KORA DATABASE MIGRATION GUIDE
## Step-by-Step Instructions for Supabase

**Total Migrations:** 14  
**Total Tables:** 133+  
**Estimated Time:** 10-15 minutes

---

## PREREQUISITES

1. **Supabase Project Created**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and anon key

2. **Database Access**
   - Navigate to Database → SQL Editor
   - Or use `psql` command-line tool

3. **Files Ready**
   - All 14 migration files in `/db/` folder
   - Files numbered: 001 through 014

---

## OPTION 1: RUN ALL MIGRATIONS AT ONCE (RECOMMENDED)

### Method A: Using Supabase SQL Editor

1. Open Supabase Dashboard
2. Go to **Database** → **SQL Editor**
3. Click **New Query**
4. Copy and paste each migration file content **in order**:
   - `001_genesis_full_schema.sql`
   - `002_rbac_permissions.sql`
   - `003_universal_mdm.sql`
   - `004_verification_trust.sql`
   - `005_hrm_core.sql`
   - `006_workflow_approvals.sql`
   - `007_finance_erp.sql`
   - `008_procurement_inventory.sql`
   - `009_crm_erp.sql`
   - `010_booking_communications.sql`
   - `011_ai_blockchain_security.sql`
   - `012_content_media_multilang.sql`
   - `013_subscription_ai_management.sql`
   - `014_settings_cms_omnichannel.sql`
5. Click **Run** after each file
6. Wait for "Success" message before proceeding to next

### Method B: Using psql Command Line

```bash
# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Navigate to db folder
cd db

# Run migrations in sequence
psql $DATABASE_URL -f 001_genesis_full_schema.sql
psql $DATABASE_URL -f 002_rbac_permissions.sql
psql $DATABASE_URL -f 003_universal_mdm.sql
psql $DATABASE_URL -f 004_verification_trust.sql
psql $DATABASE_URL -f 005_hrm_core.sql
psql $DATABASE_URL -f 006_workflow_approvals.sql
psql $DATABASE_URL -f 007_finance_erp.sql
psql $DATABASE_URL -f 008_procurement_inventory.sql
psql $DATABASE_URL -f 009_crm_erp.sql
psql $DATABASE_URL -f 010_booking_communications.sql
psql $DATABASE_URL -f 011_ai_blockchain_security.sql
psql $DATABASE_URL -f 012_content_media_multilang.sql
psql $DATABASE_URL -f 013_subscription_ai_management.sql
psql $DATABASE_URL -f 014_settings_cms_omnichannel.sql

echo "✅ All migrations completed!"
```

---

## OPTION 2: RUN SINGLE MASTER MIGRATION

**Note:** This uses PostgreSQL `\i` command which may not work in Supabase SQL Editor.  
Only use with `psql` command line.

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run master migration
psql $DATABASE_URL -f 000_master_migration.sql
```

---

## VERIFICATION STEPS

After running all migrations, verify everything is set up correctly:

### 1. Check Table Count

```sql
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

**Expected Result:** 133+ tables

### 2. Verify Row Level Security

```sql
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
```

**Expected Result:** All tenant-scoped tables should have RLS enabled

### 3. Check RLS Policies

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:** Multiple policies for tenant isolation

### 4. Verify Helper Function

```sql
SELECT kora_current_tenant_id();
```

**Expected Result:** NULL (before authentication) or UUID (after login)

### 5. Check Default Data

```sql
-- Check billing plans
SELECT * FROM billing_plans;

-- Check global currencies
SELECT * FROM global_currencies;

-- Check languages
SELECT * FROM languages;

-- Check countries
SELECT * FROM countries;

-- Check theme settings
SELECT * FROM global_theme_settings;
```

**Expected Result:** Default data populated in all tables

---

## TROUBLESHOOTING

### Error: "extension pgcrypto does not exist"

**Solution:** Enable extensions manually first:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "function kora_current_tenant_id() does not exist"

**Solution:** Ensure migration 001 ran successfully. Re-run:

```sql
CREATE OR REPLACE FUNCTION kora_current_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id
  FROM   entity_graph
  WHERE  auth_user_id = auth.uid()
  LIMIT  1;
$$;

GRANT EXECUTE ON FUNCTION kora_current_tenant_id() TO authenticated;
```

### Error: "relation does not exist"

**Solution:** Migrations must run in order. Check which migration failed and re-run from that point.

### Error: "row level security policy already exists"

**Solution:** This is fine - it means the policy was already created. Continue with next migration.

### Error: "duplicate key value violates unique constraint"

**Solution:** Default data was already inserted. This is fine - continue with next migration.

---

## POST-MIGRATION: CONFIGURE SUPABASE

### 1. Enable Realtime (Optional)

Go to **Database** → **Replication** and enable realtime for tables you want to subscribe to:
- `bookings`
- `messages_unified`
- `chatbot_conversations`
- `notifications`

### 2. Set Up Storage Buckets

Go to **Storage** and create buckets:
- `media` (for media_library uploads)
- `documents` (for document uploads)
- `avatars` (for profile pictures)

**Bucket Policies:**
```sql
-- Allow authenticated users to upload to their tenant folder
CREATE POLICY "Tenant upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = kora_current_tenant_id()::text
);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

### 3. Configure Authentication

Go to **Authentication** → **Providers** and enable:
- Email (default)
- Google OAuth (optional)
- Facebook OAuth (optional)

### 4. Set Environment Variables

In your `.env.local` file:

```bash
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
GEMINI_API_KEY=[YOUR-GEMINI-API-KEY]
```

---

## MIGRATION SUMMARY

| Migration | Tables | Purpose | Time |
|-----------|--------|---------|------|
| 001 | 19 | Core Foundation | 2 min |
| 002 | 4 | RBAC Permissions | 1 min |
| 003 | 10 | Universal MDM | 2 min |
| 004 | 4 | Verification | 1 min |
| 005 | 7 | HRM Core | 1 min |
| 006 | 7 | Workflow | 1 min |
| 007 | 6 | Finance ERP | 1 min |
| 008 | 11 | Procurement | 2 min |
| 009 | 7 | CRM ERP | 1 min |
| 010 | 12 | Booking | 2 min |
| 011 | 9 | AI & Blockchain | 2 min |
| 012 | 11 | Content & Media | 2 min |
| 013 | 8 | Subscriptions | 1 min |
| 014 | 18 | Settings & CMS | 2 min |
| **Total** | **133+** | **Complete System** | **~15 min** |

---

## NEXT STEPS AFTER MIGRATION

1. ✅ Connect frontend to Supabase
2. ✅ Set up authentication flow
3. ✅ Test RLS policies
4. ✅ Seed test data
5. ✅ Deploy to production

---

## ROLLBACK (IF NEEDED)

If something goes wrong and you need to start over:

```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run all migrations from the beginning.

---

## SUPPORT

If you encounter issues:
1. Check Supabase logs in Dashboard → Database → Logs
2. Verify migration order was followed
3. Check PostgreSQL version (must be 15+)
4. Ensure extensions are enabled

---

**Migration Guide Version:** 1.0  
**Last Updated:** $(date +%Y-%m-%d)  
**Status:** Production Ready ✅
