import { Router } from "express";
import { enqueueNotification, getQueueDepth } from "../../queues/index.js";
import {
  createNotificationLogRecord,
  listNotificationTemplates,
  upsertNotificationTemplate
} from "../../db/repositories/notificationsRepository.js";
import { withCustomerAlias, withTenantAlias } from "../../shared/blueprintAliases.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondError, respondList, respondSuccess } from "../../shared/response.js";

export const notificationsRoutes = Router();
const channels = ["email", "sms", "push", "whatsapp"] as const;
type Channel = (typeof channels)[number];

function isChannel(value: unknown): value is Channel {
  return typeof value === "string" && channels.includes(value as Channel);
}

notificationsRoutes.get("/channels", async (_req, res, next) => {
  try {
    const queueDepth = await getQueueDepth();
    return respondSuccess(res, withTenantAlias({
      module: "notifications",
      channels,
      queueDepth: queueDepth.notifications
    }, "platform"));
  } catch (err) {
    return next(err);
  }
});

notificationsRoutes.post("/dispatch", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId ?? req.header("x-org-id");
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const channel = req.body?.channel;
    if (!isChannel(channel)) {
      return respondError(res, "INVALID_CHANNEL", "Invalid channel", 400);
    }

    const payload = req.body?.payload;
    if (!payload || typeof payload !== "object") {
      return respondError(res, "INVALID_PAYLOAD", "Invalid payload", 400);
    }

    const job = await enqueueNotification({
      organizationId,
      channel,
      payload
    });

    return respondSuccess(
      res,
      withTenantAlias({
        accepted: true,
        queue: "notifications",
        jobId: job.id
      }, organizationId),
      202
    );
  } catch (err) {
    return next(err);
  }
});

notificationsRoutes.post("/send", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const channel = req.body?.channel;
    if (!isChannel(channel)) {
      return respondError(res, "INVALID_CHANNEL", "Invalid channel", 400);
    }

    const payload = req.body?.payload;
    if (!payload || typeof payload !== "object") {
      return respondError(res, "INVALID_PAYLOAD", "Invalid payload", 400);
    }

    const log = await createNotificationLogRecord({
      organizationId,
      clientId: req.body?.client_id ? String(req.body.client_id) : null,
      channel,
      event: String(req.body?.event ?? "manual_send"),
      recipient: String(req.body?.recipient ?? ""),
      payload
    });

    const job = await enqueueNotification({
      organizationId,
      channel,
      payload: {
        ...payload,
        notification_log_id: log?.id ?? null,
        event: String(req.body?.event ?? "manual_send"),
        recipient: String(req.body?.recipient ?? "")
      }
    });

    return respondSuccess(
      res,
      withCustomerAlias(
        withTenantAlias({ accepted: true, queue: "notifications", jobId: job.id, log_id: log?.id ?? null }, organizationId),
        req.body?.client_id ? String(req.body.client_id) : null
      ),
      202
    );
  } catch (err) {
    return next(err);
  }
});

notificationsRoutes.get("/templates", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await listNotificationTemplates(organizationId ?? null);

    return respondList(
      req,
      res,
      rows.map((row) => withTenantAlias(row, organizationId ?? "platform")),
      { count: rows.length, limit: rows.length || 1, page: 1 }
    );
  } catch (err) {
    return next(err);
  }
});

notificationsRoutes.put("/templates/:event", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const channel = req.body?.channel;
    if (channel !== "sms" && channel !== "email" && channel !== "push") {
      return respondError(res, "INVALID_CHANNEL", "Invalid channel", 400);
    }

    const row = await upsertNotificationTemplate({
      organizationId,
      event: req.params.event,
      channel,
      subject: req.body?.subject ? String(req.body.subject) : null,
      body: String(req.body?.body ?? ""),
      isActive: req.body?.is_active !== false
    });

    return respondSuccess(res, withTenantAlias(row ?? {}, organizationId));
  } catch (err) {
    return next(err);
  }
});
