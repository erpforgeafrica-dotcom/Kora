# KORA Database Migrations & Seeding Guide

## Overview

KORA uses a **numbered migration system** for schema management:
- ✅ Version-controlled schema changes
- ✅ Idempotent migrations (can be run multiple times safely)
- ✅ Transactional safety (all-or-nothing per migration)
- ✅ Audit trail (schema_migrations table tracks all applied migrations)

---

## Quick Start

### 1. Run All Migrations
```bash
cd backend
npm run db:migrate
```
**Effect**: Applies all pending migrations in order, skips already-applied ones

### 2. Check Migration Status
```bash
npm run db:migrate:status
```
**Output**:
```
📋 Migration Status

Available migrations:
────────────────────────────────────────────────────────────
✅ APPLIED  001_init.sql (2026-03-14)
✅ APPLIED  002_ai_foundation.sql (2026-03-14)
⏳ PENDING  033_new_feature.sql
────────────────────────────────────────────────────────────

Total: 33 migrations
Applied: 32
Pending: 1

Run 'npm run db:migrate' to apply pending migrations
```

### 3. Seed Demo Data
```bash
npm run db:seed
```
**Effect**: 
- Creates demo business, admin user, services, staff members, bookings
- Only runs on development/staging (skips production)
- Idempotent (safe to run multiple times)

### 4. Complete Setup (Migrations + Seed)
```bash
npm run db:setup
```
**Effect**: Runs both `npm run db:migrate` && `npm run db:seed`

---

## Migration System Architecture

### File Structure
```
backend/
├── src/db/
│   ├── migrate.ts                    # Migration runner (ordered execution)
│   ├── migrate-status.ts             # Status checker
│   ├── seed.ts                       # Seed data generator
│   └── migrations/
│       ├── 001_init.sql              # Initial schema (businesses, users)
│       ├── 002_ai_foundation.sql     # AI budget and anomaly detection
│       ├── 003_orchestration_...sql  # AI orchestration
│       ├── ...
│       └── 032_delivery.sql          # Latest migration
│
└── package.json                      # db:* scripts
```

### Numbering Convention

Migrations are numbered with **zero-padded 3-digit prefixes**:
```
001_init.sql
002_ai_foundation.sql
003_orchestration_feedback.sql
...
032_delivery.sql
```

**Ordering Rules**:
- Sorted alphabetically (which sorts numerically)
- Applied in order (001 before 002 before 003, etc.)
- Cannot skip or reorder (breaks idempotency assumption)

---

## Migration Workflow

### 1. Creating a New Migration

**Step 1**: Create numbered file in `backend/src/db/migrations/`
```bash
# Next migration would be 033
touch backend/src/db/migrations/033_new_feature.sql
```

**Step 2**: Write idempotent SQL
```sql
-- ✅ GOOD: Uses IF NOT EXISTS
create table if not exists new_table (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- ✅ GOOD: Skips if already indexed
create index if not exists new_table_name_idx on new_table(name);

-- ❌ BAD: Will fail if table exists
create table new_table (
  id uuid primary key
);

-- ❌ BAD: Will fail if index exists
create index new_table_name_idx on new_table(name);
```

**Step 3**: Test locally
```bash
npm run db:migrate
npm run db:migrate:status
```

**Step 4**: Verify data integrity
```bash
# Check applied migrations
npm run db:migrate:status

# Manually test table structure
docker exec kora-postgres psql -U kora -d kora -c "\d new_table"
```

### 2. Applying Migrations

**Development**:
```bash
cd backend
npm run db:migrate          # Apply pending migrations
```

**Staging**:
```bash
# On staging server
docker exec kora-backend-staging npm run db:migrate
```

**Production**:
```bash
# On production server (requires planning)
docker exec kora-backend-prod npm run db:migrate

# Then verify with
npm run db:migrate:status
```

### 3. Troubleshooting Failed Migrations

**If a migration fails**:

1. **Check error message**
   ```bash
   npm run db:migrate 2>&1 | tail -20
   ```

2. **Inspect schema_migrations table**
   ```bash
   docker exec kora-postgres psql -U kora -d kora \
     -c "select * from schema_migrations order by applied_at desc limit 5"
   ```

3. **Fix the migration file** if syntax error
   ```bash
   # Edit the SQL file to fix issue
   vim backend/src/db/migrations/033_new_feature.sql
   
   # Retry
   npm run db:migrate
   ```

4. **Rollback strategy** (if migration corrupted data):
   ```bash
   # For critical failures, restore from backup
   # This tool doesn't auto-rollback, so plan migrations carefully!
   
   # MANUAL PROCESS:
   # 1. Stop backend
   # 2. Restore database backup from before migration
   # 3. Fix migration SQL
   # 4. Reapply
   ```

---

## Seeding System

### What Gets Seeded

**Development/Staging** (`npm run db:seed`):
```
✅ Demo Business
   - Name: "KORA Demo Business"
   - ID: 00000000-0000-0000-0000-000000000001
   - Status: active

✅ Admin User
   - Email: admin@kora.local
   - Password: (reset via API)
   - ID: 00000000-0000-0000-0000-000000000101

✅ Services (4 demo services)
   - Haircut ($25, 30 min)
   - Hair Coloring ($60, 60 min)
   - Massage ($50, 45 min)
   - Consultation ($30, 30 min)

✅ Staff Members (2)
   - Sarah Johnson (sarah@kora.local)
   - Mike Smith (mike@kora.local)

✅ Bookings (2 demo bookings)
   - Tomorrow, confirmed
   - Day after tomorrow, pending

✅ AI Budget
   - Development: $100/month
   - Staging: $500/month
   - Production: $5000/month

✅ Anomaly Baselines
   - Response time (180ms ± 30ms)
   - Daily bookings (40 ± 10)
   - Overdue invoices (5 ± 2)
```

**Production**: No automatic seeding (manual setup only)

### Seed SQL Structure

Located in `backend/src/db/seed.ts` (TypeScript with transaction safety):

```typescript
// Uses environment checks
if (environment === "production") {
  console.log("⚠️  Skipping seed in production environment");
  return;
}

// Uses transaction for atomicity
await dbPool.query("begin");
try {
  // Seed demo data...
  await dbPool.query("commit");
} catch (error) {
  await dbPool.query("rollback");  // All-or-nothing
  throw error;
}
```

### Custom Seeding

**To add custom seed data**:

1. Edit `backend/src/db/seed.ts`
2. Add new function (e.g., `seedCustomData()`)
3. Call in `main()` function
4. Protect with table existence check

Example:
```typescript
async function seedCustomData() {
  console.log("Seeding custom data...");

  // Check if table exists
  if (!(await checkTableExists("custom_table"))) {
    console.log("Skipping custom data (table doesn't exist)");
    return;
  }

  // Insert seed data
  await dbPool.query(
    `insert into custom_table (id, name) values ($1, $2) on conflict do nothing`,
    [customId, customName]
  );

  console.log("✓ Custom data seeded");
}

// Call in main()
if (hasBusinessTable) {
  await seedCustomData();
}
```

---

## Database Setup by Environment

### Development (Local)
```bash
# 1. Start Docker services
docker-compose up -d postgres redis

# 2. Run migrations
npm run db:migrate

# 3. Seed demo data
npm run db:seed

# Result: Development database ready with demo data
```

### Staging
```bash
# 1. Set credentials
export DATABASE_URL=postgresql://kora_staging:password@postgres-staging:5432/kora_staging

# 2. Run migrations
docker exec kora-backend-staging npm run db:migrate

# 3. Seed demo data for testing
docker exec kora-backend-staging npm run db:seed

# Result: Staging database ready with test data
```

### Production
```bash
# 1. Set credentials (via secrets manager, never in code)
export DATABASE_URL=postgresql://kora_prod:secure_password@rds-prod:5432/kora_prod

# 2. Run migrations ONLY (no seeding)
docker exec kora-backend-prod npm run db:migrate

# 3. Verify migrations applied
docker exec kora-backend-prod npm run db:migrate:status

# Result: Production schema updated, no demo data added
```

---

## Schema Changes Reference

### Latest Migrations (032+ files)

| Migration | Purpose | Tables Created |
|-----------|---------|-----------------|
| 001_init.sql | Core schema | businesses, users |
| 002_ai_foundation.sql | AI budget + anomaly detection | ai_budgets, anomaly_baselines |
| 007_booking_engine.sql | Booking system | bookings, availability |
| 008_service_registry.sql | Services catalog | services, service_categories |
| 017_finance_full.sql | Invoicing + payments | invoices, transactions |
| 025_canonical_schema.sql | Phase 1B canonical structure | (restructuring) |
| 026_backfill_legacy.sql | Data migration | (backfill) |
| 032_delivery.sql | Delivery module | delivery_orders |

---

## Best Practices

### ✅ DO

1. **Always use IF NOT EXISTS**
   ```sql
   ✅ create table if not exists users (...)
   ✅ create index if not exists users_email_idx on users(email)
   ```

2. **Keep migrations small and focused**
   ```
   ✅ 001_create_users_table.sql (one concern)
   ❌ 001_init.sql (50 tables, too large)
   ```

3. **Test migrations locally first**
   ```bash
   npm run db:migrate        # Local
   npm run db:migrate:status # Verify
   ```

4. **Use transactions**
   - migrate.ts wraps each migration in BEGIN/COMMIT
   - Ensures atomicity (all-or-nothing)

5. **Document breaking changes**
   ```sql
   -- Migration 033: Remove deprecated column
   -- BREAKING: Applications must stop using `old_column` field
   -- Deprecated since: 2026-02-01
   -- Removed in: Migration 033
   alter table users drop column old_column;
   ```

### ❌ DON'T

1. **Don't create migrations without testing**
   ```bash
   ❌ git push "new migration without testing"
   ✅ Test locally first: npm run db:migrate
   ```

2. **Don't modify applied migrations**
   ```
   ❌ Edit 001_init.sql after it's been applied
   ✅ Create new migration 033 for the fix
   ```

3. **Don't include DDL and DML together**
   ```sql
   ❌ create table if not exists t(...);
      insert into t values (...);    -- Bad: mixes DDL + DML
   
   ✅ create table if not exists t(...);
      -- DML goes in seed.ts instead
   ```

4. **Don't manually delete from schema_migrations**
   ```bash
   ❌ delete from schema_migrations where id = '033_...'
   ✅ Never modify schema_migrations table directly
   ```

---

## Common Tasks

### View Applied Migrations
```bash
npm run db:migrate:status
```

### Force Re-seed (Development Only)
```bash
# Step 1: Reset demo org data
docker exec kora-postgres psql -U kora -d kora <<EOF
delete from bookings where business_id = '00000000-0000-0000-0000-000000000001';
delete from users where business_id = '00000000-0000-0000-0000-000000000001';
delete from services where business_id = '00000000-0000-0000-0000-000000000001';
delete from businesses where id = '00000000-0000-0000-0000-000000000001';
EOF

# Step 2: Re-seed
npm run db:seed
```

### Backup Before Major Migration
```bash
# Backup database
docker exec kora-postgres pg_dump -U kora kora > backup-$(date +%Y%m%d-%H%M%S).sql

# Apply migration
npm run db:migrate

# If needed, restore
docker exec -i kora-postgres psql -U kora kora < backup-20260314-120000.sql
```

### Check Database Size
```bash
docker exec kora-postgres psql -U kora -d kora -c "
  select schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
  from pg_tables 
  where schemaname = 'public' 
  order by pg_total_relation_size(schemaname||'.'||tablename) desc
"
```

---

## Monitoring & Troubleshooting

### Check Connection
```bash
# Test database connection
docker exec kora-postgres psql -U kora -d kora -c "select 1"

# Result: 1 (success)
```

### View Slow Queries During Migration
```bash
docker exec kora-postgres psql -U kora -d kora -c "
  select query, mean_exec_time, calls 
  from pg_stat_statements 
  where query like '%migration%' or query like '%create%'
  order by mean_exec_time desc limit 10
"
```

### Monitor Migration Progress (Long-Running)
```bash
# In separate terminal
docker exec kora-postgres psql -U kora -d kora -c "
  select pid, query, query_start, state 
  from pg_stat_activity 
  where state != 'idle'
"
```

---

## Production Deployment Checklist

- [ ] All migrations tested in development
- [ ] All migrations tested in staging
- [ ] Backup taken before applying
- [ ] Maintenance window scheduled
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Post-migration verification plan ready
- [ ] Rollback testing complete

---

## Support

### Getting Help
1. **Check status**: `npm run db:migrate:status`
2. **View logs**: `npm run db:migrate 2>&1 | head -50`
3. **Inspect schema**: `docker exec kora-postgres psql -U kora -d kora -c "\dt"`
4. **Review migration file**: `cat backend/src/db/migrations/NNN_name.sql`

### Reporting Issues
Include in report:
- Migration file name and number
- Error message (full stack trace)
- Environment (dev/staging/prod)
- Database version
- Steps to reproduce

---

**Last Updated**: March 14, 2026  
**Status**: Production Ready ✅  
**Version**: 1.0
