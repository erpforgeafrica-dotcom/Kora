/**
 * backend/src/services/threatDetection/init.ts
 * 
 * Initialize threat detection system on app startup
 */

import { Express } from "express";
import { getThreatEngine } from "./threatEngine.js";
import { queryDb } from "../../db/client.js";
import { logger } from "../../shared/logger.js";

/**
 * Initialize threat detection system
 * - Load detector registry
 * - Start event processing pipeline
 * - Register routes
 */
export async function initializeThreatDetection(app: Express): Promise<void> {
  try {
    logger.info("Initializing threat detection system...");

    // 1. Initialize threat engine
    const threatEngine = getThreatEngine();
    await threatEngine.initialize();

    // 2. Ensure detector registry is populated
    await initializeDetectorRegistry();

    // 3. Mount security routes
    const { threatDashboardRoutes } = await import("../../modules/security/threatDashboard.routes.js");
    app.use("/api/security/dashboard", threatDashboardRoutes);

    // 4. Register event capture middleware
    const { captureThreatEvents } = await import("../../middleware/threatEventCapture.js");
    app.use(captureThreatEvents);

    logger.info("✓ Threat detection system initialized");
  } catch (err) {
    logger.error("Failed to initialize threat detection", { err: String(err) });
    // Don't fail app startup - threat detection is optional
  }
}

/**
 * Initialize detector registry in database
 */
async function initializeDetectorRegistry(): Promise<void> {
  try {
    const detectors = [
      {
        name: "sql_injection",
        displayName: "SQL Injection",
        description: "Detects SQL injection attempts in database queries",
        enabled: true,
        riskThreshold: 85,
        autoResponseEnabled: true,
        autoResponseAction: "revoke_session"
      },
      {
        name: "cross_org_access",
        displayName: "Cross-Org Access",
        description: "Detects attempts to access other organizations' data",
        enabled: true,
        riskThreshold: 90,
        autoResponseEnabled: true,
        autoResponseAction: "revoke_session"
      },
      {
        name: "brute_force",
        displayName: "Brute Force Attack",
        description: "Detects multiple failed login attempts",
        enabled: true,
        riskThreshold: 70,
        autoResponseEnabled: true,
        autoResponseAction: "block_ip"
      },
      {
        name: "impossible_travel",
        displayName: "Impossible Travel",
        description: "Detects user access from geographically impossible locations",
        enabled: true,
        riskThreshold: 75,
        autoResponseEnabled: false,
        autoResponseAction: "require_mfa"
      },
      {
        name: "data_exfiltration",
        displayName: "Data Exfiltration",
        description: "Detects unusual data access patterns",
        enabled: true,
        riskThreshold: 75,
        autoResponseEnabled: false,
        autoResponseAction: "restrict_access"
      },
      {
        name: "privilege_escalation",
        displayName: "Privilege Escalation",
        description: "Detects attempts to access admin features without permission",
        enabled: true,
        riskThreshold: 80,
        autoResponseEnabled: true,
        autoResponseAction: "deny_access"
      },
      {
        name: "token_anomaly",
        displayName: "Token Anomaly",
        description: "Detects suspicious JWT token usage patterns",
        enabled: true,
        riskThreshold: 65,
        autoResponseEnabled: false,
        autoResponseAction: "require_reauth"
      },
      {
        name: "rate_limit",
        displayName: "Rate Limit Violation",
        description: "Detects excessive API requests",
        enabled: true,
        riskThreshold: 70,
        autoResponseEnabled: true,
        autoResponseAction: "block_ip"
      }
    ];

    for (const detector of detectors) {
      await queryDb(
        `INSERT INTO threat_detectors (
          detector_name, display_name, description, enabled,
          risk_threshold, auto_response_enabled, auto_response_action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (detector_name) DO UPDATE SET
          display_name = $2,
          description = $3,
          enabled = $4,
          risk_threshold = $5,
          auto_response_enabled = $6,
          auto_response_action = $7`,
        [
          detector.name,
          detector.displayName,
          detector.description,
          detector.enabled,
          detector.riskThreshold,
          detector.autoResponseEnabled,
          detector.autoResponseAction
        ]
      );
    }

    logger.info(`✓ Registered ${detectors.length} threat detectors`);
  } catch (err) {
    logger.error("Failed to initialize detector registry", { err: String(err) });
  }
}

export default initializeThreatDetection;
