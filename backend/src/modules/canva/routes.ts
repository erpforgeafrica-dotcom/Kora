import { Router } from "express";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { getCanvaAuthorizationUrl, storeCanvaConnection } from "../../services/canva/auth.js";
import { exportCanvaDesign } from "../../services/canva/export.js";
import { listCanvaTemplates, saveCanvaTemplate } from "../../services/canva/templates.js";
import { respondSuccess } from "../../shared/response.js";

export const canvaRoutes = Router();

canvaRoutes.get("/authorize", async (_req, res) => {
  const state = `canva_${Date.now()}`;
  return respondSuccess(res, { state, authorization_url: getCanvaAuthorizationUrl(state) });
});

canvaRoutes.post("/callback", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const connection = await storeCanvaConnection(organizationId, res.locals.auth?.userId ?? null, {
      canva_user_id: String(req.body?.canva_user_id ?? "canva-user"),
      access_token: String(req.body?.access_token ?? "access-token"),
      refresh_token: req.body?.refresh_token ? String(req.body.refresh_token) : null,
      token_expires_at: req.body?.token_expires_at ? String(req.body.token_expires_at) : null
    });
    return respondSuccess(res, { connected: true, connection });
  } catch (error) {
    return next(error);
  }
});

canvaRoutes.get("/templates", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const templates = await listCanvaTemplates(organizationId);
    return respondSuccess(res, { count: templates.length, templates });
  } catch (error) {
    return next(error);
  }
});

canvaRoutes.post("/templates", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const template = await saveCanvaTemplate(organizationId, {
      external_template_id: String(req.body?.external_template_id ?? ""),
      name: String(req.body?.name ?? "Untitled Canva template"),
      category: req.body?.category ? String(req.body.category) : null,
      preview_url: req.body?.preview_url ? String(req.body.preview_url) : null,
      brand_kit_json: req.body?.brand_kit_json ?? {}
    });
    return respondSuccess(res, template, 201);
  } catch (error) {
    return next(error);
  }
});

canvaRoutes.post("/export", async (req, res, next) => {
  try {
    return respondSuccess(res,
      await exportCanvaDesign({
        template_id: String(req.body?.template_id ?? ""),
        format: req.body?.format ?? "png",
        title: req.body?.title ? String(req.body.title) : null
      })
    );
  } catch (error) {
    return next(error);
  }
});

