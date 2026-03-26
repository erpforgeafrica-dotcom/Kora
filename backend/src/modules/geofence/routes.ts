import { Router } from "express";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { createGeofence } from "../../services/gps/tracking.js";

export const geofenceRoutes = Router();

geofenceRoutes.post("/create", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const geofence = await createGeofence(organizationId, res.locals.auth?.userId ?? null, {
      name: String(req.body?.name ?? "Untitled geofence"),
      center_latitude: Number(req.body?.center_latitude),
      center_longitude: Number(req.body?.center_longitude),
      radius_meters: Number(req.body?.radius_meters ?? 100),
      target_type: req.body?.target_type ? String(req.body.target_type) : null,
      target_id: req.body?.target_id ? String(req.body.target_id) : null
    });
    return res.status(201).json(geofence);
  } catch (error) {
    return next(error);
  }
});

