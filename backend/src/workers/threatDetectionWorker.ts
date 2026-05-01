import { Worker } from "bullmq";
import Redis from "ioredis";
import { logger } from "../../shared/logger.js";
import { getThreatEngine } from "../../services/threatDetection/threatEngine.js";
import { queryDb } from "../../db/client.js";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

/**
 * Threat Detection Event Processing Worker
 * 
 * Consumes threat events from Redis streams and processes them asynchronously
 * Runs in background worker process
 */

class ThreatDetectionWorker {
  private worker: Worker | null = null;
  private isRunning = false;

  async initialize() {
    logger.info("Initializing Threat Detection Worker");

    this.worker = new Worker("threatEvents", this.processEvent.bind(this), {
      connection: redisConnection,
      concurrency: 10,
      maxStalledCount: 2,
      stalledInterval: 5000,
      lockDuration: 30000,
    });

    this.worker.on("completed", (job) => {
      logger.info(`✓ Threat event processed`, {
        jobId: job.id,
        eventType: job.data.eventType,
        duration: job.progress(),
      });
    });

    this.worker.on("failed", (job, err) => {
      logger.error(`✗ Threat event processing failed`, {
        jobId: job?.id,
        eventType: job?.data?.eventType,
        error: err.message,
      });
    });

    this.worker.on("error", (err) => {
      logger.error(`Worker error`, { error: err.message });
    });

    this.isRunning = true;
    logger.info("✓ Threat Detection Worker initialized");
  }

  /**
   * Process individual threat event
   * Runs detector pipeline and stores signals
   */
  private async processEvent(job: any) {
    const { eventId, eventData } = job.data;

    try {
      logger.debug("Processing threat event", {
        eventId,
        eventType: eventData.event_type,
      });

      // Get threat engine
      const threatEngine = getThreatEngine();

      // Process event through detectors
      const signals = await this.runDetectorPipeline(eventData);

      if (signals && signals.length > 0) {
        // Store signals in database
        await this.storeSignals(eventId, signals);

        // Check for auto-response triggers
        const criticalSignals = signals.filter(
          (s: any) => s.threat_score >= 80
        );
        if (criticalSignals.length > 0) {
          await this.executeAutoResponses(eventData, criticalSignals);
        }
      }

      return { eventId, signalsGenerated: signals?.length || 0 };
    } catch (error) {
      logger.error("Error processing threat event", {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Run all threat detectors on event
   */
  private async runDetectorPipeline(eventData: any): Promise<any[]> {
    const signals: any[] = [];

    // Get all enabled detectors
    const detectors = await queryDb(
      `SELECT * FROM threat_detectors WHERE enabled = true`
    );

    // Run detectors in parallel
    const detectorResults = await Promise.allSettled(
      detectors.map((detector: any) =>
        this.runDetector(detector, eventData)
      )
    );

    // Collect successful results
    for (const result of detectorResults) {
      if (result.status === "fulfilled" && result.value) {
        signals.push(result.value);
      }
    }

    return signals;
  }

  /**
   * Run individual detector
   */
  private async runDetector(detector: any, eventData: any): Promise<any | null> {
    try {
      // Determine threat score based on event and detector type
      let threatScore = 0;

      switch (detector.detector_name) {
        case "sql_injection":
          threatScore = this.detectSQLInjection(eventData);
          break;
        case "cross_org_access":
          threatScore = this.detectCrossOrgAccess(eventData);
          break;
        case "brute_force":
          threatScore = await this.detectBruteForce(eventData);
          break;
        case "impossible_travel":
          threatScore = await this.detectImpossibleTravel(eventData);
          break;
        case "data_exfiltration":
          threatScore = this.detectDataExfiltration(eventData);
          break;
        case "privilege_escalation":
          threatScore = this.detectPrivilegeEscalation(eventData);
          break;
        case "token_anomaly":
          threatScore = this.detectTokenAnomaly(eventData);
          break;
        case "rate_limit":
          threatScore = this.detectRateLimit(eventData);
          break;
      }

      // If score exceeds threshold, generate signal
      if (threatScore >= detector.risk_threshold) {
        return {
          detector_id: detector.id,
          detector_name: detector.detector_name,
          threat_score: threatScore,
          signal_type: detector.detector_name.toUpperCase(),
          severity: this.calculateSeverity(threatScore),
          detector_results: {
            score: threatScore,
            threshold: detector.risk_threshold,
            detectedAt: new Date().toISOString(),
          },
        };
      }

      return null;
    } catch (error) {
      logger.error("Detector execution error", {
        detectorName: detector.detector_name,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Detector implementations
   */
  private detectSQLInjection(eventData: any): number {
    if (eventData.event_type !== "database_query") return 0;

    const sqlKeywords = ["DROP", "DELETE", "INSERT", "UNION", "SELECT", "EXEC"];
    const query = (eventData.metadata?.query || "").toUpperCase();

    let score = 0;
    for (const keyword of sqlKeywords) {
      if (query.includes(keyword) && eventData.metadata?.from_user) {
        score += 20;
      }
    }

    return Math.min(score, 100);
  }

  private detectCrossOrgAccess(eventData: any): number {
    if (eventData.event_type !== "api_access") return 0;

    const userOrgId = eventData.metadata?.user_org_id;
    const resourceOrgId = eventData.metadata?.resource_org_id;

    if (userOrgId && resourceOrgId && userOrgId !== resourceOrgId) {
      return 100; // CRITICAL
    }

    return 0;
  }

  private async detectBruteForce(eventData: any): Promise<number> {
    if (eventData.event_type !== "login_failed") return 0;

    const email = eventData.metadata?.email;
    if (!email) return 0;

    // Count failures in last 15 minutes
    const rows = await queryDb(
      `SELECT COUNT(*) as count FROM login_failures
       WHERE identifier = $1 AND attempt_timestamp > NOW() - INTERVAL '15 minutes'`,
      [email]
    );

    const failureCount = rows[0]?.count || 0;

    // Score based on attempt count
    if (failureCount >= 10) return 100;
    if (failureCount >= 5) return 70;
    if (failureCount >= 3) return 40;

    return 0;
  }

  private async detectImpossibleTravel(eventData: any): Promise<number> {
    if (eventData.event_type !== "api_access") return 0;

    const userId = eventData.metadata?.user_id;
    if (!userId) return 0;

    // Get last login location
    const lastLogin = await queryDb(
      `SELECT source_ip, detected_at FROM threat_events
       WHERE user_id = $1 AND event_type = 'login_success'
       ORDER BY detected_at DESC LIMIT 1`,
      [userId]
    );

    if (!lastLogin || lastLogin.length === 0) return 0;

    // Simplified: check if time gap is too short for distance traveled
    const timeDiffMinutes =
      (new Date().getTime() - new Date(lastLogin[0].detected_at).getTime()) /
      60000;

    const distance = this.calculateDistance(
      lastLogin[0].source_ip,
      eventData.metadata?.source_ip
    );
    const speed = distance / timeDiffMinutes; // km/min

    // If speed > 15 km/min (900 km/h), likely impossible
    if (speed > 15 && timeDiffMinutes < 60) {
      return 85;
    }

    return 0;
  }

  private detectDataExfiltration(eventData: any): number {
    if (eventData.event_type !== "database_query") return 0;

    const rowsReturned = eventData.metadata?.rows_returned || 0;

    // If returning > 10,000 rows, suspicious
    if (rowsReturned > 10000) {
      return Math.min(50 + rowsReturned / 1000, 100);
    }

    return 0;
  }

  private detectPrivilegeEscalation(eventData: any): number {
    if (eventData.event_type !== "api_access") return 0;

    const userRole = eventData.metadata?.user_role;
    const attemptedEndpoint = eventData.metadata?.endpoint;

    // Check if non-admin accessing admin endpoints
    if (
      userRole !== "admin" &&
      attemptedEndpoint &&
      attemptedEndpoint.includes("/admin/")
    ) {
      return 80;
    }

    return 0;
  }

  private detectTokenAnomaly(eventData: any): number {
    // Check for unusual token usage patterns
    if (eventData.event_type !== "api_access") return 0;

    const tokenAge = eventData.metadata?.token_age_seconds || 0;
    const requestFrequency = eventData.metadata?.request_frequency || 0;

    let score = 0;

    // Token older than 24 hours
    if (tokenAge > 86400) score += 20;

    // Request frequency > 100 req/min
    if (requestFrequency > 100) score += 45;

    return score;
  }

  private detectRateLimit(eventData: any): number {
    if (eventData.event_type !== "api_access") return 0;

    const requestsPerMinute = eventData.metadata?.requests_per_minute || 0;

    if (requestsPerMinute > 100) {
      return Math.min(50 + requestsPerMinute / 2, 100);
    }

    return 0;
  }

  /**
   * Helper methods
   */
  private calculateSeverity(
    score: number
  ): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (score >= 90) return "CRITICAL";
    if (score >= 70) return "HIGH";
    if (score >= 50) return "MEDIUM";
    return "LOW";
  }

  private calculateDistance(ip1: string, ip2: string): number {
    // Simplified: in production, use GeoIP database
    if (ip1 === ip2) return 0;
    return Math.random() * 1000; // Random km for demo
  }

  /**
   * Store threat signals in database
   */
  private async storeSignals(eventId: string, signals: any[]) {
    for (const signal of signals) {
      await queryDb(
        `INSERT INTO threat_signals 
         (threat_event_id, signal_type, severity, threat_score, detector_results, auto_response_taken)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [
          eventId,
          signal.signal_type,
          signal.severity,
          signal.threat_score,
          JSON.stringify(signal.detector_results),
        ]
      );
    }
  }

  /**
   * Execute automatic responses for critical threats
   */
  private async executeAutoResponses(eventData: any, signals: any[]) {
    for (const signal of signals) {
      if (signal.threat_score >= 80) {
        // Log the response
        logger.warn("Auto-response triggered", {
          signalType: signal.signal_type,
          threatScore: signal.threat_score,
          userId: eventData.metadata?.user_id,
        });

        // Example: Revoke session
        if (signal.signal_type === "CROSS_ORG_ACCESS") {
          const userId = eventData.metadata?.user_id;
          if (userId) {
            await queryDb(
              `UPDATE login_sessions SET revoked_at = NOW() 
               WHERE user_id = $1 AND revoked_at IS NULL`,
              [userId]
            );
          }
        }
      }
    }
  }

  async shutdown() {
    if (this.worker) {
      await this.worker.close();
      this.isRunning = false;
      logger.info("Threat Detection Worker shut down");
    }
  }
}

// Main execution
const worker = new ThreatDetectionWorker();

async function main() {
  try {
    await worker.initialize();
    logger.info("Threat Detection Worker started");
  } catch (error) {
    logger.error("Failed to start worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await worker.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await worker.shutdown();
  process.exit(0);
});

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

export { ThreatDetectionWorker };
