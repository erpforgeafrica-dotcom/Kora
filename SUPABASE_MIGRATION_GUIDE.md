# SUPABASE MIGRATION GUIDE - KORA DATABASE DEPLOYMENT

**Project**: KORA - Fresha++ Global Business Operating System  
**Target Database**: PostgreSQL 15 (Supabase)  
**Project Reference**: `zihocnhvtgodnawnvoyj`  
**Status**: Ready for Migration  

---

## SECTION 1: PRE-MIGRATION SETUP

### 1.1 Install Supabase CLI

```bash
# Windows (using Scoop, Chocolatey, or download)
scoop install supabase

# macOS
brew install supabase/tap/supabase

# Linux
brew install supabase/tap/supabase

# Or download directly
https://github.com/supabase/cli/releases
```

### 1.2 Verify Installation

```bash
supabase --version
# Should output: supabase CLI vX.XX.X
```

### 1.3 Create Project Folder Structure

```bash
# Navigate to your project
cd c:\Users\hp\Downloads\KORA

# Initialize Supabase locally
supabase init
# Creates: supabase/ folder with config.toml

# Directory structure should be:
# KORA/
# ├── supabase/
# │   ├── config.toml
# │   ├── seed.sql (optional)
# │   └── migrations/
# │       ├── 001_genesis_full_schema.sql
# │       ├── 002_rbac_permissions.sql
# │       ├── ... (010 total)
# └── db/
#     ├── 001_genesis_full_schema.sql
#     ├── ... (existing files)
```

### 1.4 Copy Migration Files to Supabase Structure

```bash
# Copy all migrations to supabase/migrations/
copy db\*.sql supabase\migrations\

# Verify all 10 files are copied
dir supabase\migrations\
# Should show: 001_genesis_full_schema.sql through 010_booking_communications.sql
```

---

## SECTION 2: SUPABASE AUTHENTICATION

### 2.1 Create/Access Supabase Account

```bash
# If not logged in, login to Supabase
supabase login
# Opens browser for authentication
# Paste the verification token when prompted
```

### 2.2 Link to Existing Project

```bash
# Link to your existing Supabase project
supabase link --project-ref zihocnhvtgodnawnvoyj

# When prompted:
# - Enter your Supabase database password
# - Confirm linking

# This creates:
# - .env.local with database credentials
# - Remote project link
```

### 2.3 Verify Connection

```bash
# Test connection to Supabase
supabase status

# Should output:
# Connected to project: zihocnhvtgodnawnvoyj
# Supabase URL: https://zihocnhvtgodnawnvoyj.supabase.co
```

---

## SECTION 3: MIGRATION EXECUTION

### 3.1 Option A: Push All Migrations (Recommended)

```bash
# Start Supabase development environment locally (optional)
supabase start

# Push migrations to Supabase
supabase db push

# Output should show:
# ✓ Pushed 10 migrations
# ✓ Connected to project zihocnhvtgodnawnvoyj
```

### 3.2 Option B: Push Migrations Individually (Safer)

```bash
# Create a migration first
supabase migration new init_kora

# This creates a timestamped migration file in supabase/migrations/
# Then copy content from 001_genesis_full_schema.sql

# Push the migration
supabase db push

# Repeat for each migration (001-010)
```

### 3.3 Option C: Execute SQL Files Directly (If CLI Issues)

```bash
# Using psql (PostgreSQL client)
# First, install psql if not already installed

# Connect and execute migrations
psql -U postgres \
  -h db.zihocnhvtgodnawnvoyj.supabase.co \
  -p 5432 \
  -d postgres \
  -W

# When prompted for password, enter your Supabase database password

# Then run each SQL file:
\i 001_genesis_full_schema.sql
\i 002_rbac_permissions.sql
\i 003_universal_mdm.sql
... (repeat for all 10 files)

# Verify migrations ran
\d  # List all tables
\l  # List databases
```

---

## SECTION 4: VERIFICATION STEPS

### 4.1 Verify Table Creation in Supabase Dashboard

```
1. Open: https://app.supabase.com
2. Select project: zihocnhvtgodnawnvoyj
3. Navigate to: SQL Editor or Table Editor
4. Verify tables exist:
   - tenants
   - users
   - roles
   - permissions
   - organizations
   - addresses
   - contacts
   - workflow_templates
   - workflow_instances
   - employees
   - chart_of_accounts
   - vendors
   - purchases_orders
   - customers
   - leads
   - opportunities
   - bookings
   - notifications
   ... (and 50+ more tables)
```

### 4.2 Verify RLS Policies

```sql
-- Query to verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
LIMIT 10;

-- Should return 50+ tables with rowsecurity = true
```

### 4.3 Verify Foreign Keys

```sql
-- Query to verify relationships
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
  AND foreign_table_name IS NOT NULL
LIMIT 20;

-- Should show relationships like:
-- tenant_organizations → tenants
-- user_roles → roles, users
-- workflow_instances → workflow_templates
```

### 4.4 Verify Indexes

```sql
-- Count indexes created
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public';

-- Should have 100+ indexes for performance
```

### 4.5 Test Multi-Tenant Isolation

```sql
-- Create test tenant
INSERT INTO tenants (name, tenant_code, base_currency)
VALUES ('Test Organization', 'test-org-001', 'USD')
RETURNING id;

-- Get the tenant_id from above query
-- Example: d12e4567-e89b-12d3-a456-426614174000

-- Test RLS by selecting with tenant context
-- (Only works if authenticated as that tenant's user)

SET "app.current_tenant_id" = 'd12e4567-e89b-12d3-a456-426614174000';

SELECT * FROM organizations
WHERE tenant_id = kora_current_tenant_id();

-- Should return 0 rows if not authenticated
-- Or return only that tenant's data if authenticated
```

### 4.6 Verify Data Integrity

```sql
-- Check for orphaned records (should be 0)
SELECT COUNT(*) FROM organizations 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- Check for missing required fields
SELECT COUNT(*) FROM users 
WHERE email IS NULL OR tenant_id IS NULL;

-- Check for invalid UUIDs
SELECT COUNT(*) FROM addresses 
WHERE id IS NULL;
```

---

## SECTION 5: TROUBLESHOOTING

### Issue 1: Authentication Failed

```bash
# Solution: Re-authenticate
supabase logout
supabase login
supabase link --project-ref zihocnhvtgodnawnvoyj
```

### Issue 2: Migration Conflicts

```bash
# Check status
supabase migration list

# If conflicts occur, reset and retry
supabase db reset

# Then push again
supabase db push
```

### Issue 3: RLS Policy Errors

```sql
-- Check which policies failed
SELECT tablename, policyname, permissive, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Recreate any missing policies
CREATE POLICY policy_name ON table_name
FOR ALL TO authenticated
USING (tenant_id = kora_current_tenant_id());
```

### Issue 4: Foreign Key Constraint Violations

```sql
-- Disable temporarily to insert data
ALTER TABLE organizations DISABLE TRIGGER ALL;
INSERT INTO organizations VALUES (...);
ALTER TABLE organizations ENABLE TRIGGER ALL;

-- Or insert in correct order (tenants first, then organizations)
```

### Issue 5: Password Reset

```bash
# If Supabase password forgotten, reset via web console
# 1. Go to: https://app.supabase.com/project/zihocnhvtgodnawnvoyj/settings/database
# 2. Click "Reset database password"
# 3. Confirm reset
# 4. Update .env.local with new password
```

---

## SECTION 6: POST-MIGRATION CONFIGURATION

### 6.1 Enable Row Level Security

```sql
-- Verify RLS is enabled globally (should already be from migrations)
SELECT current_setting('rls.ignore_row_security_for_super_user')::boolean 
as rls_enforced;

-- Should return: true
```

### 6.2 Create Service Role Key

```
1. Go to: https://app.supabase.com/project/zihocnhvtgodnawnvoyj/settings/api
2. Copy "Service Role" (with full database access)
3. Store in .env.production:
   SUPABASE_SERVICE_ROLE_KEY=<paste_key_here>
```

### 6.3 Create Anon Key

```
1. Go to: https://app.supabase.com/project/zihocnhvtgodnawnvoyj/settings/api
2. Copy "Anon Public" key
3. Store in .env.local:
   SUPABASE_ANON_KEY=<paste_key_here>
```

### 6.4 Store URL

```
1. Project URL: https://zihocnhvtgodnawnvoyj.supabase.co
2. Store in .env.local:
   SUPABASE_URL=https://zihocnhvtgodnawnvoyj.supabase.co
```

### 6.5 Create .env File

```bash
# .env.local
SUPABASE_URL=https://zihocnhvtgodnawnvoyj.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## SECTION 7: BACKUP & RECOVERY

### 7.1 Create Automated Backups

```
1. Go to: https://app.supabase.com/project/zihocnhvtgodnawnvoyj/settings/backups
2. Enable "Automated Backups"
3. Set backup frequency: Daily
4. Retention period: 7 days (minimum)
```

### 7.2 Manual Backup

```bash
# Create full database backup
pg_dump --user=postgres \
  --host=db.zihocnhvtgodnawnvoyj.supabase.co \
  --port=5432 \
  --format=custom \
  --file=backup_$(date +%Y%m%d).sql \
  postgres

# Prompts for password (use Supabase database password)
```

### 7.3 Restore from Backup

```bash
# Restore to new database
pg_restore --user=postgres \
  --host=db.zihocnhvtgodnawnvoyj.supabase.co \
  --port=5432 \
  --format=custom \
  --dbname=postgres \
  backup_20260603.sql

# Or via Supabase dashboard:
# 1. Go to Backups tab
# 2. Click "Restore" on desired backup date
```

---

## SECTION 8: MONITORING & MAINTENANCE

### 8.1 Monitor Query Performance

```bash
# Enable query logging
supabase db logs --local

# Or view in Supabase dashboard
# Go to: SQL Editor > Logs
```

### 8.2 Monitor Database Size

```sql
-- Check total database size
SELECT 
  sum(pg_database.datsize) / 1024 / 1024 / 1024 AS size_gb
FROM (
  SELECT pg_database_size(datname) as datsize
  FROM pg_database
) as pg_database;
```

### 8.3 Monitor RLS Overhead

```sql
-- Count active RLS policies
SELECT COUNT(*) as rls_policy_count
FROM pg_policies
WHERE schemaname = 'public';

-- Should be ~50 policies (1-2 per table with tenant isolation)
```

### 8.4 Optimize Indexes

```sql
-- Find unused indexes
SELECT * FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_blks_read DESC;

-- If found, consider dropping:
-- DROP INDEX IF EXISTS index_name;
```

---

## SECTION 9: NEXT STEPS POST-MIGRATION

### 9.1 Seed Initial Data

```bash
# Create seed.sql with system data
cat > supabase/seed.sql << 'EOF'
-- Seed system roles
INSERT INTO roles (name, slug, scope, is_system) VALUES
('Platform Owner', 'platform_owner', 'PLATFORM', TRUE),
('Organization Owner', 'org_owner', 'ORGANIZATION', TRUE),
('Manager', 'manager', 'DEPARTMENT', TRUE),
('Staff', 'staff', 'DEPARTMENT', TRUE),
('Customer', 'customer', 'SELF', TRUE);

-- Seed initial currencies
INSERT INTO global_currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('NGN', 'Nigerian Naira', '₦', 2);

-- Seed billing plans
INSERT INTO billing_plans (name, max_users, storage_mb, ai_tokens_mo) VALUES
('BASIC', 1, 512, 5000),
('ESSENTIAL', 5, 10240, 100000),
('PROFESSIONAL', 50, 256000, 2000000);
EOF

# Push seed data
supabase db push --seed
```

### 9.2 Create API Routes

Update your backend to connect to Supabase:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 9.3 Implement Services

```typescript
// src/services/finance/InvoiceService.ts
import { supabase } from '@/lib/supabase';

export class InvoiceService {
  async createInvoice(invoice: CreateInvoiceInput) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  async getInvoices(tenantId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    return data;
  }
}
```

### 9.4 Update Frontend

```typescript
// src/context/AuthContext.tsx
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });
    
    return () => listener?.unsubscribe();
  }, []);
  
  return { session };
}
```

### 9.5 Test Full Stack

```bash
# 1. Start development server
npm run dev

# 2. Test login
# Go to http://localhost:5173
# Create test account

# 3. Verify data in Supabase
# Go to SQL Editor
# SELECT * FROM users WHERE email = 'test@example.com';

# 4. Test CRUD operations
# Create, read, update, delete records via UI
```

---

## SECTION 10: DEPLOYMENT CHECKLIST

Before going to production:

- [ ] All 10 migrations executed successfully
- [ ] All 50+ tables created with correct schema
- [ ] All RLS policies enabled and tested
- [ ] All foreign keys intact
- [ ] All indexes created for performance
- [ ] Test tenant created and isolation verified
- [ ] Service role key generated and stored
- [ ] Anon key generated and stored
- [ ] Automated backups configured
- [ ] Seed data inserted
- [ ] API services connected to Supabase
- [ ] Frontend authentication working
- [ ] Full CRUD operations tested
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## FINAL COMMANDS SUMMARY

```bash
# 1. Initialize
supabase init

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref zihocnhvtgodnawnvoyj

# 4. Push migrations
supabase db push

# 5. Verify
supabase status

# 6. Start development (optional)
supabase start

# 7. Test locally
supabase db test

# 8. Push to production (when ready)
supabase db push --linked
```

---

**Migration Ready**: ✅  
**Estimated Time**: 5-10 minutes  
**Support**: Contact support@supabase.io if issues occur  

**Next**: Begin execution with Step 1 (Pre-Migration Setup)
