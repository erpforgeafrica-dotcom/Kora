import { Router, type Response } from "express";
import { getAiSpendSummaryRows, getPlatformRevenueAnalytics, listAuditLogRows, listPlatformBusinesses, listPlatformUsers, listTenantHealthRows } from "../../db/repositories/platformRepository.js";
import { listFeaturedMarketplaceListings } from "../../db/repositories/discoveryRepository.js";
import {
  bulkManageUsers,
  createInvitations,
  createManagedUser,
  createRole,
  deleteManagedUser,
  deleteRole,
  getManagedUser,
  getRole,
  listInvitations,
  listManagedUsers,
  listPermissions,
  listRoles,
  resetManagedUserPassword,
  updateInvitationStatus,
  updateManagedUser,
  updateManagedUserStatus,
  updateRole
} from "../../db/repositories/userManagementRepository.js";
import { getQueueDepth } from "../../queues/index.js";
import { withTenantAlias } from "../../shared/blueprintAliases.js";
import { ForbiddenError } from "../../middleware/enhancedErrorHandler.js";
import { userHasAnyRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const platformRoutes = Router();

const platformAdminRoles: Array<"platform_admin" | "kora_superadmin"> = ["platform_admin", "kora_superadmin"];
const FEATURE_FLAGS = [
  { key: "booking_engine", enabled: true, source: "runtime", scope: "global" },
  { key: "operations_command_center", enabled: true, source: "runtime", scope: "global" },
  { key: "phase7_module_navigation", enabled: true, source: "runtime", scope: "global" },
  { key: "payments_real_stripe", enabled: true, source: "runtime", scope: "global" },
  { key: "discovery_marketplace", enabled: true, source: "runtime", scope: "global" },
  { key: "campaign_engine", enabled: true, source: "runtime", scope: "global" },
  { key: "telehealth_console", enabled: false, source: "runtime", scope: "global" }
] as const;

function assertPlatformAccess(res: Response) {
  if (!userHasAnyRole(res.locals.auth?.userRole ?? null, platformAdminRoles)) {
    throw new ForbiddenError("forbidden");
  }
}

async function buildTenantHealthPayload() {
  const queueDepth = await getQueueDepth();
  const rows = await listTenantHealthRows();

  return rows.map((row) => {
    const budget = Number(row.ai_budget_utilisation_pct);
    const queueFailures = queueDepth.notifications + queueDepth.reporting + queueDepth.anomaly;
    let status: "healthy" | "degraded" | "critical" = "healthy";
    if (budget >= 95 || queueFailures > 25) {
      status = "critical";
    } else if (budget >= 80 || queueFailures > 10) {
      status = "degraded";
    }

    return {
      org_id: row.org_id,
      tenant_id: row.org_id,
      org_name: row.org_name,
      status,
      monthly_active_users: Number(row.monthly_active_users),
      ai_spend_this_month_usd: Number(row.ai_spend_this_month_usd),
      ai_budget_utilisation_pct: budget,
      queue_failures_last_24h: queueFailures,
      last_login: row.last_login
    };
  });
}

async function buildAiUsagePayload() {
  const summary = await getAiSpendSummaryRows();
  const providerRows = summary?.providerRows ?? [];
  const orgRows = summary?.orgRows ?? [];
  const taskRows = summary?.taskRows ?? [];

  const byProvider = {
    claude: 0,
    openai: 0,
    gemini: 0,
    mistral: 0
  };

  for (const row of providerRows) {
    if (row.provider === "anthropic") byProvider.claude = Number(row.spend_usd);
    if (row.provider === "openai") byProvider.openai = Number(row.spend_usd);
    if (row.provider === "google") byProvider.gemini = Number(row.spend_usd);
    if (row.provider === "mistral") byProvider.mistral = Number(row.spend_usd);
  }

  const totalSpend = Object.values(byProvider).reduce((sum, value) => sum + value, 0);

  const byOrg = orgRows.map((row) => ({
    org_id: row.org_id,
    tenant_id: row.org_id,
    org_name: row.org_name,
    spend_usd: Number(row.spend_usd),
    pct_of_total: totalSpend === 0 ? 0 : Number(((Number(row.spend_usd) / totalSpend) * 100).toFixed(2))
  }));

  return withTenantAlias({
    total_spend_usd: totalSpend,
    by_provider: byProvider,
    by_org: byOrg,
    top_task_types: taskRows.map((row) => ({
      task: row.task,
      token_count: Number(row.token_count),
      cost_usd: Number(row.cost_usd)
    })),
    budget_alerts: byOrg.filter((row) => row.pct_of_total >= 80)
  }, "platform");
}

async function buildRevenuePayload() {
  const { totals, byOrg } = await getPlatformRevenueAnalytics();
  return {
    completed_revenue_cents: Number(totals.completed_revenue),
    transaction_count: Number(totals.transaction_count),
    average_transaction_value_cents: Number(totals.average_transaction_value),
    by_org: byOrg.map((row) => ({
      org_id: row.org_id,
      tenant_id: row.org_id,
      org_name: row.org_name,
      completed_revenue_cents: Number(row.completed_revenue),
      transaction_count: Number(row.transaction_count)
    }))
  };
}

async function buildOverviewPayload() {
  const [tenantHealth, aiUsage, revenue, users] = await Promise.all([
    buildTenantHealthPayload(),
    buildAiUsagePayload(),
    buildRevenuePayload(),
    listManagedUsers({ page: 1, pageSize: 10 })
  ]);

  const criticalTenants = tenantHealth.filter((tenant) => tenant.status === "critical").length;
  const degradedTenants = tenantHealth.filter((tenant) => tenant.status === "degraded").length;

  return {
    tenant_health: tenantHealth,
    ai_usage: aiUsage,
    revenue,
    users: {
      count: users.count
    },
    feature_flags: {
      count: FEATURE_FLAGS.length,
      enabled_count: FEATURE_FLAGS.filter((flag) => flag.enabled).length
    },
    alerts: {
      critical_tenants: criticalTenants,
      degraded_tenants: degradedTenants,
      budget_alerts: aiUsage.budget_alerts.length
    }
  };
}

platformRoutes.get("/tenant-health", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, await buildTenantHealthPayload());
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/ai-spend-summary", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, await buildAiUsagePayload());
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/overview", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, await buildOverviewPayload());
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/ai-usage", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, await buildAiUsagePayload());
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/businesses", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const rows = await listPlatformBusinesses();
    return respondSuccess(res, 
      rows.map((row) => ({
        org_id: row.org_id,
        tenant_id: row.org_id,
        org_name: row.org_name,
        industry: row.industry,
        status: row.status ?? "active",
        created_at: row.created_at,
        monthly_active_users: Number(row.monthly_active_users)
      }))
    );
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/audit-logs", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const limit = Math.min(100, Math.max(10, Number(req.query.limit ?? 40)));
    const rows = await listAuditLogRows(limit);
    return respondSuccess(res, {
      count: rows.length,
      logs: rows.map((row) => ({
        id: row.id,
        organization_id: row.organization_id,
        tenant_id: row.organization_id,
        actor_id: row.actor_id,
        action: row.action,
        metadata: row.metadata,
        created_at: row.created_at
      }))
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/feature-flags", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, {
      count: FEATURE_FLAGS.length,
      flags: FEATURE_FLAGS
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/revenue-analytics", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, await buildRevenuePayload());
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/revenue", async (_req, res, next) => {
  try {
    assertPlatformAccess(res);
    return respondSuccess(res, await buildRevenuePayload());
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/subscription-plans", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    return respondSuccess(res, {
      count: 3,
      plans: [
        { id: "starter", name: "Starter", billing_cycle: "monthly", price_usd: 49, active: true, tenants_on_plan: 0 },
        { id: "operations", name: "Operations", billing_cycle: "monthly", price_usd: 149, active: true, tenants_on_plan: 0 },
        { id: "clinical_plus", name: "Clinical+", billing_cycle: "monthly", price_usd: 299, active: true, tenants_on_plan: 0 }
      ]
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/global-configuration", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    return respondSuccess(res, {
      environment: process.env.NODE_ENV ?? "development",
      auth_provider: "clerk",
      payments: {
        stripe_configured: Boolean(process.env.STRIPE_SECRET_KEY),
        webhook_configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
      },
      ai: {
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
        openai: Boolean(process.env.OPENAI_API_KEY),
        google: Boolean(process.env.GOOGLE_API_KEY),
        mistral: Boolean(process.env.MISTRAL_API_KEY)
      },
      modules: {
        booking_engine: true,
        discovery: true,
        campaigns: true,
        operations_command_center: true,
        inventory: false,
        telehealth: false
      }
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/module-readiness", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    return respondSuccess(res, {
      modules: [
        { key: "service_catalog", status: "live", source: "services" },
        { key: "revenue_reports", status: "live", source: "reporting" },
        { key: "inventory_stock", status: "pending_migration", source: "blueprint_alignment" },
        { key: "global_configuration", status: "runtime", source: "platform" }
      ]
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/marketplace-listings", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const city = typeof req.query.city === "string" ? req.query.city : undefined;
    const rows = await listFeaturedMarketplaceListings(city);
    return respondSuccess(res, {
      count: rows.length,
      listings: rows.map((row) => ({
        id: row.id,
        tenant_id: row.organization_id,
        organization_id: row.organization_id,
        slug: row.slug,
        display_name: row.display_name,
        city: row.city,
        rating: Number(row.rating),
        review_count: row.review_count,
        cover_image_url: row.cover_image_url,
        opens_at: row.opens_at,
        closes_at: row.closes_at,
        top_service_name: row.top_service_name,
        top_service_price: row.top_service_price ? Number(row.top_service_price) : null,
        visibility: "published"
      }))
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/automation-rules", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    return respondSuccess(res, {
      count: 6,
      rules: [
        { key: "waitlist_auto_notify", module: "availability", status: "active", trigger: "slot_opened", action: "notify_waitlist_client" },
        { key: "booking_reminder_24h", module: "notifications", status: "active", trigger: "booking_start_window", action: "enqueue_reminder_sms" },
        { key: "payment_failure_followup", module: "payments", status: "active", trigger: "payment_intent_failed", action: "mark_failed_and_alert" },
        { key: "review_sentiment_scoring", module: "discovery", status: "active", trigger: "review_created", action: "classify_sentiment" },
        { key: "credential_expiry_watch", module: "staff", status: "active", trigger: "credential_expiry_threshold", action: "raise_operations_alert" },
        { key: "inventory_auto_deduction", module: "inventory", status: "pending_migration", trigger: "service_completed", action: "decrement_stock" }
      ]
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/permissions", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const permissions = await listPermissions();
    return respondSuccess(res, { count: permissions.length, permissions });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/roles", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const roles = await listRoles();
    return respondSuccess(res, { count: roles.length, roles });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/roles", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const role = await createRole({
      organizationId: req.body.organizationId ?? null,
      name: req.body.name,
      description: req.body.description ?? null,
      permissionIds: Array.isArray(req.body.permissionIds) ? req.body.permissionIds : [],
      userIds: Array.isArray(req.body.userIds) ? req.body.userIds : []
    });

    return res.status(201).json({ role });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/roles/:id", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const role = await getRole(req.params.id);
    if (!role) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { role });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.put("/roles/:id", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const role = await updateRole(req.params.id, {
      organizationId: req.body.organizationId ?? null,
      name: req.body.name,
      description: req.body.description ?? null,
      permissionIds: Array.isArray(req.body.permissionIds) ? req.body.permissionIds : [],
      userIds: Array.isArray(req.body.userIds) ? req.body.userIds : undefined
    });
    if (!role) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { role });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.delete("/roles/:id", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const deleted = await deleteRole(req.params.id);
    if (!deleted) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/users", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);

    if (search || role || status || req.query.page || req.query.pageSize) {
      const result = await listManagedUsers({ search, role, status, page, pageSize });
      return respondSuccess(res, {
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        users: result.users.map((row) => ({
          id: row.id,
          organization_id: row.organization_id,
          tenant_id: row.organization_id,
          branch_id: row.branch_id,
          first_name: row.first_name,
          last_name: row.last_name,
          name: row.name,
          email: row.email,
          phone: row.phone,
          profile_image_url: row.profile_image_url,
          role_id: row.role_id,
          role_name: row.role_name,
          role_description: row.role_description,
          status: row.status ?? "active",
          email_verified: row.email_verified ?? false,
          phone_verified: row.phone_verified ?? false,
          last_login_at: row.last_login_at,
          created_at: row.created_at,
          updated_at: row.updated_at
        }))
      });
    }

    const limit = Math.min(200, Math.max(20, Number(req.query.limit ?? 80)));
    const rows = await listPlatformUsers(limit);
    return respondSuccess(res, {
      count: rows.length,
      users: rows.map((row) => ({
        id: row.id,
        organization_id: row.organization_id,
        tenant_id: row.organization_id,
        branch_id: row.branch_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role_id: row.role_id,
        status: row.status ?? "active",
        created_at: row.created_at
      }))
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/users", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const user = await createManagedUser({
      organizationId: req.body.organizationId ?? null,
      branchId: req.body.branchId ?? null,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone ?? null,
      roleId: req.body.roleId ?? null,
      roleName: req.body.roleName ?? null,
      password: req.body.password ?? null,
      profileImageUrl: req.body.profileImageUrl ?? null,
      status: req.body.status ?? "active",
      emailVerified: Boolean(req.body.emailVerified),
      phoneVerified: Boolean(req.body.phoneVerified)
    });

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/users/bulk", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const result = await bulkManageUsers(req.body.action, Array.isArray(req.body.userIds) ? req.body.userIds : []);
    return respondSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/users/:id", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const user = await getManagedUser(req.params.id);
    if (!user) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { user });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.put("/users/:id", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const user = await updateManagedUser(req.params.id, {
      organizationId: req.body.organizationId ?? null,
      branchId: req.body.branchId ?? null,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone ?? null,
      roleId: req.body.roleId ?? null,
      roleName: req.body.roleName ?? null,
      profileImageUrl: req.body.profileImageUrl ?? null,
      status: req.body.status ?? "active",
      emailVerified: Boolean(req.body.emailVerified),
      phoneVerified: Boolean(req.body.phoneVerified)
    });
    if (!user) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { user });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.delete("/users/:id", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const deleted = await deleteManagedUser(req.params.id);
    if (!deleted) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/users/:id/status", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const updated = await updateManagedUserStatus(req.params.id, req.body.status);
    if (!updated) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { user: updated });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.patch("/users/:id/status", async (req, res, next) => {
  try {
    assertPlatformAccess(res);
    const updated = await updateManagedUserStatus(req.params.id, req.body.status);
    if (!updated) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }
    return respondSuccess(res, { user: updated });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.patch("/users/:id/role", async (req, res, next) => {
  try {
    assertPlatformAccess(res);
    const existing = await getManagedUser(req.params.id);
    if (!existing) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    const [firstName = existing.name ?? "", ...rest] = (existing.first_name ?? existing.name ?? "").split(" ");
    const nextUser = await updateManagedUser(req.params.id, {
      organizationId: existing.organization_id,
      branchId: existing.branch_id,
      firstName,
      lastName: existing.last_name ?? rest.join(" "),
      email: existing.email,
      phone: existing.phone,
      roleId: req.body.roleId ?? existing.role_id,
      roleName: req.body.roleName ?? undefined,
      profileImageUrl: existing.profile_image_url,
      status: existing.status ?? "active",
      emailVerified: existing.email_verified ?? false,
      phoneVerified: existing.phone_verified ?? false
    });

    if (!nextUser) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { user: nextUser });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/users/:id/reset-password", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const updated = await resetManagedUserPassword(req.params.id, req.body.password ?? "TempPass123!");
    if (!updated) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { reset: true });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/users/:id/impersonate", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const user = await getManagedUser(req.params.id);
    if (!user) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, {
      impersonation: {
        allowed: true,
        user_id: user.id,
        email: user.email,
        role_name: user.role_name ?? "unassigned"
      }
    });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.get("/invitations", async (_req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const invitations = await listInvitations();
    return respondSuccess(res, { count: invitations.length, invitations });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/invitations", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const emails = Array.isArray(req.body.emails)
      ? req.body.emails
      : String(req.body.emails ?? "")
          .split(/[\s,;]+/)
          .map((value: string) => value.trim())
          .filter(Boolean);

    const invitations = await createInvitations({
      organizationId: req.body.organizationId ?? null,
      emails,
      roleId: req.body.roleId ?? null,
      customMessage: req.body.customMessage ?? null,
      invitedBy: res.locals.auth?.userId ?? null
    });

    return res.status(201).json({ count: invitations.length, invitations });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/invitations/:id/resend", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const invitation = await updateInvitationStatus(req.params.id, "pending");
    if (!invitation) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { invitation });
  } catch (error) {
    return next(error);
  }
});

platformRoutes.post("/invitations/:id/cancel", async (req, res, next) => {
  try {
    if (!userHasAnyRole(res.locals.auth?.userRole ?? null, ["kora_superadmin", "platform_admin"])) {
      return next(new ForbiddenError("forbidden"));
    }

    const invitation = await updateInvitationStatus(req.params.id, "cancelled");
    if (!invitation) {
      return respondError(res, "NOT_FOUND", "Not found", 404);
    }

    return respondSuccess(res, { invitation });
  } catch (error) {
    return next(error);
  }
});


