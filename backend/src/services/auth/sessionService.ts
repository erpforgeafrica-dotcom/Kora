import { randomUUID } from "node:crypto";
import { queryDb } from "../../db/client.js";

export const SESSION_TTL_MINUTES = Number(process.env.SESSION_TTL_MINUTES ?? 24 * 60);

export type SessionRow = {
  id: string;
  user_id: string;
  organization_id: string;
  token_jti: string;
  issued_at: string;
  expires_at: string;
  last_activity_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
};

export type CreateSessionInput = {
  userId: string;
  organizationId: string | null;
  tokenJti: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function createSession(input: CreateSessionInput) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();
  const organizationId = input.organizationId ?? "org_placeholder";
  const rows = await queryDb<SessionRow>(
    `INSERT INTO login_sessions (
       user_id,
       organization_id,
       token_jti,
       expires_at,
       ip_address,
       user_agent
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id::text,
               user_id::text,
               organization_id::text,
               token_jti,
               issued_at::text,
               expires_at::text,
               last_activity_at::text,
               revoked_at::text,
               revoke_reason`,
    [
      input.userId,
      organizationId,
      input.tokenJti,
      expiresAt,
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ]
  );
  return rows[0];
}

export async function getSessionByJti(tokenJti: string) {
  const rows = await queryDb<SessionRow>(
    `SELECT id::text,
            user_id::text,
            organization_id::text,
            token_jti,
            issued_at::text,
            expires_at::text,
            last_activity_at::text,
            revoked_at::text,
            revoke_reason
       FROM login_sessions
      WHERE token_jti = $1
        AND expires_at > NOW()
        AND revoked_at IS NULL
      LIMIT 1`,
    [tokenJti]
  );
  return rows[0] ?? null;
}

export type SessionValidationResult =
  | { status: "active"; session: SessionRow }
  | { status: "revoked"; session: SessionRow }
  | { status: "expired"; session: SessionRow }
  | { status: "missing" };

export function validateSession(session: SessionRow | null): SessionValidationResult {
  if (!session) {
    return { status: "missing" };
  }

  if (session.revoked_at) {
    return { status: "revoked", session };
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return { status: "expired", session };
  }

  return { status: "active", session };
}

export async function touchSessionActivity(tokenJti: string) {
  await queryDb(
    `UPDATE login_sessions
        SET last_activity_at = NOW()
      WHERE token_jti = $1`,
    [tokenJti]
  );
}

export async function revokeSessionByToken(tokenJti: string, reason?: string) {
  await queryDb(
    `UPDATE login_sessions
        SET revoked_at = NOW(),
            revoke_reason = $2
      WHERE token_jti = $1`,
    [tokenJti, reason ?? "user_logout"]
  );
}

export async function revokeSessionById(sessionId: string, reason?: string) {
  await queryDb(
    `UPDATE login_sessions
        SET revoked_at = NOW(),
            revoke_reason = $2
      WHERE id = $1`,
    [sessionId, reason ?? "user_logout"]
  );
}

export function buildJti() {
  return randomUUID();
}
