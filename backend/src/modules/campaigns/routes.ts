import { Router } from "express";
import { createCampaignRecord, getCampaignStats, listCampaignRecords, markCampaignScheduled } from "../../db/repositories/campaignRepository.js";
import { enqueueCampaignDispatch } from "../../queues/index.js";
import { withTenantAlias } from "../../shared/blueprintAliases.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const campaignsRoutes = Router();

campaignsRoutes.get("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const campaigns = await listCampaignRecords(organizationId);
    return respondSuccess(res, withTenantAlias({ count: campaigns.length, campaigns }, organizationId));
  } catch (error) {
    return next(error);
  }
});

campaignsRoutes.post("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const row = await createCampaignRecord({
      organizationId,
      name: String(req.body?.name ?? "Untitled campaign"),
      channel: String(req.body?.channel ?? "sms"),
      subject: req.body?.subject ? String(req.body.subject) : null,
      body: String(req.body?.body ?? ""),
      audience: req.body?.audience ?? {},
      sendAt: req.body?.send_at ? String(req.body.send_at) : null,
      createdBy: null
    });

    return respondSuccess(res, withTenantAlias(row ?? {}, organizationId), 201);
  } catch (error) {
    return next(error);
  }
});

campaignsRoutes.post("/:id/send", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    await markCampaignScheduled(req.params.id, organizationId);

    const job = await enqueueCampaignDispatch({
      organizationId,
      campaignId: req.params.id
    });

    return res.status(202).json(withTenantAlias({ accepted: true, queue: "notifications", jobId: job.id }, organizationId));
  } catch (error) {
    return next(error);
  }
});

campaignsRoutes.get("/:id/stats", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const campaign = await getCampaignStats(req.params.id, organizationId);
    if (!campaign) {
      return respondError(res, "CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
    }

    return res.json(withTenantAlias(campaign, organizationId));
  } catch (error) {
    return next(error);
  }
});

