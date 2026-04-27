/**
 * Plan gate integration test
 * Tests: org seed → activate-free → 402 on CRM → 429 on bookings
 * Run: node scripts/test-plan-gates.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const BASE = "http://localhost:3000";

// Test identity — uses NODE_ENV=test bypass headers
// Using valid UUID format (v4-like for deterministic test IDs)
const TEST_ORG_ID  = "00000000-0000-0000-0000-000000000099";
const TEST_USER_ID = "00000000-0000-0000-0000-000000000098";
const TEST_ROLE    = "business_admin";

const headers = {
  "Content-Type": "application/json",
  "x-test-user-id": TEST_USER_ID,
  "x-test-role":    TEST_ROLE,
  "x-test-org-id":  TEST_ORG_ID,
};

function pass(label) { console.log(`  ✅ ${label}`); }
function fail(label, detail) { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`); }
function section(label) { console.log(`\n── ${label}`); }

// ── 1. Seed org row ───────────────────────────────────────────────────────────
section("1. Seed organization");
await pool.query(`
  INSERT INTO organizations (id, name, slug, created_at, updated_at)
  VALUES ($1, 'Plan Gate Test Org', 'plan-gate-test', now(), now())
  ON CONFLICT (id) DO NOTHING
`, [TEST_ORG_ID]).catch(e => { fail("org seed", e.message); process.exit(1); });
pass(`org ${TEST_ORG_ID} seeded`);

// ── 2. Clean any existing subscription for this org ───────────────────────────
await pool.query(`DELETE FROM subscriptions WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});
await pool.query(`DELETE FROM subscription_events WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});

// ── 3. 402 test — CRM gate before any subscription ───────────────────────────
section("2. 402 — requireFeature(module_crm) with no subscription");
{
  const r = await fetch(`${BASE}/api/crm/leads`, { headers });
  const body = await r.json().catch(() => ({}));
  if (r.status === 402) {
    pass(`GET /api/crm/leads → 402`);
    const code = body?.error?.code ?? body?.code;
    const upgradeUrl = body?.error?.details?.upgrade_url ?? body?.details?.upgrade_url;
    code === "PLAN_FEATURE_NOT_INCLUDED" ? pass(`error code: ${code}`) : fail("error code", `got ${code}`);
    upgradeUrl ? pass(`upgrade_url: ${upgradeUrl}`) : fail("upgrade_url missing", JSON.stringify(body));
  } else {
    fail(`GET /api/crm/leads → expected 402, got ${r.status}`, JSON.stringify(body).slice(0, 200));
  }
}

// ── 4. Activate starter plan ──────────────────────────────────────────────────
section("3. POST /api/subscriptions/activate-free");
{
  const r = await fetch(`${BASE}/api/subscriptions/activate-free`, { method: "POST", headers, body: "{}" });
  const body = await r.json().catch(() => ({}));
  if (r.status === 201) {
    pass(`activate-free → 201`);
    const row = body?.data ?? body;
    console.log(`     plan_id: ${row.plan_id}, status: ${row.status}, billing_interval: ${row.billing_interval}`);
  } else {
    fail(`activate-free → expected 201, got ${r.status}`, JSON.stringify(body).slice(0, 300));
    process.exit(1);
  }
}

// ── 5. Verify subscription row in DB ─────────────────────────────────────────
section("4. DB verify — subscription row");
{
  const r = await pool.query(`
    SELECT s.id, s.status, s.billing_interval, sp.slug AS plan_slug, pf.module_crm, pf.max_bookings_per_month
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    JOIN plan_features pf ON pf.plan_id = s.plan_id
    WHERE s.organization_id = $1 AND s.status = 'active'
    LIMIT 1
  `, [TEST_ORG_ID]);
  const row = r.rows[0];
  if (!row) { fail("no active subscription row found"); process.exit(1); }
  pass(`subscription row exists`);
  row.plan_slug ? pass(`plan_id FK resolved → slug: ${row.plan_slug}`) : fail("plan_id FK is NULL — starter subquery returned nothing at insert time");
  row.plan_slug === "starter"           ? pass(`plan_slug = starter`) : fail("plan_slug", `got ${row.plan_slug}`);
  row.module_crm === false              ? pass(`module_crm = false`)  : fail("module_crm", `got ${row.module_crm}`);
  row.max_bookings_per_month === 50     ? pass(`max_bookings = 50`)   : fail("max_bookings", `got ${row.max_bookings_per_month}`);
  console.log(`     sub id: ${row.id}`);
}

// ── 6. 402 still fires after activation (CRM still gated on starter) ──────────
section("5. 402 — CRM still gated after starter activation");
{
  const r = await fetch(`${BASE}/api/crm/leads`, { headers });
  r.status === 402 ? pass(`GET /api/crm/leads → 402 (starter has no CRM)`) : fail(`expected 402, got ${r.status}`);
}

// ── 7. Seed 50 bookings to hit the limit ─────────────────────────────────────
section("6. Seed 50 bookings this month (hit the limit)");
{
  // Need a client and service row for FK — use raw inserts
  await pool.query(`
    INSERT INTO clients (id, organization_id, full_name, email, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000001', $1, 'Test Client', 'test@test.invalid', now(), now())
    ON CONFLICT (id) DO NOTHING
  `, [TEST_ORG_ID]).catch(() => {});

  await pool.query(`
    INSERT INTO services (id, organization_id, name, duration_minutes, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000002', $1, 'Test Service', 30, now(), now())
    ON CONFLICT (id) DO NOTHING
  `, [TEST_ORG_ID]).catch(() => {});

  // Seed 50 bookings directly — avoids needing staff/availability
  await pool.query(`
    INSERT INTO bookings (id, organization_id, client_id, service_id, status, start_time, end_time, created_at, updated_at)
    SELECT
      gen_random_uuid(),
      $1,
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      'confirmed',
      now() - (n || ' hours')::interval,
      now() - (n || ' hours')::interval + interval '30 minutes',
      now(),
      now()
    FROM generate_series(1, 50) AS n
  `, [TEST_ORG_ID]);
  pass("50 bookings seeded for this month");
}

// ── 8. 429 test — booking limit exceeded ─────────────────────────────────────
section("7. 429 — checkUsageLimit(bookings) at 50/50");
{
  // Hit the bookings endpoint — checkUsageLimit is on POST /api/bookings in app.ts
  // The middleware fires before the handler, so even an invalid payload triggers it
  const r = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ service_id: "00000000-0000-0000-0000-000000000002", staff_member_id: "x", start_time: new Date().toISOString() }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.status === 429) {
    pass(`POST /api/bookings → 429`);
    const code = body?.error?.code ?? body?.code;
    const details = body?.error?.details ?? body?.details ?? {};
    code === "PLAN_USAGE_LIMIT_REACHED" ? pass(`error code: ${code}`) : fail("error code", `got ${code}`);
    pass(`current=${details.current}, limit=${details.limit}, plan=${details.current_plan}`);
    details.upgrade_url ? pass(`upgrade_url: ${details.upgrade_url}`) : fail("upgrade_url missing");
  } else {
    fail(`POST /api/bookings → expected 429, got ${r.status}`, JSON.stringify(body).slice(0, 300));
  }
}

// ── 9. Cache consistency — second call same result ────────────────────────────
section("8. Cache — second 429 call consistent");
{
  const r = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ service_id: "00000000-0000-0000-0000-000000000002", staff_member_id: "x", start_time: new Date().toISOString() }),
  });
  r.status === 429 ? pass("second call → 429 (cache consistent)") : fail(`expected 429, got ${r.status}`);
}

// ── 10. Cleanup ───────────────────────────────────────────────────────────────
section("9. Cleanup");
await pool.query(`DELETE FROM bookings WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});
await pool.query(`DELETE FROM subscriptions WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});
await pool.query(`DELETE FROM subscription_events WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});
await pool.query(`DELETE FROM clients WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});
await pool.query(`DELETE FROM services WHERE organization_id=$1`, [TEST_ORG_ID]).catch(() => {});
await pool.query(`DELETE FROM organizations WHERE id=$1`, [TEST_ORG_ID]).catch(() => {});
pass("test data cleaned up");

await pool.end();
console.log("\nDone.\n");
