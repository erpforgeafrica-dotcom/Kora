import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { logger } from "../shared/logger.js";

const DEFAULT_TEST_DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://kora:kora_dev_password@localhost:5432/kora";

export interface TestDbConnection {
  pool: Pool;
  query: <T = any>(sql: string, values?: any[]) => Promise<T[]>;
  trackOrganization: (organizationId: string) => void;
  trackUser: (userId: string) => void;
  trackIdentifier: (identifier: string) => void;
  teardown: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDbConnection> {
  const pool = new Pool({
    connectionString: DEFAULT_TEST_DATABASE_URL,
    max: 4,
  });
  const trackedOrganizationIds = new Set<string>();
  const trackedUserIds = new Set<string>();
  const trackedIdentifiers = new Set<string>();

  try {
    await pool.query("SELECT 1");

    const query = async <T = any>(sql: string, values?: any[]): Promise<T[]> => {
      try {
        const result = await pool.query(sql, values);
        return result.rows;
      } catch (err) {
        logger.error("Test database query failed", { sql: sql.substring(0, 100), error: err });
        throw err;
      }
    };

    const trackOrganization = (organizationId: string) => {
      trackedOrganizationIds.add(organizationId);
    };

    const trackUser = (userId: string) => {
      trackedUserIds.add(userId);
    };

    const trackIdentifier = (identifier: string) => {
      trackedIdentifiers.add(identifier);
    };

    const teardown = async () => {
      try {
        const orgScopedTablesResult = await pool.query<{ table_name: string }>(
          `SELECT DISTINCT table_name
             FROM information_schema.columns
            WHERE table_schema = 'public'
              AND column_name = 'organization_id'
              AND table_name NOT IN ('organizations', 'users')
            ORDER BY table_name`
        );
        const orgScopedTables = orgScopedTablesResult.rows.map((row) => row.table_name);

        for (const organizationId of trackedOrganizationIds) {
          const remainingTables = new Set(orgScopedTables);

          for (let pass = 0; pass < orgScopedTables.length; pass += 1) {
            let progress = false;

            for (const tableName of [...remainingTables]) {
              try {
                await pool.query(`DELETE FROM "${tableName}" WHERE organization_id = $1`, [organizationId]);
                remainingTables.delete(tableName);
                progress = true;
              } catch {
                // Retry in a later pass after dependent rows have been deleted.
              }
            }

            if (remainingTables.size === 0 || !progress) {
              break;
            }
          }

          if (remainingTables.size > 0) {
            logger.warn("Test database cleanup could not clear some org-scoped tables", {
              organizationId,
              tables: [...remainingTables],
            });
          }
        }

        if (trackedUserIds.size > 0) {
          const userIds = [...trackedUserIds];
          await pool.query("DELETE FROM login_sessions WHERE user_id = ANY($1::uuid[])", [userIds]);
          await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [userIds]);
        }

        if (trackedIdentifiers.size > 0) {
          await pool.query("DELETE FROM login_attempts WHERE identifier = ANY($1::text[])", [[...trackedIdentifiers]]);
        }

        if (trackedOrganizationIds.size > 0) {
          await pool.query("DELETE FROM organizations WHERE id = ANY($1::uuid[])", [[...trackedOrganizationIds]]);
        }
      } catch (err) {
        logger.error("Test database cleanup failed", { error: err });
      } finally {
        await pool.end();
      }
    };

    return { pool, query, trackOrganization, trackUser, trackIdentifier, teardown };
  } catch (err) {
    await pool.end();
    throw err;
  }
}

export async function createTestOrgAndUser(db: TestDbConnection) {
  const orgId = randomUUID();
  const userId = randomUUID();
  const email = `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

  await db.query(
    `INSERT INTO organizations (id, name, status)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [orgId, `Test Org ${Date.now()}`, "active"]
  );

  await db.query(
    `INSERT INTO users (id, email, password_hash, role, organization_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [userId, email, "hashed_password", "business_admin", orgId]
  );

  db.trackOrganization(orgId);
  db.trackUser(userId);
  db.trackIdentifier(email);

  return { orgId, userId, email };
}

export function generateTestToken(userId: string, organizationId: string, role = "business_admin"): string {
  return jwt.sign(
    { sub: userId, role, organizationId, permissions_version: 1 },
    process.env.JWT_SECRET || "test-secret-key",
    { expiresIn: "24h" }
  );
}

export async function createTestClient(db: TestDbConnection, organizationId: string, overrides: Partial<Record<string, unknown>> = {}) {
  const id = randomUUID();
  const fullName = String(overrides.full_name ?? `Test Client ${Date.now()}`);
  const email = String(overrides.email ?? `client_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`);
  const phone = String(overrides.phone ?? "+1234567890");

  const [client] = await db.query(
    `INSERT INTO clients (id, organization_id, full_name, email, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id::text, organization_id::text, full_name, email, phone`,
    [id, organizationId, fullName, email, phone]
  );

  return client;
}

export async function createTestService(db: TestDbConnection, organizationId: string, overrides: Partial<Record<string, unknown>> = {}) {
  const id = randomUUID();
  const [service] = await db.query(
    `INSERT INTO services (
       id, organization_id, name, description, duration_minutes, price_cents, currency, is_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id::text, organization_id::text, name, duration_minutes, price_cents, currency`,
    [
      id,
      organizationId,
      String(overrides.name ?? `Test Service ${Date.now()}`),
      String(overrides.description ?? "Integration test service"),
      Number(overrides.duration_minutes ?? 60),
      Number(overrides.price_cents ?? 10000),
      String(overrides.currency ?? "USD"),
      Boolean(overrides.is_active ?? true),
    ]
  );

  return service;
}
