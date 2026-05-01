/**
 * backend/src/modules/security/threatDashboard.routes.ts
 * 
 * Real-time threat detection dashboard and incident management API
 * Requires admin or security_team role
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { getThreatEngine } from "../../services/threatDetection/threatEngine.js";
import { queryDb } from "../../db/client.js";
import { logger } from "../../shared/logger.js";

export const threatDashboardRoutes = Router();

// ===== AUTHORIZATION =====

function requireSecurityTeam(req: Request, res: Response): boolean {
  const auth = res.locals.auth;
  if (!auth || !["admin", "security_admin"].includes(auth.role)) {
    return false;
  }
  return true;
}

// ===== SCHEMAS =====

const incidentUpdateSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]),
  investigation_notes: z.string().optional(),
  assigned_to: z.string().uuid().optional()
});

// ===== ENDPOINTS =====

/**
 * GET /api/security/dashboard/threats/active
 * Get active threats for organization
 */
threatDashboardRoutes.get("/threats/active", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const threats = await queryDb(
      `SELECT id, organization_id, user_id, signal_type, severity, combined_score,
              event_ids, detector_results, status, auto_response_taken,
              detected_at, created_at
       FROM threat_signals
       WHERE organization_id = $1 AND status = 'active'
       ORDER BY detected_at DESC
       LIMIT $2`,
      [orgId, limit]
    );

    res.json({
      count: threats.length,
      threats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/threats/by-type
 * Get threats grouped by type
 */
threatDashboardRoutes.get("/threats/by-type", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;

    const threats = await queryDb(
      `SELECT signal_type, severity, COUNT(*) as count, MAX(detected_at) as last_detected
       FROM threat_signals
       WHERE organization_id = $1 AND status = 'active'
       GROUP BY signal_type, severity
       ORDER BY count DESC`,
      [orgId]
    );

    res.json(threats);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/metrics
 * Get real-time security metrics
 */
threatDashboardRoutes.get("/metrics", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const threatEngine = getThreatEngine();

    const [activeThreats, failedLogins, crossOrgAttempts, sessionsRevoked] = await Promise.all(
      [
        queryDb(
          `SELECT COUNT(*) FROM threat_signals WHERE organization_id = $1 AND status = 'active'`,
          [orgId]
        ),
        queryDb(
          `SELECT COUNT(*) FROM login_failures 
           WHERE organization_id = $1 AND attempt_timestamp > NOW() - INTERVAL '24 hours'`,
          [orgId]
        ),
        queryDb(
          `SELECT COUNT(*) FROM threat_signals 
           WHERE organization_id = $1 AND signal_type = 'CROSS_ORG_ACCESS' 
           AND detected_at > NOW() - INTERVAL '24 hours'`,
          [orgId]
        ),
        queryDb(
          `SELECT COUNT(*) FROM login_sessions 
           WHERE organization_id = $1 AND revoked_at > NOW() - INTERVAL '24 hours'`,
          [orgId]
        )
      ]
    );

    res.json({
      activeThreats: parseInt(activeThreats[0]?.count || "0"),
      failedLogins24h: parseInt(failedLogins[0]?.count || "0"),
      crossOrgAttempts24h: parseInt(crossOrgAttempts[0]?.count || "0"),
      sessionsRevoked24h: parseInt(sessionsRevoked[0]?.count || "0"),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/threat-timeline
 * Get threat timeline (1-hour buckets)
 */
threatDashboardRoutes.get("/threat-timeline", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const hours = Math.min(parseInt(req.query.hours as string) || 24, 168);

    const timeline = await queryDb(
      `SELECT 
        DATE_TRUNC('hour', detected_at) as bucket,
        COUNT(*) as count,
        AVG(combined_score) as avg_score,
        MAX(combined_score) as max_score
       FROM threat_signals
       WHERE organization_id = $1 AND detected_at > NOW() - INTERVAL '${hours} hours'
       GROUP BY bucket
       ORDER BY bucket DESC`,
      [orgId]
    );

    res.json(timeline);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/threat/:threatId
 * Get threat details with related events
 */
threatDashboardRoutes.get("/threat/:threatId", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const { threatId } = req.params;

    const threat = await queryDb(
      `SELECT * FROM threat_signals WHERE id = $1 AND organization_id = $2`,
      [threatId, orgId]
    );

    if (!threat[0]) {
      return res.status(404).json({ error: "Threat not found" });
    }

    // Get related events
    const events = await queryDb(
      `SELECT * FROM threat_events
       WHERE id = ANY($1) OR organization_id = $2 AND user_id = $3
       ORDER BY detected_at DESC
       LIMIT 100`,
      [threat[0].event_ids || [], orgId, threat[0].user_id]
    );

    res.json({
      threat: threat[0],
      relatedEvents: events
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/incidents
 * Get security incidents
 */
threatDashboardRoutes.get("/incidents", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const status = (req.query.status as string) || "open";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const incidents = await queryDb(
      `SELECT * FROM security_incidents
       WHERE organization_id = $1 AND (status = $2 OR $2 = 'all')
       ORDER BY detected_at DESC
       LIMIT $3`,
      [orgId, status === "all" ? "%" : status, limit]
    );

    res.json({
      count: incidents.length,
      incidents
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/security/dashboard/incident/:incidentId
 * Update incident status and notes
 */
threatDashboardRoutes.patch(
  "/incident/:incidentId",
  requireAuth,
  validateBody(incidentUpdateSchema),
  async (req, res, next) => {
    try {
      if (!requireSecurityTeam(req, res)) {
        return res.status(403).json({ error: "Requires security team role" });
      }

      const orgId = res.locals.auth.organizationId;
      const { incidentId } = req.params;
      const { status, investigation_notes, assigned_to } = req.body;

      // Verify incident belongs to org
      const incident = await queryDb(
        `SELECT id FROM security_incidents WHERE id = $1 AND organization_id = $2`,
        [incidentId, orgId]
      );

      if (!incident[0]) {
        return res.status(404).json({ error: "Incident not found" });
      }

      // Update incident
      const result = await queryDb(
        `UPDATE security_incidents
         SET status = COALESCE($1, status),
             investigation_notes = COALESCE($2, investigation_notes),
             assigned_to = COALESCE($3, assigned_to),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, investigation_notes, assigned_to, incidentId]
      );

      logger.info("Incident updated", {
        incidentId,
        organizationId: orgId,
        status,
        updatedBy: res.locals.auth.userId
      });

      res.json(result[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/security/dashboard/ip-reputation/:ipAddress
 * Get IP reputation and history
 */
threatDashboardRoutes.get("/ip-reputation/:ipAddress", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const { ipAddress } = req.params;

    // Get IP reputation
    const reputation = await queryDb(
      `SELECT * FROM ip_reputation WHERE ip_address = $1::inet`,
      [ipAddress]
    );

    // Get recent threat events from this IP
    const threatEvents = await queryDb(
      `SELECT * FROM threat_signals
       WHERE metadata->>'ip_address' = $1
       ORDER BY detected_at DESC
       LIMIT 20`,
      [ipAddress]
    );

    res.json({
      reputation: reputation[0],
      threatEvents,
      isBlocked: reputation[0]?.blocked_until && new Date(reputation[0].blocked_until) > new Date()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/user/:userId/anomalies
 * Get user anomaly profile
 */
threatDashboardRoutes.get("/user/:userId/anomalies", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const { userId } = req.params;

    // Get anomaly baseline
    const anomalies = await queryDb(
      `SELECT * FROM user_anomalies
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, orgId]
    );

    // Get recent threats
    const threats = await queryDb(
      `SELECT * FROM threat_signals
       WHERE user_id = $1 AND organization_id = $2
       ORDER BY detected_at DESC
       LIMIT 20`,
      [userId, orgId]
    );

    // Get access history
    const accessHistory = await queryDb(
      `SELECT ip_address, user_agent, COUNT(*) as count, MAX(created_at) as last_access
       FROM audit_logs
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
       GROUP BY ip_address, user_agent
       ORDER BY MAX(created_at) DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      anomalies: anomalies[0],
      recentThreats: threats,
      accessHistory
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/security/dashboard/threat/:threatId/dismiss
 * Mark threat as false positive
 */
threatDashboardRoutes.post("/threat/:threatId/dismiss", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const orgId = res.locals.auth.organizationId;
    const { threatId } = req.params;

    const result = await queryDb(
      `UPDATE threat_signals
       SET status = 'false_positive'
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [threatId, orgId]
    );

    logger.info("Threat dismissed as false positive", {
      threatId,
      organizationId: orgId,
      dismissedBy: res.locals.auth.userId
    });

    res.json(result[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/security/dashboard/detectors
 * Get threat detector status and configuration
 */
threatDashboardRoutes.get("/detectors", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const detectors = await queryDb(
      `SELECT id, detector_name, display_name, description, enabled, risk_threshold,
              auto_response_enabled, avg_processing_time_ms, last_triggered_at,
              false_positive_count, true_positive_count
       FROM threat_detectors
       ORDER BY detector_name`
    );

    res.json(detectors);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/security/dashboard/detector/:detectorId
 * Update detector configuration
 */
threatDashboardRoutes.patch("/detector/:detectorId", requireAuth, async (req, res, next) => {
  try {
    if (!requireSecurityTeam(req, res)) {
      return res.status(403).json({ error: "Requires security team role" });
    }

    const { detectorId } = req.params;
    const { enabled, risk_threshold, auto_response_enabled } = req.body;

    const result = await queryDb(
      `UPDATE threat_detectors
       SET enabled = COALESCE($1, enabled),
           risk_threshold = COALESCE($2, risk_threshold),
           auto_response_enabled = COALESCE($3, auto_response_enabled),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [enabled, risk_threshold, auto_response_enabled, detectorId]
    );

    logger.info("Detector configuration updated", {
      detectorId,
      updatedBy: res.locals.auth.userId,
      changes: { enabled, risk_threshold, auto_response_enabled }
    });

    res.json(result[0]);
  } catch (err) {
    next(err);
  }
});
