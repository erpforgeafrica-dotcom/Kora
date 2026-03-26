import { queryDb } from "../../db/client.js";

const FAILURE_WINDOW_MINUTES = 10;
const LOCKOUT_MINUTES = 15;
const MAX_FAILURES = 5;

export type LoginAttempt = {
  identifier: string;
  userId?: string | null;
  organizationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  reason?: string | null;
};

export async function logLoginAttempt(attempt: LoginAttempt) {
  await queryDb(
    `INSERT INTO login_attempts (
       user_id,
       organization_id,
       identifier,
       ip_address,
       user_agent,
       success,
       reason
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      attempt.userId ?? null,
      attempt.organizationId ?? null,
      attempt.identifier,
      attempt.ipAddress ?? null,
      attempt.userAgent ?? null,
      attempt.success,
      attempt.reason ?? null,
    ]
  );
}

export async function countRecentFailures(identifier: string) {
  const rows = await queryDb<{ count: string }>(
    `SELECT count(*)::text as count
       FROM login_attempts
      WHERE identifier = $1
        AND success = false
        AND attempt_time >= NOW() - interval '${FAILURE_WINDOW_MINUTES} minutes'`,
    [identifier]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function markUserLocked(userId: string) {
  await queryDb(
    `UPDATE users
        SET locked_until = NOW() + interval '${LOCKOUT_MINUTES} minutes',
            failed_attempts = 0
      WHERE id = $1`,
    [userId]
  );
}

export async function resetUserLockState(userId: string) {
  await queryDb(
    `UPDATE users
        SET locked_until = NULL,
            failed_attempts = 0
      WHERE id = $1`,
    [userId]
  );
}

export function isAccountLocked(lockedUntil: string | null) {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

export async function incrementFailureCount(userId: string | null) {
  if (!userId) return;
  await queryDb(
    `UPDATE users
        SET failed_attempts = failed_attempts + 1
      WHERE id = $1`,
    [userId]
  );
}

export function shouldLockAccount(failureCount: number) {
  return failureCount >= MAX_FAILURES;
}
