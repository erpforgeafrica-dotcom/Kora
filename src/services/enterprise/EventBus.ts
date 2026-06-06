/**
 * Central Event-Driven Subscriber Bus
 * 
 * Permits low-coupling operation flows across vertical frameworks.
 */

export type KoraEventType =
  | 'appointment.created'
  | 'appointment.completed'
  | 'invoice.paid'
  | 'inventory.low_stock'
  | 'staff.clock_in'
  | 'telemedicine.session_ended';

export interface KoraEventPayload {
  merchantId: string;
  timestamp: string;
  actorId?: string;
  data: Record<string, any>;
}

export type EventCallback = (payload: KoraEventPayload) => void | Promise<void>;

export class EventBus {
  private static subscribers: Map<KoraEventType, EventCallback[]> = new Map();

  /**
   * Registers a subscriber callback for an event
   */
  public static subscribe(event: KoraEventType, callback: EventCallback): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);
  }

  /**
   * Dispatches events asynchronously to safeguard transaction thread latency
   */
  public static async publish(event: KoraEventType, payload: KoraEventPayload): Promise<void> {
    const list = this.subscribers.get(event);
    if (!list || list.length === 0) return;

    // Fire off callbacks gracefully
    const promises = list.map(callback => {
      try {
        return Promise.resolve(callback(payload));
      } catch (err) {
        console.error(`[EVENT BUS EXCEPTION] Event ${event} callback failed:`, err);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }
}
