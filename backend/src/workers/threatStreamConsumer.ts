import { Redis } from "ioredis";
import { logger } from "../shared/logger.js";
import { queryDb } from "../db/client.js";

/**
 * Threat Stream Consumer
 * 
 * Consumes threat events from Redis Streams in real-time
 * Processes events as they arrive with minimal latency
 * Supports consumer groups for distributed processing
 */

class ThreatStreamConsumer {
  private redis: Redis | null = null;
  private isRunning = false;
  private consumerGroup = "threat-detection-group";
  private consumerName = `consumer-${process.pid}-${Date.now()}`;
  private streamKey = "threat:events";
  private batchSize = 100;
  private blockTimeout = 1000; // ms

  async initialize() {
    logger.info("Initializing Threat Stream Consumer");

    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

    // Create consumer group if it doesn't exist
    try {
      await this.redis.xgroup(
        "CREATE",
        this.streamKey,
        this.consumerGroup,
        "0",
        "MKSTREAM"
      );
      logger.info("Consumer group created", { group: this.consumerGroup });
    } catch (error: any) {
      if (!error.message.includes("BUSYGROUP")) {
        throw error;
      }
      logger.debug("Consumer group already exists");
    }

    this.isRunning = true;
    logger.info("✓ Threat Stream Consumer initialized");

    // Start consuming
    this.startConsuming();
  }

  /**
   * Start consuming events from stream
   * Runs indefinitely until shutdown
   */
  private async startConsuming() {
    if (!this.redis) return;

    logger.info("Starting event consumer loop", {
      consumerName: this.consumerName,
      group: this.consumerGroup,
    });

    while (this.isRunning) {
      try {
        // Read pending messages first
        const pending = await this.redis.xreadgroup(
          "GROUP",
          this.consumerGroup,
          this.consumerName,
          "COUNT",
          String(this.batchSize),
          "STREAMS",
          this.streamKey,
          "0"
        );

        if (pending && pending.length > 0) {
          await this.processBatch(pending[0][1]);
        }

        // Read new messages
        const messages = await this.redis.xreadgroup(
          "GROUP",
          this.consumerGroup,
          this.consumerName,
          "COUNT",
          String(this.batchSize),
          "BLOCK",
          String(this.blockTimeout),
          "STREAMS",
          this.streamKey,
          ">"
        );

        if (messages && messages.length > 0) {
          await this.processBatch(messages[0][1]);
        }
      } catch (error) {
        logger.error("Error in consumer loop", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process batch of events
   */
  private async processBatch(events: any[]) {
    const eventIds: string[] = [];

    for (const [eventId, eventData] of events) {
      try {
        // Parse event data
        const data = Object.fromEntries(eventData);

        logger.debug("Processing stream event", {
          eventId,
          eventType: data.event_type,
        });

        // Insert into database for persistence
        await queryDb(
          `INSERT INTO threat_events 
           (organization_id, user_id, event_type, source, severity, threat_score, metadata, detected_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT DO NOTHING`,
          [
            data.organization_id,
            data.user_id || null,
            data.event_type,
            data.source || "stream",
            data.severity || "MEDIUM",
            parseInt(data.threat_score) || 0,
            JSON.stringify(data.metadata || {}),
          ]
        );

        eventIds.push(eventId);
      } catch (error) {
        logger.error("Error processing event", {
          eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Acknowledge processed messages
    if (eventIds.length > 0 && this.redis) {
      try {
        await this.redis.xack(this.streamKey, this.consumerGroup, ...eventIds);
      } catch (error) {
        logger.error("Error acknowledging messages", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Cleanup old messages from stream
   * Runs periodically to prevent stream from growing unbounded
   */
  async cleanupOldMessages() {
    if (!this.redis) return;

    try {
      // Keep only last 24 hours of messages (86400 seconds)
      const maxLen = 10000; // Max length of stream
      await this.redis.xtrim(this.streamKey, "MAXLEN", "~", String(maxLen));
      logger.debug("Stream trimmed", { streamKey: this.streamKey });
    } catch (error) {
      logger.error("Error cleaning up stream", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get consumer group stats
   */
  async getStats() {
    if (!this.redis) return null;

    try {
      // Get stream info
      const info = await this.redis.xinfo("STREAM", this.streamKey);
      const groupInfo = await this.redis.xinfo("GROUPS", this.streamKey);

      return {
        stream: {
          length: info[1],
          firstEntry: info[3],
          lastEntry: info[5],
        },
        group: groupInfo[0],
        consumerName: this.consumerName,
        isRunning: this.isRunning,
      };
    } catch (error) {
      logger.error("Error getting stats", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Subscribe to specific threat types (for real-time dashboard)
   */
  async subscribeToPubSub(threatType: string, callback: (data: any) => void) {
    if (!this.redis) return;

    const channel = `threat:${threatType}`;
    this.redis.subscribe(channel, (err: Error | null, count: number | null) => {
      if (err) {
        logger.error("Error subscribing to channel", {
          channel,
          error: err.message,
        });
      } else {
        logger.debug("Subscribed to channel", { channel, count });
      }
    });

    this.redis.on("message", (channel: string, message: string) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        logger.error("Error parsing message", {
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Publish threat event (for real-time dashboard)
   */
  async publishThreatEvent(threatType: string, data: any) {
    if (!this.redis) return;

    try {
      const channel = `threat:${threatType}`;
      await this.redis.publish(channel, JSON.stringify(data));
    } catch (error) {
      logger.error("Error publishing event", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async shutdown() {
    this.isRunning = false;
    if (this.redis) {
      await this.redis.quit();
    }
    logger.info("Threat Stream Consumer shut down");
  }
}

export default ThreatStreamConsumer;
