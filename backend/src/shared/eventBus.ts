import { EventEmitter } from "node:events";
import { logger } from "../shared/logger.js";

export interface KoraEvent {
  type: string;
  organizationId: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
  correlationId?: string;
}

export interface EventHandler {
  (event: KoraEvent): Promise<void> | void;
}

class KoraEventBus extends EventEmitter {
  private handlers = new Map<string, EventHandler[]>();

  constructor() {
    super();
    this.setMaxListeners(100); // Increase for high-throughput scenarios
  }

  /**
   * Register event handler
   */
  onEvent(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    this.on(eventType, handler);
    
    logger.debug("Event handler registered", { eventType });
  }

  /**
   * Emit event with error handling
   */
  async emitEvent(event: KoraEvent): Promise<void> {
    try {
      logger.info("Event emitted", { 
        type: event.type, 
        organizationId: event.organizationId,
        correlationId: event.correlationId 
      });

      // Emit synchronously first
      this.emit(event.type, event);

      // Handle async handlers
      const handlers = this.handlers.get(event.type) || [];
      const promises = handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          logger.error("Event handler failed", {
            eventType: event.type,
            organizationId: event.organizationId,
            error: error instanceof Error ? error.message : "unknown",
            correlationId: event.correlationId
          });
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error("Event emission failed", {
        eventType: event.type,
        error: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  /**
   * Remove event handler
   */
  offEvent(eventType: string, handler: EventHandler): void {
    this.off(eventType, handler);
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get event statistics
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [eventType, handlers] of this.handlers.entries()) {
      stats[eventType] = handlers.length;
    }
    return stats;
  }
}

// Global event bus instance
export const eventBus = new KoraEventBus();

// Common event types
export const EventTypes = {
  // Client events
  CLIENT_CREATED: "client.created",
  CLIENT_UPDATED: "client.updated",
  CLIENT_DELETED: "client.deleted",

  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_UPDATED: "booking.updated",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_COMPLETED: "booking.completed",

  // Service events
  SERVICE_CREATED: "service.created",
  SERVICE_UPDATED: "service.updated",
  SERVICE_DELETED: "service.deleted",

  // Staff events
  STAFF_CREATED: "staff.created",
  STAFF_UPDATED: "staff.updated",
  STAFF_DELETED: "staff.deleted",

  // Payment events
  PAYMENT_PROCESSED: "payment.processed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Notification events
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_FAILED: "notification.failed",

  // AI events
  AI_ORCHESTRATION_TRIGGERED: "ai.orchestration.triggered",
  AI_ORCHESTRATION_COMPLETED: "ai.orchestration.completed",

  // System events
  SYSTEM_ERROR: "system.error",
  SYSTEM_HEALTH_CHECK: "system.health_check"
} as const;

/**
 * Helper to create standardized events
 */
export function createEvent(
  type: string,
  organizationId: string,
  data: Record<string, any>,
  userId?: string,
  correlationId?: string
): KoraEvent {
  return {
    type,
    organizationId,
    userId,
    data,
    timestamp: new Date(),
    correlationId: correlationId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Middleware to emit events from HTTP requests
 */
export function eventEmitterMiddleware(eventType: string, dataExtractor?: (req: any, res: any) => Record<string, any>) {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Only emit on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const organizationId = res.locals?.auth?.organizationId;
        const userId = res.locals?.auth?.userId;
        
        if (organizationId) {
          const eventData = dataExtractor ? dataExtractor(req, res) : { requestData: req.body, responseData: data };
          const event = createEvent(eventType, organizationId, eventData, userId);
          
          // Emit asynchronously to not block response
          setImmediate(() => {
            eventBus.emitEvent(event).catch((err) => {
              logger.error("Failed to emit event from middleware", { 
                eventType, 
                error: err.message 
              });
            });
          });
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
}