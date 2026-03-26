import { Router } from "express";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { getSessionAnalytics, scoreRecordingQuality } from "../../services/video/analytics.js";
import { createRecording, getRecording } from "../../services/video/recording.js";
import { getVideoSession, scheduleVideoSession } from "../../services/video/streaming.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const videoRoutes = Router();

videoRoutes.post("/sessions", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const session = await scheduleVideoSession(organizationId, res.locals.auth?.userId ?? null, {
      booking_id: req.body?.booking_id ? String(req.body.booking_id) : null,
      provider: req.body?.provider ? String(req.body.provider) : null,
      starts_at: req.body?.starts_at ? String(req.body.starts_at) : null
    });
    return respondSuccess(res, session, 201);
  } catch (error) {
    return next(error);
  }
});

videoRoutes.get("/sessions/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const session = await getVideoSession(organizationId, req.params.id);
    if (!session) return respondError(res, "VIDEO_SESSION_NOT_FOUND", "Video session not found", 404);
    return respondSuccess(res, session);
  } catch (error) {
    return next(error);
  }
});

videoRoutes.post("/recordings", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const recording = await createRecording(organizationId, {
      session_id: String(req.body?.session_id ?? ""),
      storage_key: String(req.body?.storage_key ?? ""),
      playback_url: req.body?.playback_url ? String(req.body.playback_url) : null,
      transcript_text: req.body?.transcript_text ? String(req.body.transcript_text) : null,
      duration_seconds: req.body?.duration_seconds != null ? Number(req.body.duration_seconds) : null
    });
    return respondSuccess(res, recording, 201);
  } catch (error) {
    return next(error);
  }
});

videoRoutes.get("/recordings/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const recording = await getRecording(organizationId, req.params.id);
    if (!recording) return respondError(res, "VIDEO_RECORDING_NOT_FOUND", "Video recording not found", 404);
    return respondSuccess(res, recording);
  } catch (error) {
    return next(error);
  }
});

videoRoutes.post("/recordings/:id/score", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    return respondSuccess(res, await scoreRecordingQuality(organizationId, req.params.id, Number(req.body?.quality_score ?? 0)));
  } catch (error) {
    return next(error);
  }
});

videoRoutes.get("/analytics/:sessionId", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    return respondSuccess(res, await getSessionAnalytics(organizationId, req.params.sessionId));
  } catch (error) {
    return next(error);
  }
});

