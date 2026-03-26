import { Router } from "express";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { getProviderRoute, updateProviderLocation } from "../../services/gps/tracking.js";
import { respondSuccess } from "../../shared/response.js";

export const providersRoutes = Router();

providersRoutes.post("/:id/location", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const result = await updateProviderLocation(organizationId, req.params.id, {
      latitude: Number(req.body?.latitude),
      longitude: Number(req.body?.longitude),
      accuracy_meters: req.body?.accuracy_meters != null ? Number(req.body.accuracy_meters) : null,
      speed_kph: req.body?.speed_kph != null ? Number(req.body.speed_kph) : null,
      heading_degrees: req.body?.heading_degrees != null ? Number(req.body.heading_degrees) : null,
      source: req.body?.source ? String(req.body.source) : null
    });

    return respondSuccess(res, { updated: true, provider_id: req.params.id, location: result });
  } catch (error) {
    return next(error);
  }
});

providersRoutes.get("/:id/route", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    return respondSuccess(res, await getProviderRoute(organizationId, req.params.id));
  } catch (error) {
    return next(error);
  }
});

