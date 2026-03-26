import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  createCustomer, getCustomerLoyalty, getCustomerProfile,
  listCustomers, redeemCustomerLoyalty, updateCustomerProfile
} from "../../db/repositories/customerRepository.js";
import { queryDb } from "../../db/client.js";
import { enqueueNotification } from "../../queues/index.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";

export const clientsRoutes = Router();

clientsRoutes.get("/", requireAuth, requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const customers = await listCustomers(organizationId, { limit, offset, search });
    return respondList(req, res, customers, { count: customers.length, limit, page: Math.floor(offset / limit) + 1 });
  } catch (error) { return next(error); }
});

clientsRoutes.post("/", requireAuth, requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const fullName = String(req.body?.full_name ?? "").trim();
    const phone = req.body?.phone ? String(req.body.phone).trim() : null;
    const preferredStaffId = req.body?.preferred_staff_id ? String(req.body.preferred_staff_id) : null;
    if (!email || !fullName) return respondError(res, "MISSING_REQUIRED_CLIENT_FIELDS", "Email and full_name are required", 400);
    const client = await createCustomer(organizationId, {
      email, full_name: fullName, phone, preferred_staff_id: preferredStaffId,
      telehealth_consent: Boolean(req.body?.telehealth_consent),
      preferences: req.body?.preferences ?? {}
    });
    if (!client) return respondError(res, "CLIENT_CREATE_FAILED", "Failed to create client", 500);
    await queryDb(
      `insert into audit_logs (id, organization_id, actor_id, action, metadata) values (gen_random_uuid(), $1, null, 'client.created', $2::jsonb)`,
      [organizationId, JSON.stringify({ client_id: client.id, email, actor_external_id: res.locals.auth?.userId ?? null })]
    );
    if (phone) {
      await enqueueNotification({ organizationId, channel: "sms", payload: { to: phone, template: "client_welcome", client_name: fullName } });
    }
    return respondSuccess(res, { id: client.id, full_name: fullName, email, phone, created_at: client.created_at }, 201);
  } catch (error) { return next(error); }
});

clientsRoutes.get("/:id", requireAuth, requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const client = await getCustomerProfile(organizationId, req.params.id);
    if (!client) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    return respondSuccess(res, client);
  } catch (error) { return next(error); }
});

clientsRoutes.put("/:id", requireAuth, requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const updated = await updateCustomerProfile(organizationId, req.params.id, {
      full_name: req.body?.full_name ? String(req.body.full_name) : null,
      phone: req.body?.phone ? String(req.body.phone) : null,
      membership_tier: req.body?.membership_tier ? String(req.body.membership_tier) : null,
      telehealth_consent: typeof req.body?.telehealth_consent === "boolean" ? req.body.telehealth_consent : null,
      preferred_staff_id: req.body?.preferred_staff_id ? String(req.body.preferred_staff_id) : null,
      preferences: req.body?.preferences ?? null
    });
    if (!updated) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    await queryDb(
      `insert into audit_logs (id, organization_id, actor_id, action, metadata) values (gen_random_uuid(), $1, null, 'client.updated', $2::jsonb)`,
      [organizationId, JSON.stringify({ client_id: req.params.id, actor_external_id: res.locals.auth?.userId ?? null })]
    );
    return respondSuccess(res, updated);
  } catch (error) { return next(error); }
});

clientsRoutes.patch("/:id", requireAuth, requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const updated = await updateCustomerProfile(organizationId, req.params.id, {
      full_name: req.body?.full_name ? String(req.body.full_name) : null,
      phone: req.body?.phone ? String(req.body.phone) : null,
      membership_tier: req.body?.membership_tier ? String(req.body.membership_tier) : null,
      telehealth_consent: typeof req.body?.telehealth_consent === "boolean" ? req.body.telehealth_consent : null,
      preferred_staff_id: req.body?.preferred_staff_id ? String(req.body.preferred_staff_id) : null,
      preferences: req.body?.preferences ?? null
    });
    if (!updated) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    return respondSuccess(res, updated);
  } catch (error) { return next(error); }
});

clientsRoutes.get("/:id/loyalty", requireAuth, requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const loyalty = await getCustomerLoyalty(organizationId, req.params.id);
    if (!loyalty) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    return respondSuccess(res, loyalty);
  } catch (error) { return next(error); }
});

clientsRoutes.post("/:id/loyalty/redeem", requireAuth, requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const points = Number(req.body?.points ?? 0);
    if (!Number.isFinite(points) || points <= 0) return respondError(res, "INVALID_POINTS", "Points must be a positive number", 400);
    const redemption = await redeemCustomerLoyalty(organizationId, req.params.id, {
      points,
      description: String(req.body?.description ?? "Loyalty redemption"),
      discount_amount_cents: Number(req.body?.discount_amount_cents ?? 0)
    });
    if (redemption.kind === "not_found") return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    if (redemption.kind === "insufficient_points") return respondError(res, "INSUFFICIENT_LOYALTY_POINTS", "Insufficient loyalty points", 400);
    await queryDb(
      `insert into audit_logs (id, organization_id, actor_id, action, metadata) values (gen_random_uuid(), $1, null, 'client.loyalty.redeemed', $2::jsonb)`,
      [organizationId, JSON.stringify({ client_id: req.params.id, points, actor_external_id: res.locals.auth?.userId ?? null })]
    );
    return respondSuccess(res, { redeemed: redemption.redeemed, points: redemption.points, balance_after: redemption.balance_after }, 202);
  } catch (error) { return next(error); }
});

clientsRoutes.delete("/:id", requireAuth, requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb<{ id: string }>(
      `delete from clients where organization_id = $1 and id = $2 returning id::text`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    return respondSuccess(res, { deleted: true, id: rows[0].id });
  } catch (error) { return next(error); }
});
