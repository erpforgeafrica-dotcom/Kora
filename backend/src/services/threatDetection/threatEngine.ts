/**
 * backend/src/services/threatDetection/threatEngine.ts
 * 
 * Real-time threat detection engine
 * Integrates with Redis, database, and detector pipeline
 */

import { Redis } from "ioredis";
import { EventEmitter } from "events";
import { queryDb } from "../../db/client.js";
import { logger } from "../../shared/logger.js";
import { getRedisClient } from "../../shared/redis.js";

export interface ThreatEvent {
  id?: string;
  organizationId: string;
  userId?: string;
  eventType: string;
  source: "api" | "database" | "auth" | "infrastructure";
  severity: "low" | "medium" | "high" | "critical";
  threatScore: number; // 0-100
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  metadata: Record<string, any>;
  detectedAt?: Date;
}

export interface ThreatSignal {
  id?: string;
  organizationId: string;
  userId?: string;
  signalType: string;
  severity: "low" | "medium" | "high" | "critical";
  combinedScore: number; // 0-100
  eventIds?: string[];
  detectorResults?: Record<string, any>;
  status?: string;
  autoResponseTaken?: string;
  autoResponseTime?: Date;
  detectedAt?: Date;
}

export class ThreatDetectionEngine extends EventEmitter {
  private redis: Redis;
  private eventStream = "threat:events:stream";
  private signalStream = "threat:signals:stream";
  private detectors: Map<string, ThreatDetector> = new Map();
  private initialized = false;

  constructor() {
    super();
    this.redis = getRedisClient();
  }

  /**
   * Initialize threat engine: register detectors, start streams
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info("Initializing Threat Detection Engine");

    // Load detector configurations from database
    await this.loadDetectorRegistry();

    // Start consuming event stream
    this.startEventConsumer();

    // Start cleanup tasks
    this.startCleanupTasks();

    this.initialized = true;
    logger.info("Threat Detection Engine initialized");
  }

  /**
   * Load detector registry from database
   */
  private async loadDetectorRegistry(): Promise<void> {
    try {
      const rows = await queryDb(
        `SELECT id, detector_name, display_name, description, enabled, 
                risk_threshold, auto_response_enabled, auto_response_action
         FROM threat_detectors
         ORDER BY detector_name`
      );

      rows.forEach((row: any) => {
        this.detectors.set(row.detector_name, {
          name: row.detector_name,
          displayName: row.display_name,
          description: row.description,
          enabled: row.enabled,
          riskThreshold: row.risk_threshold,
          autoResponseEnabled: row.auto_response_enabled,
          autoResponseAction: row.auto_response_action
        });
      });

      logger.info(`Loaded ${this.detectors.size} threat detectors`);
    } catch (err) {
      logger.error("Failed to load detector registry", err);
    }
  }

  /**
   * Ingest security event into threat detection pipeline
   */
  async ingestEvent(event: ThreatEvent): Promise<string> {
    try {
      // 1. Assign unique ID if not present
      event.id = event.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      event.detectedAt = event.detectedAt || new Date();

      // 2. Store in database
      const result = await queryDb(
        `INSERT INTO threat_events (
          organization_id, user_id, event_type, source, severity, threat_score,
          ip_address, user_agent, session_id, request_id, metadata, detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          event.organizationId,
          event.userId || null,
          event.eventType,
          event.source,
          event.severity,
          event.threatScore,
          event.ipAddress || null,
          event.userAgent || null,
          event.sessionId || null,
          event.requestId || null,
          JSON.stringify(event.metadata),
          event.detectedAt
        ]
      );

      const eventId = result[0]?.id;

      // 3. Add to Redis Stream for real-time processing
      await this.redis.xadd(
        this.eventStream,
        "*",
        "eventId",
        eventId,
        "event",
        JSON.stringify(event)
      );

      // 4. Process through detectors asynchronously
      setImmediate(() => this.processEventAsync(event, eventId));

      return eventId;
    } catch (err) {
      logger.error("Failed to ingest event", err);
      throw err;
    }
  }

  /**
   * Process event through threat detectors (async)
   */
  private async processEventAsync(event: ThreatEvent, eventId: string): Promise<void> {
    try {
      const signals: ThreatSignal[] = [];

      // Run all enabled detectors in parallel
      const detectionPromises = Array.from(this.detectors.values())
        .filter((d) => d.enabled)
        .map((detector) =>
          this.runDetector(detector, event)
            .then((signal) => {
              if (signal) signals.push(signal);
            })
            .catch((err) => {
              logger.error(`Detector ${detector.name} failed`, err);
            })
        );

      await Promise.all(detectionPromises);

      // Aggregate signals
      if (signals.length > 0) {
        await this.aggregateSignals(signals, eventId, event);
      }
    } catch (err) {
      logger.error("Failed to process event", err);
    }
  }

  /**
   * Run individual detector
   */
  private async runDetector(detector: ThreatDetector, event: ThreatEvent): Promise<ThreatSignal | null> {
    try {
      // Skip if event doesn't match detector type
      const detectorMatch = this.getDetectorMatcher(detector.name);
      if (!detectorMatch(event)) {
        return null;
      }

      // Run detector logic
      let signal: ThreatSignal | null = null;

      switch (detector.name) {
        case "sql_injection":
          signal = await this.detectSQLInjection(event);
          break;
        case "cross_org_access":
          signal = await this.detectCrossOrgAccess(event);
          break;
        case "brute_force":
          signal = await this.detectBruteForce(event);
          break;
        case "impossible_travel":
          signal = await this.detectImpossibleTravel(event);
          break;
        case "data_exfiltration":
          signal = await this.detectDataExfiltration(event);
          break;
        case "privilege_escalation":
          signal = await this.detectPrivilegeEscalation(event);
          break;
        case "token_anomaly":
          signal = await this.detectTokenAnomaly(event);
          break;
        case "rate_limit":
          signal = await this.detectRateLimit(event);
          break;
      }

      return signal;
    } catch (err) {
      logger.error(`Detector ${detector.name} error`, err);
      return null;
    }
  }

  /**
   * SQL Injection Detector
   */
  private async detectSQLInjection(event: ThreatEvent): Promise<ThreatSignal | null> {
    const sqlKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "UNION", "SELECT", "EXEC"];
    const params = event.metadata.params || [];

    let injectionDetected = false;

    params.forEach((param: any) => {
      const paramStr = String(param).toUpperCase();
      if (sqlKeywords.some((keyword) => paramStr.includes(keyword))) {
        injectionDetected = true;
      }
    });

    if (injectionDetected) {
      return {
        organizationId: event.organizationId,
        userId: event.userId,
        signalType: "SQL_INJECTION_ATTEMPT",
        severity: "critical",
        combinedScore: 95,
        status: "active",
        detectorResults: {
          sqlKeywordsFound: true,
          suspiciousParams: params
        }
      };
    }

    return null;
  }

  /**
   * Cross-Organization Access Detector
   */
  private async detectCrossOrgAccess(event: ThreatEvent): Promise<ThreatSignal | null> {
    const { userOrgId, resourceOrgId } = event.metadata;

    if (userOrgId && resourceOrgId && userOrgId !== resourceOrgId) {
      return {
        organizationId: event.organizationId,
        userId: event.userId,
        signalType: "CROSS_ORG_ACCESS",
        severity: "critical",
        combinedScore: 100,
        status: "active",
        detectorResults: {
          userOrgId,
          resourceOrgId,
          resourceId: event.metadata.resourceId,
          resourceType: event.metadata.resourceType
        }
      };
    }

    return null;
  }

  /**
   * Brute Force Attack Detector
   */
  private async detectBruteForce(event: ThreatEvent): Promise<ThreatSignal | null> {
    const email = event.metadata.email || event.userId;
    if (!email) return null;

    // Count recent failures (last 15 minutes)
    const failureKey = `login:failures:${email}`;
    const recentFailures = await this.redis.incr(failureKey);
    await this.redis.expire(failureKey, 900);

    if (recentFailures > 5) {
      const severity = recentFailures > 10 ? "critical" : "high";

      return {
        organizationId: event.organizationId,
        userId: email,
        signalType: "BRUTE_FORCE_ATTACK",
        severity: severity as any,
        combinedScore: Math.min(30 + recentFailures * 5, 100),
        status: "active",
        detectorResults: {
          failureCount: recentFailures,
          timeWindow: "15 minutes"
        }
      };
    }

    return null;
  }

  /**
   * Impossible Travel Detector
   */
  private async detectImpossibleTravel(event: ThreatEvent): Promise<ThreatSignal | null> {
    if (!event.userId || !event.ipAddress) return null;

    const lastLocationKey = `user:location:${event.userId}`;
    const lastLocationStr = await this.redis.get(lastLocationKey);

    if (!lastLocationStr) {
      // First access, store location
      await this.redis.setex(
        lastLocationKey,
        86400,
        JSON.stringify({ ip: event.ipAddress, timestamp: Date.now() })
      );
      return null;
    }

    const lastLocation = JSON.parse(lastLocationStr);
    const timeDelta = Date.now() - lastLocation.timestamp; // milliseconds
    const distance = this.calculateGeoDistance(lastLocation.ip, event.ipAddress); // km

    if (timeDelta > 0) {
      const requiredSpeed = (distance / (timeDelta / 3600000)).toFixed(2); // km/h
      const maxSpeed = 900; // max commercial flight speed

      if (parseFloat(requiredSpeed) > maxSpeed) {
        return {
          organizationId: event.organizationId,
          userId: event.userId,
          signalType: "IMPOSSIBLE_TRAVEL",
          severity: "high",
          combinedScore: 85,
          status: "active",
          detectorResults: {
            lastIp: lastLocation.ip,
            currentIp: event.ipAddress,
            distance: distance,
            requiredSpeed: requiredSpeed,
            maxSpeed: maxSpeed
          }
        };
      }
    }

    // Update location
    await this.redis.setex(
      lastLocationKey,
      86400,
      JSON.stringify({ ip: event.ipAddress, timestamp: Date.now() })
    );

    return null;
  }

  /**
   * Data Exfiltration Detector
   */
  private async detectDataExfiltration(event: ThreatEvent): Promise<ThreatSignal | null> {
    if (!event.userId) return null;

    const accessSize = event.metadata.rowsReturned || 0;
    const baselineKey = `user:access:baseline:${event.userId}`;
    const baselineStr = await this.redis.get(baselineKey);

    const baseline = baselineStr
      ? JSON.parse(baselineStr)
      : { avgSize: 100 };

    // Flag if accessing 10x more data
    if (accessSize > baseline.avgSize * 10) {
      return {
        organizationId: event.organizationId,
        userId: event.userId,
        signalType: "DATA_EXFILTRATION_ATTEMPT",
        severity: "high",
        combinedScore: 80,
        status: "active",
        detectorResults: {
          accessSize,
          baselineSize: baseline.avgSize,
          multiplier: accessSize / baseline.avgSize
        }
      };
    }

    return null;
  }

  /**
   * Privilege Escalation Detector
   */
  private async detectPrivilegeEscalation(event: ThreatEvent): Promise<ThreatSignal | null> {
    if (!event.userId) return null;

    const userRole = event.metadata.userRole;
    const attemptedAction = event.metadata.attemptedAction;

    // Flag if non-admin accessing admin endpoints
    if (userRole !== "admin" && attemptedAction?.includes("admin")) {
      return {
        organizationId: event.organizationId,
        userId: event.userId,
        signalType: "PRIVILEGE_ESCALATION",
        severity: "high",
        combinedScore: 80,
        status: "active",
        detectorResults: {
          userRole,
          attemptedAction
        }
      };
    }

    return null;
  }

  /**
   * Token Anomaly Detector
   */
  private async detectTokenAnomaly(event: ThreatEvent): Promise<ThreatSignal | null> {
    // Check for token reuse, unusual timing, etc.
    const anomalies = event.metadata.anomalies || [];

    if (anomalies.length > 0) {
      return {
        organizationId: event.organizationId,
        userId: event.userId,
        signalType: "TOKEN_ANOMALY",
        severity: "medium",
        combinedScore: 65,
        status: "active",
        detectorResults: { anomalies }
      };
    }

    return null;
  }

  /**
   * Rate Limit Detector
   */
  private async detectRateLimit(event: ThreatEvent): Promise<ThreatSignal | null> {
    if (!event.ipAddress) return null;

    const rateLimitKey = `ratelimit:${event.ipAddress}`;
    const count = await this.redis.incr(rateLimitKey);
    await this.redis.expire(rateLimitKey, 60); // 1 minute window

    if (count > 100) {
      return {
        organizationId: event.organizationId,
        signalType: "RATE_LIMIT_VIOLATION",
        severity: "medium",
        combinedScore: 70,
        status: "active",
        detectorResults: { requestCount: count }
      };
    }

    return null;
  }

  /**
   * Aggregate threat signals and store in database
   */
  private async aggregateSignals(
    signals: ThreatSignal[],
    eventId: string,
    event: ThreatEvent
  ): Promise<void> {
    try {
      for (const signal of signals) {
        // Store signal in database
        const result = await queryDb(
          `INSERT INTO threat_signals (
            organization_id, user_id, signal_type, severity, combined_score,
            event_ids, detector_results, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            signal.organizationId,
            signal.userId || null,
            signal.signalType,
            signal.severity,
            signal.combinedScore,
            JSON.stringify([eventId]),
            JSON.stringify(signal.detectorResults),
            signal.status || "active"
          ]
        );

        const signalId = result[0]?.id;

        // Add to Redis Stream
        await this.redis.xadd(
          this.signalStream,
          "*",
          "signalId",
          signalId,
          "signal",
          JSON.stringify(signal)
        );

        // Emit for real-time subscribers
        this.emit("threat-detected", { ...signal, id: signalId });

        // Handle response if needed
        await this.respondToSignal(signal, signalId, event);
      }
    } catch (err) {
      logger.error("Failed to aggregate signals", err);
    }
  }

  /**
   * Respond to threat signal (revoke sessions, block IPs, etc.)
   */
  private async respondToSignal(signal: ThreatSignal, signalId: string, event: ThreatEvent): Promise<void> {
    try {
      // Get detector configuration
      const detector = this.detectors.get(
        signal.signalType.toLowerCase().replace(/_/g, "_")
      );

      if (!detector?.autoResponseEnabled) {
        return;
      }

      let responseAction = detector.autoResponseAction;

      // Auto-escalate response for critical threats
      if (signal.severity === "critical") {
        if (signal.userId) {
          await this.revokeUserSession(signal.userId, signalId);
          responseAction = "session_revoked";
        }

        if (event.ipAddress) {
          await this.blockIpAddress(event.ipAddress, signalId);
          responseAction = "ip_blocked";
        }
      }

      // Update signal with response action
      await queryDb(
        `UPDATE threat_signals SET auto_response_taken = $1, response_timestamp = NOW()
         WHERE id = $2`,
        [responseAction, signalId]
      );
    } catch (err) {
      logger.error("Failed to respond to signal", err);
    }
  }

  /**
   * Revoke user session
   */
  private async revokeUserSession(userId: string, signalId: string): Promise<void> {
    try {
      await queryDb(
        `UPDATE login_sessions SET revoked_at = NOW(), revoke_reason = $1
         WHERE user_id = $2 AND revoked_at IS NULL`,
        [`Threat detected: ${signalId}`, userId]
      );

      logger.warn("User session revoked", { userId, signalId });
    } catch (err) {
      logger.error("Failed to revoke session", err);
    }
  }

  /**
   * Block IP address
   */
  private async blockIpAddress(ipAddress: string, signalId: string): Promise<void> {
    try {
      await queryDb(
        `INSERT INTO ip_reputation (ip_address, risk_score, blocked_until)
         VALUES ($1, 100, NOW() + INTERVAL '24 hours')
         ON CONFLICT (ip_address) DO UPDATE SET
         risk_score = 100,
         blocked_until = NOW() + INTERVAL '24 hours'`,
        [ipAddress]
      );

      // Also block in Redis for immediate effect
      await this.redis.setex(`blocked:ip:${ipAddress}`, 86400, "1");

      logger.warn("IP blocked", { ipAddress, signalId });
    } catch (err) {
      logger.error("Failed to block IP", err);
    }
  }

  /**
   * Start consumer for event stream
   */
  private startEventConsumer(): void {
    // This will be handled by a separate worker process
    // (See threatWorker.ts)
    logger.info("Event consumer started");
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Cleanup old threat events every hour
    setInterval(() => {
      queryDb(`DELETE FROM threat_events WHERE created_at < NOW() - INTERVAL '30 days'`).catch(
        (err) => logger.error("Failed to cleanup old events", err)
      );
    }, 3600000);

    // Update user anomaly baselines every 6 hours
    setInterval(() => {
      this.updateAnomalyBaselines().catch((err) => {
        logger.error("Failed to update anomaly baselines", err);
      });
    }, 6 * 3600000);
  }

  /**
   * Update user anomaly baselines
   */
  private async updateAnomalyBaselines(): Promise<void> {
    // Calculate average login times, data access patterns, etc.
    // and update user_anomalies table
    try {
      await queryDb(`
        UPDATE user_anomalies ua SET
          avg_failed_attempts_24h = (
            SELECT COUNT(*) FROM login_failures
            WHERE identifier = u.email AND attempt_timestamp > NOW() - INTERVAL '24 hours'
          )
        FROM users u
        WHERE ua.user_id = u.id
      `);
    } catch (err) {
      logger.error("Failed to update baselines", err);
    }
  }

  /**
   * Matcher functions for detectors
   */
  private getDetectorMatcher(detectorName: string): (event: ThreatEvent) => boolean {
    switch (detectorName) {
      case "sql_injection":
        return (e) => e.source === "database" && e.metadata.params;
      case "cross_org_access":
        return (e) => e.source === "database" && e.metadata.userOrgId;
      case "brute_force":
        return (e) => e.eventType === "login_failed";
      case "impossible_travel":
        return (e) => e.userId && e.ipAddress;
      case "data_exfiltration":
        return (e) => e.source === "database" && e.metadata.rowsReturned;
      case "privilege_escalation":
        return (e) => e.metadata.userRole && e.metadata.attemptedAction;
      case "token_anomaly":
        return (e) => e.metadata.anomalies;
      case "rate_limit":
        return (e) => e.ipAddress;
      default:
        return () => false;
    }
  }

  /**
   * Calculate geo distance (simplified, use real GeoIP in production)
   */
  private calculateGeoDistance(ip1: string, ip2: string): number {
    // Simplified: would use real GeoIP database in production
    // For now, return 0 (same location)
    return 0;
  }

  /**
   * Query active threats
   */
  async getActiveThreatCount(organizationId?: string): Promise<number> {
    try {
      const query = organizationId
        ? `SELECT COUNT(*) FROM threat_signals WHERE organization_id = $1 AND status = 'active'`
        : `SELECT COUNT(*) FROM threat_signals WHERE status = 'active'`;

      const params = organizationId ? [organizationId] : [];
      const result = await queryDb(query, params);
      return parseInt(result[0]?.count || "0");
    } catch (err) {
      logger.error("Failed to get threat count", err);
      return 0;
    }
  }

  /**
   * Query threats by organization
   */
  async getOrgThreats(organizationId: string, limit = 20): Promise<ThreatSignal[]> {
    try {
      const rows = await queryDb(
        `SELECT id, organization_id, user_id, signal_type, severity, combined_score,
                event_ids, detector_results, status, auto_response_taken, detected_at
         FROM threat_signals
         WHERE organization_id = $1
         ORDER BY detected_at DESC
         LIMIT $2`,
        [organizationId, limit]
      );

      return rows as any;
    } catch (err) {
      logger.error("Failed to query threats", err);
      return [];
    }
  }
}

interface ThreatDetector {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  riskThreshold: number;
  autoResponseEnabled: boolean;
  autoResponseAction?: string;
}

// Singleton instance
let threatEngine: ThreatDetectionEngine | null = null;

export function getThreatEngine(): ThreatDetectionEngine {
  if (!threatEngine) {
    threatEngine = new ThreatDetectionEngine();
  }
  return threatEngine;
}
