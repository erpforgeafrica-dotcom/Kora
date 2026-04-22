import { Router } from "express";
import { Webhook } from "svix";
import { queryDb } from "../../db/client.js";
import { respondSuccess, respondError } from "../../shared/response.js";
import { logger } from "../../shared/logger.js";

/**
 * Clerk Webhook Handler
 * Mounted at: POST /api/webhooks/clerk
 * Required env: CLERK_WEBHOOK_SECRET (from Clerk dashboard → Webhooks)
 *
 * Syncs Clerk identity events into KORA's database:
 *   user.created / user.updated / user.deleted
 *   organization.created / organization.updated
 *   organizationMembership.created / .updated / .deleted
 */
export const clerkWebhookRoutes = Router();

clerkWebhookRoutes.post("/clerk", async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("CLERK_WEBHOOK_SECRET not set");
    return respondError(res, "WEBHOOK_NOT_CONFIGURED", "Clerk webhook secret not configured", 500);
  }

  const rawBody: Buffer | undefined = (req as any).rawBody;
  if (!rawBody) return respondError(res, "MISSING_BODY", "Raw body not available", 400);

  const wh = new Webhook(secret);
  let event: any;
  try {
    event = wh.verify(rawBody, {
      "svix-id":        req.header("svix-id") ?? "",
      "svix-timestamp": req.header("svix-timestamp") ?? "",
      "svix-signature": req.header("svix-signature") ?? "",
    });
  } catch {
    logger.warn("Clerk webhook signature verification failed");
    return respondError(res, "INVALID_SIGNATURE", "Webhook signature verification failed", 400);
  }

  const { type, data } = event;
  logger.info("Clerk webhook received", { type, id: data?.id });

  const safe = async (fn: () => Promise<unknown>, label: string) => {
    try { await fn(); } catch (e: any) { logger.warn(`Clerk webhook: ${label} skipped`, { err: e?.message }); }
  };

  switch (type) {
    case "user.created":
    case "user.updated": {
      const email = data.email_addresses?.[0]?.email_address ?? null;
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || email;
      const role = data.public_metadata?.role ?? "client";
      await safe(() => queryDb(
        `INSERT INTO users (id, email, full_name, role, created_at, updated_at)
         VALUES ($1,$2,$3,$4,now(),now())
         ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, full_name=EXCLUDED.full_name, role=EXCLUDED.role, updated_at=now()`,
        [data.id, email, fullName, role]
      ), "user upsert");
      break;
    }
    case "user.deleted":
      await safe(() => queryDb(
        `UPDATE users SET deleted_at=now(), updated_at=now() WHERE id=$1`, [data.id]
      ), "user soft-delete");
      break;

    case "organization.created":
    case "organization.updated":
      await safe(() => queryDb(
        `INSERT INTO organizations (id, name, slug, created_at, updated_at)
         VALUES ($1,$2,$3,now(),now())
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, updated_at=now()`,
        [data.id, data.name ?? "Unnamed", data.slug ?? data.id]
      ), "org upsert");
      break;

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const userId = data.public_user_data?.user_id ?? data.user_id;
      const orgId  = data.organization?.id ?? data.organization_id;
      const koraRole = data.role === "org:admin" || data.role === "org:owner" ? "business_admin" : "staff";
      await safe(() => queryDb(
        `INSERT INTO organization_members (user_id, organization_id, role, created_at, updated_at)
         VALUES ($1,$2,$3,now(),now())
         ON CONFLICT (user_id, organization_id) DO UPDATE SET role=EXCLUDED.role, updated_at=now()`,
        [userId, orgId, koraRole]
      ), "org membership upsert");
      break;
    }
    case "organizationMembership.deleted": {
      const userId = data.public_user_data?.user_id ?? data.user_id;
      const orgId  = data.organization?.id ?? data.organization_id;
      await safe(() => queryDb(
        `DELETE FROM organization_members WHERE user_id=$1 AND organization_id=$2`, [userId, orgId]
      ), "org membership delete");
      break;
    }
    default:
      logger.info("Clerk webhook event not handled", { type });
  }

  return respondSuccess(res, { received: true, type });
});
