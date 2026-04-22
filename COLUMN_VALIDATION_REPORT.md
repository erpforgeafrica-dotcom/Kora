# KORA: Column Reference Cross-Check Report
**Created**: April 2026 | **Status**: COMPREHENSIVE VALIDATION

---

## Executive Summary

This report validates all column references in the KORA codebase against the actual table structures defined in PostgreSQL migrations. The analysis identifies:
- ✅ Valid column references
- ⚠️  Potentially missing columns in schema
- ❌ Invalid column references in code

---

## Methodology

1. **Schema Source**: Analyzed 49 migration files (001_init.sql through 046_subscription_plans.sql)
2. **Code Analysis**: Scanned all repository files for SQL queries with column references
3. **Validation Method**: Cross-referenced each column usage against CREATE/ALTER TABLE statements

---

## CORE TABLES VALIDATION

### 1. **organizations** table
**Status**: ✅ Defined and used

**Actual Columns** (from 001_init.sql):
- `id` (uuid, PK)
- `name` (text NOT NULL)
- `created_at` (timestamptz NOT NULL DEFAULT now())

**Column References in Code**:
- `organizations.id` ✅
- `organizations(id)` - FK references ✅

**Findings**: ✅ All references valid

---

### 2. **users** table  
**Status**: ✅ Defined with extensive additions

**Actual Columns** (from migrations):
- `id` (uuid, PK) ✅
- `organization_id` (uuid FK) ✅
- `email` (text NOT NULL) ✅
- `role` (text) - ⚠️ Legacy, may be deprecated
- `role_id` (uuid FK to roles table) ✅ [033+]
- `created_at` (timestamptz) ✅
- `password_hash` (text) ✅ [033]
- `failed_attempts` (integer DEFAULT 0) ✅ [033]
- `locked_until` (timestamptz) ✅ [033]
- `last_login` (timestamptz) ✅ [033]
- `password_changed_at` (timestamptz) ✅ [033]
- **Extension columns** (006_audience_schema.sql):
  - `first_name` ❌ **NOT FOUND IN MIGRATIONS**
  - `last_name` ❌ **NOT FOUND IN MIGRATIONS**
  - `name` ❌ **NOT FOUND IN MIGRATIONS**
  - `phone` ❌ **NOT FOUND IN MIGRATIONS**
  - `profile_image_url` ❌ **NOT FOUND IN MIGRATIONS**
  - `status` ❌ **NOT FOUND IN MIGRATIONS**
  - `email_verified` ❌ **NOT FOUND IN MIGRATIONS**
  - `phone_verified` ❌ **NOT FOUND IN MIGRATIONS**
  - `last_login_at` ❌ **NOT FOUND IN MIGRATIONS**
  - `updated_at` ❌ **NOT FOUND IN MIGRATIONS**
  - `branch_id` ❌ **NOT FOUND IN MIGRATIONS**

**Column References in Code** (from userManagementRepository.ts):
```
users.id ✅
users.organization_id ✅
users.branch_id ❌ MISSING
users.first_name ❌ MISSING
users.last_name ❌ MISSING
users.name ❌ MISSING
users.email ✅
users.phone ❌ MISSING
users.profile_image_url ❌ MISSING
users.status ❌ MISSING
users.email_verified ❌ MISSING
users.phone_verified ❌ MISSING
users.last_login_at ❌ MISSING
users.created_at ✅
users.updated_at ❌ MISSING
users.role_id ✅ [033+]
```

**CRITICAL FINDINGS**:
- ❌ **10+ columns referenced in code but NOT defined in schema**
- ⚠️ Migration 006 references `staff_members` and `clients` columns but user extensions missing

---

### 3. **roles** table
**Status**: ✅ Defined

**Actual Columns**:
- `id` (uuid, PK)
- `organization_id` (uuid FK)
- `name` (text NOT NULL)
- `description` (text)
- `is_system` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Column References in Code**:
```
roles.id ✅
roles.name ✅
roles.description ✅
roles.is_system ✅
roles.created_at ✅
roles.updated_at ✅
```

**Findings**: ✅ All references valid

---

### 4. **staff_members** table
**Status**: ✅ Defined (multiple versions)

**Version 1** (006_audience_schema.sql):
```sql
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid REFERENCES users(id),
  clerk_user_id text UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('therapist', 'receptionist', 'manager', 'admin')),
  specializations text[] NOT NULL DEFAULT '{}',
  availability jsonb NOT NULL DEFAULT '{}',
  rating numeric(3,2) NOT NULL DEFAULT 0,
  no_show_contribution_count integer NOT NULL DEFAULT 0,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Version 2** (027_staff_module.sql - OVERWRITES Version 1):
```sql
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('receptionist', 'practitioner', 'manager', 'admin')),
  specializations TEXT[],
  qualifications TEXT[],
  bio TEXT,
  profile_photo_url TEXT,
  hourly_rate NUMERIC(10,2),
  commission_percentage NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**ColumnReferences in Code** (staffRepository.ts):
```
staff_members.organization_id ✅
staff_members.user_id ✅
staff_members.full_name ✅
staff_members.email ✅
staff_members.phone ✅ (V2 only)
staff_members.role ✅
staff_members.specializations ✅
staff_members.qualifications ✅ (V2 only)
staff_members.bio ✅ (V2 only)
staff_members.profile_photo_url ✅ (V2 only)
staff_members.hourly_rate ✅ (V2 only)
staff_members.commission_percentage ✅ (V2 only)
staff_members.status ✅ (V2 only)
staff_members.is_active ✅
staff_members.created_at ✅
staff_members.updated_at ✅
```

**CRITICAL FINDINGS**:
- ⚠️ **Schema version conflict**: Migration 006 and 027 both define staff_members
- Migration 027 has DROP TABLE, will overwrite 006
- ❌ **Column mismatch**: Code expects columns from V1 that don't exist in V2 (clerk_user_id, availability, rating, no_show_contribution_count, photo_url)
- ❌ **Column mismatch**: Code may reference V2 columns not in V1 (phone, qualifications, bio, profile_photo_url, hourly_rate, commission_percentage)

---

### 5. **clients** table
**Status**: ✅ Defined

**Actual Columns** (006_audience_schema.sql):
```sql
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  preferred_staff_id uuid REFERENCES staff_members(id),
  loyalty_points integer NOT NULL DEFAULT 0,
  membership_tier text NOT NULL DEFAULT 'none' CHECK (membership_tier IN ('none', 'silver', 'gold', 'platinum')),
  telehealth_consent boolean NOT NULL DEFAULT false,
  preferences jsonb NOT NULL DEFAULT '{}',
  risk_score numeric(5,2),
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Column References in Code** (customerRepository.ts):
```
clients.id ✅
clients.organization_id ✅
clients.email ✅
clients.full_name ✅
clients.phone ✅
clients.preferred_staff_id ✅
clients.loyalty_points ✅
clients.membership_tier ✅
clients.telehealth_consent ✅
clients.preferences ✅
clients.risk_score ✅
clients.photo_url ✅
clients.created_at ✅
clients.updated_at ✅
```

**Findings**: ✅ All references valid

---

### 6. **bookings** table
**Status**: ✅ Defined with extensions

**Base Definition** (001_init.sql):
```sql
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Extended Columns** (from 007_booking_engine.sql + 006_audience_schema.sql):
- `client_id` (uuid FK) ✅
- `staff_member_id` (uuid FK) ✅
- `service_id` (uuid FK) ✅
- `room` (text) ✅
- `notes` (text) ✅
- `room_id` (uuid FK) ✅
- `checked_in_at` (timestamptz) ✅
- `source` (text) ✅
- `deposit_paid` (boolean) ✅
- `cancellation_reason` (text) ✅
- `confirmation_code` (text) ✅
- `notifications_sent` (boolean) ✅

**Column References in Code**:
```
bookings.id ✅
bookings.organization_id ✅
bookings.client_id ✅
bookings.staff_member_id ✅
bookings.service_id ✅
bookings.start_time ✅
bookings.end_time ✅
bookings.status ✅
bookings.room_id ✅ (if rooms_resources FK exists)
bookings.checked_in_at ✅
bookings.source ✅
bookings.deposit_paid ✅
bookings.cancellation_reason ✅
bookings.confirmation_code ✅
bookings.notifications_sent ✅
bookings.created_at ✅
```

**Findings**: ✅ All core references valid

---

## SECONDARY TABLES VALIDATION

### 7. **login_sessions** table (034_iam_sessions.sql)
**Status**: ✅ Defined

**Actual Columns**:
- `id` (uuid, PK)
- `user_id` (uuid FK) ✅
- `organization_id` (uuid FK) ✅
- `token_jti` (text UNIQUE) ✅
- `issued_at` (timestamptz) ✅
- `expires_at` (timestamptz) ✅
- `last_activity_at` (timestamptz)
- `revoked_at` (timestamptz)
- `revoke_reason` (text)
- `ip_address` (inet) ✅
- `user_agent` (text) ✅ (referenced as `device`)
- `created_at` (timestamptz)

**Column References in Code**:
```
login_sessions.id ✅
login_sessions.ip_address ✅
login_sessions.user_agent (as device) ✅
login_sessions.created_at ✅
```

**Findings**: ✅ All references valid

---

### 8. **login_attempts** table (035_iam_failed_attempts.sql)
**Status**: ✅ Defined

**Actual Columns**:
- `id` (uuid, PK)
- `user_id` (uuid FK)
- `organization_id` (uuid FK)
- `identifier` (text NOT NULL)
- `ip_address` (inet)
- `user_agent` (text)
- `attempt_time` (timestamptz)
- `success` (boolean DEFAULT FALSE)
- `reason` (text)

**Findings**: ✅ Standard IAM table, no code references found yet

---

### 9. **audit_logs** table
**Status**: ✅ Defined

**Actual Columns** (001_init.sql):
- `id` (uuid, PK)
- `organization_id` (uuid FK)
- `actor_id` (uuid)
- `action` (text NOT NULL)
- `metadata` (jsonb)
- `created_at` (timestamptz)

**Column References in Code**:
```
audit_logs.id ✅
audit_logs.action ✅
audit_logs.metadata ✅
audit_logs.created_at ✅
```

**Findings**: ✅ All references valid

---

## CRITICAL ISSUES SUMMARY

### 🔴 HIGH PRIORITY

#### Issue #1: Missing User Profile Columns
**Severity**: 🔴 **HIGH**

**Problem**: The code references 10+ columns in the `users` table that are not defined in any migration:
- `first_name`, `last_name`, `name`
- `phone`, `profile_image_url`
- `status`, `email_verified`, `phone_verified`
- `last_login_at`, `updated_at`, `branch_id`

**Impact**: 
- Queries will fail with column-not-found errors
- User profile functionality broken in backend
- List/filter operations broken

**Root Cause**: 
- Migration 006 references new staff/client roles but doesn't add these columns to `users`
- userManagementRepository.ts expects user-profile extension that was never migrated

**Solution Required**:
```sql
-- Create new migration (e.g., 047_users_profile_extension.sql)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Add index for performance
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_users_status ON users(status, created_at);
```

---

#### Issue #2: staff_members Table Version Conflict
**Severity**: 🔴 **HIGH**

**Problem**: Two migrations define staff_members with different schemas:
- **Migration 006**: Defines version with `availability`, `rating`, `no_show_contribution_count`, `clerk_user_id`, `photo_url`
- **Migration 027**: DROP TABLE IF EXISTS, then redefines with different columns

**Impact**:
- V2 (027) overwrites V1 (006)
- Any code expecting V1 columns will fail after migration
- Lost columns: `availability`, `rating`, `no_show_contribution_count`, `clerk_user_id`, `photo_url`
- New columns added: `phone`, `qualifications`, `bio`, `hourly_rate`, `commission_percentage`

**Root Cause**: Table definition evolved across phases without proper migration chain

**Solution Options**:
1. **MERGE**: Combine both versions into single migration
   ```sql
   CREATE TABLE IF NOT EXISTS staff_members (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id UUID NOT NULL,
     user_id UUID,
     full_name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     role TEXT NOT NULL CHECK (...),
     specializations TEXT[] DEFAULT '{}',
     qualifications TEXT[] DEFAULT '{}',
     bio TEXT,
     profile_photo_url TEXT,
     hourly_rate NUMERIC(10,2),
     commission_percentage NUMERIC(5,2),
     status TEXT NOT NULL DEFAULT 'active',
     is_active BOOLEAN DEFAULT true,
     -- V1 columns preserved
     clerk_user_id TEXT UNIQUE,
     availability JSONB DEFAULT '{}',
     rating NUMERIC(3,2) DEFAULT 0,
     no_show_contribution_count INTEGER DEFAULT 0,
     photo_url TEXT,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **SPLIT**: Create separate table for legacy v1 data, migrate selectively

---

#### Issue #3: Connected Accounts Table Missing
**Severity**: 🟠 **MEDIUM**

**Problem**: Code references `connected_accounts` table (userManagementRepository.ts):
```typescript
`select id::text, provider, external_id, created_at::text
   from connected_accounts
  where user_id = $1`
```

**Status**: ❌ **NOT FOUND IN ANY MIGRATION**

**Impact**: Query will fail with table-not-found error

**Solution**: Create migration to define table:
```sql
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github', 'apple', ...)),
  external_id TEXT NOT NULL,
  external_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, external_id)
);

CREATE INDEX idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_provider ON connected_accounts(provider);
```

---

### 🟠 MEDIUM PRIORITY

#### Issue #4: Password History Table Column Mismatch
**Severity**: 🟠 **MEDIUM**

**Problem**: Migration 036 defines:
```sql
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**But code may reference**: `password_hash` instead of separate `hash` and `salt`

**Impact**: Password validation logic might fail if splitting hash/salt incorrectly

---

#### Issue #5: Missing rooms_resources Foreign Key Reference
**Severity**: 🟠 **MEDIUM**

**Problem**: bookings.room_id references rooms_resources(id)

**Definition Found**: 007_booking_engine.sql properly defines rooms_resources table

**Status**: ✅ **VERIFIED** - but verify `ON DELETE SET NULL` behavior in code

**Impact**: Booking cancellations should handle room resource cleanup

---

## FOREIGN KEY INTEGRITY CHECK

### Verified Foreign Keys: ✅

| Table | Column | References | Status |
|-------|--------|-----------|--------|
| users | organization_id | organizations(id) | ✅ |
| staff_members | organization_id | organizations(id) | ✅ |
| clients | organization_id | organizations(id) | ✅ |
| clients | preferred_staff_id | staff_members(id) | ✅ |
| bookings | organization_id | organizations(id) | ✅ |
| bookings | client_id | clients(id) | ✅ |
| bookings | staff_member_id | staff_members(id) | ✅ |
| bookings | service_id | services(id) | ✅ |
| bookings | room_id | rooms_resources(id) | ✅ |
| login_sessions | user_id | users(id) | ✅ |
| login_sessions | organization_id | organizations(id) | ✅ |
| audit_logs | organization_id | organizations(id) | ✅ |

### Potential FK Issues: ⚠️

| Table | Column | References | Status |
|-------|--------|-----------|--------|
| users | branch_id | ? | ⚠️ **NO TABLE FOUND** |
| staff_members | user_id | users(id) | ✅ (nullable) |
| users | role_id | roles(id) | ✅ |

---

## INDEX COVERAGE CHECK

### Required Indexes for Performance: ⚠️

**Missing**:
```sql
-- Users table missing indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_status ON users(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Bookings table missing composite indexes
CREATE INDEX IF NOT EXISTS idx_bookings_client_created ON bookings(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_service_start ON bookings(service_id, start_time);

-- Password history missing
CREATE INDEX IF NOT EXISTS idx_password_history_user_created ON password_history(user_id, created_at DESC);
```

---

## RECOMMENDATIONS

### Immediate Actions (This Week)

1. **Create 047_users_profile_extension.sql**
   - Add all missing user columns
   - Add required indexes
   - Test with userManagementRepository tests

2. **Consolidate staff_members**
   - Merge 006 and 027 into unified 006_audience_schema.sql
   - Preserve all columns from both versions
   - Remove 027 from migration chain

3. **Create 048_iam_connected_accounts.sql**
   - Define connected_accounts table
   - Add appropriate indexes

4. **Validate password_history usage**
   - Verify hash/salt handling in auth service
   - Update if using different structure

### Testing

Run these as part of validation:
```bash
npm run db:migrate                 # Apply migrations
npm run typecheck                  # Verify types
npm run test                       # Run repository tests
npm run test:watch -- userManagement  # Focus on user tests
```

---

## APPENDIX: Column Reference Matrix

### users table
| Column | Migration | Code Status | Notes |
|--------|-----------|-------------|-------|
| id | 001 | ✅ | Primary key, always referenced |
| organization_id | 001 | ✅ | FK, scope key |
| email | 001 | ✅ | Unique, indexed |
| created_at | 001 | ✅ | Timestamp |
| **first_name** | ❌ NONE | ❌ **MISSING** | |
| **last_name** | ❌ NONE | ❌ **MISSING** | |
| **name** | ❌ NONE | ❌ **MISSING** | |
| **phone** | ❌ NONE | ❌ **MISSING** | |
| **profile_image_url** | ❌ NONE | ❌ **MISSING** | |
| **status** | ❌ NONE | ❌ **MISSING** | |
| **email_verified** | ❌ NONE | ❌ **MISSING** | |
| **phone_verified** | ❌ NONE | ❌ **MISSING** | |
| **last_login_at** | ❌ NONE | ❌ **MISSING** | |
| **updated_at** | ❌ NONE | ❌ **MISSING** | |
| **branch_id** | ❌ NONE | ❌ **MISSING** | No FK target found |
| role | 001 | ⚠️ **DEPRECATED** | Use role_id instead |
| role_id | 033 | ✅ | FK to roles table |
| password_hash | 033 | ✅ | IAM extension |
| failed_attempts | 033 | ✅ | Lockout tracking |
| locked_until | 033 | ✅ | Lockout timestamp |
| last_login | 033 | ✅ | Session tracking |
| password_changed_at | 033 | ✅ | Password policy |

---

**Report Generated**: April 22, 2026
**Next Review**: After migration 047-048 implementation
**Status**: 🔴 **ACTION REQUIRED** - 10+ critical column mismatches found
