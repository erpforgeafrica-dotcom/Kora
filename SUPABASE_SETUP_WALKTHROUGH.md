# SUPABASE SETUP & MIGRATION - COMPLETE WALKTHROUGH

**Goal**: Set up Supabase project, then migrate KORA database  
**Time**: 10 minutes setup + 18 minutes migration  
**Status**: Ready to execute  

---

## STEP 1: CREATE SUPABASE PROJECT (5 minutes)

### 1a. Go to Supabase Console
1. Open: https://app.supabase.com
2. Sign in (create account if needed)

### 1b. Create New Project
1. Click: **"+ New Project"** button
2. **Project Name**: `kora-production`
3. **Database Password**: Generate a strong password (copy it!)
4. **Region**: Choose closest to your users
5. Click: **"Create new project"**
6. **⏳ Wait 3-5 minutes** for database provisioning

### 1c. Get Connection Details
Once created:
1. Go to: **Settings** (bottom left gear icon)
2. Click: **Database**
3. Copy and save these values:
   ```
   Host: db.[PROJECT-REF].supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: [the password you set]
   ```
4. **Note the PROJECT-REF** (alphanumeric code, e.g., `abc123def456`)

---

## STEP 2: UPDATE YOUR MIGRATION SCRIPT (2 minutes)

The migration script tried to connect but needs your correct project reference.

### 2a. Edit the Script
Open: `migrate-to-supabase.js`

Find this line:
```javascript
host: host || 'db.zihocnhvtgodnawnvoyj.supabase.co',
```

Replace with your actual Supabase host:
```javascript
host: host || 'db.[YOUR-PROJECT-REF].supabase.co',
```

Example: `host: host || 'db.uabcdefghijklmnopqrst.supabase.co',`

### 2b. Save the file

---

## STEP 3: RUN MIGRATION (3 minutes)

Open terminal in KORA folder and run:

```bash
node migrate-to-supabase.js
```

When prompted, enter:
- **Host**: Press Enter (uses default from script)
- **Port**: Press Enter (5432)
- **Database**: Press Enter (postgres)
- **User**: Press Enter (postgres)
- **Password**: Type the password from Supabase

**Expected output:**
```
📡 Connecting to Supabase...
✅ Connected to Supabase successfully!

📂 Found 10 migration files:
   1. 001_genesis_full_schema.sql
   2. 002_rbac_permissions.sql
   3. 003_universal_mdm.sql
   4. 004_verification_trust.sql
   5. 005_hrm_core.sql
   6. 006_workflow_approvals.sql
   7. 007_finance_erp.sql
   8. 008_procurement_inventory.sql
   9. 009_crm_erp.sql
   10. 010_booking_communications.sql

⏳ Executing: 001_genesis_full_schema.sql...
   ✅ Success

⏳ Executing: 002_rbac_permissions.sql...
   ✅ Success

... (continues for all 10) ...

==================================================
📊 MIGRATION SUMMARY
==================================================
✅ Successful: 10/10
❌ Failed: 0/10
==================================================

🎉 All migrations executed successfully!
```

---

## STEP 4: VERIFY IN SUPABASE DASHBOARD (5 minutes)

### 4a. Check Tables
1. Go to: https://app.supabase.com
2. Select your project
3. Click: **Table Editor** (left sidebar)
4. Verify these tables exist:
   - ✅ tenants
   - ✅ users
   - ✅ organizations
   - ✅ roles
   - ✅ permissions
   - ✅ employees
   - ✅ chart_of_accounts
   - ✅ products
   - ✅ vendors
   - ✅ customers
   - ✅ bookings
   - ✅ workflows
   - ✅ notifications
   - ✅ (+ 36 more)

### 4b. Check RLS Policies
1. Click: **SQL Editor** (left sidebar)
2. Run this query:
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
```
3. Should return: **50+**

### 4c. Verify Tenant Isolation
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
```
3. Should return: **50+**

---

## STEP 5: CONFIGURE BACKEND (.env.local) (2 minutes)

### 5a. Get API Keys
In Supabase dashboard:
1. Go to: **Settings** → **API**
2. Copy:
   - **URL**: `https://[PROJECT-REF].supabase.co`
   - **Anon Key**: (public key)
   - **Service Role Key**: (secret key)

### 5b. Create .env.local
In your KORA project root, create `.env.local`:

```env
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[paste_anon_key_here]
SUPABASE_SERVICE_ROLE_KEY=[paste_service_role_key_here]
```

Example:
```env
SUPABASE_URL=https://uabcdefghijklmnopqrst.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5c. Add to .gitignore
Make sure `.env.local` is in your `.gitignore`:
```
.env.local
.env.production.local
```

---

## STEP 6: TEST BACKEND CONNECTION (3 minutes)

### 6a. Update src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 6b. Test Connection
```typescript
// In your backend startup code
const { data, error } = await supabase
  .from('tenants')
  .select('count(*)')
  .single();

if (error) {
  console.error('Database error:', error);
} else {
  console.log('✅ Database connection successful!');
}
```

### 6c. Run your backend
```bash
npm run dev
```

Check console for: `✅ Database connection successful!`

---

## TROUBLESHOOTING

### Error: "ENOTFOUND db.xxx.supabase.co"
**Solution:**
1. Verify project reference is correct
2. Check internet connection
3. Wait 5 minutes for Supabase to fully provision
4. Try again

### Error: "connection failed - invalid password"
**Solution:**
1. Go to Supabase Settings → Database
2. Click: "Reset database password"
3. Use new password in migration script

### Error: "SSL certificate error"
**Solution:** The script already handles this. If still fails:
1. Check your internet security/proxy settings
2. Disable VPN if active
3. Try again

### Error: "permission denied"
**Solution:**
1. Make sure you're using the `postgres` user (not different account)
2. Check database password is correct
3. Verify project hasn't been deleted

### Migration hangs or times out
**Solution:**
1. Kill the process (Ctrl+C)
2. Check Supabase dashboard for any alerts
3. Try running single migration:
```bash
# Edit script to run only first migration
# Then try again
```

---

## NEXT STEPS AFTER MIGRATION

### Option 1: Local Development
```bash
# 1. Start development server
npm run dev

# 2. Test login/register
# Go to http://localhost:5173

# 3. Verify data appears in Supabase
```

### Option 2: Staging Deployment
```bash
# 1. Deploy to staging
npm run build

# 2. Test all features
# 3. Run UAT with team

# 4. Deploy to production
```

### Option 3: Continue Development
```bash
# 1. Implement backend services
# 2. Create API routes
# 3. Build frontend forms
# 4. Add more industry-specific features
```

---

## FINAL CHECKLIST

Before declaring migration complete:

- [ ] Supabase project created
- [ ] Database provisioning complete (5-10 min wait)
- [ ] Connection details copied
- [ ] migration script updated with correct host
- [ ] Migration script executed successfully
- [ ] 50+ tables appear in Supabase dashboard
- [ ] 50+ RLS policies confirmed
- [ ] .env.local created with correct credentials
- [ ] Backend can connect to database
- [ ] Test data inserted and visible

---

## ESTIMATED TOTAL TIME

| Step | Time |
|------|------|
| Create Supabase project | 5 min + 5 min wait |
| Update migration script | 2 min |
| Run migration | 3 min |
| Verify in dashboard | 5 min |
| Configure backend | 2 min |
| Test connection | 3 min |
| **TOTAL** | **25 minutes** |

---

## SUPPORT RESOURCES

- **Supabase Status**: https://status.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **Connection Issues**: Check https://app.supabase.com/project/[your-id]/settings/database
- **API Keys**: Go to https://app.supabase.com/project/[your-id]/settings/api

---

## YOU ARE HERE

```
1. ✅ KORA code ready with 10 migrations
2. 📍 NOW: Set up Supabase project
3. ⏳ Then: Run migration script
4. ⏳ Then: Verify in dashboard
5. ⏳ Then: Start building features
```

---

**Ready?** Start with STEP 1: Create Supabase Project

Next: https://app.supabase.com → "Create New Project"
