/**
 * KORA CANONICAL STATE MACHINES
 * ─────────────────────────────
 * Locked contract. No implicit transitions allowed.
 * Any transition not listed here is FORBIDDEN.
 *
 * Owner: Backend Team
 * Enforced by: QA Team
 */

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show";
export type StaffStatus = "active" | "inactive" | "on_leave" | "suspended";
export type EmergencyStatus = "open" | "dispatched" | "en_route" | "on_scene" | "resolved" | "cancelled";
export type DeliveryStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";

// ─── Booking State Machine ────────────────────────────────────────────────────
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending:     ["confirmed", "cancelled"],
  confirmed:   ["checked_in", "cancelled"],
  checked_in:  ["in_progress", "no_show", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed:   [],
  cancelled:   [],
  no_show:     [],
};

// ─── Emergency State Machine ──────────────────────────────────────────────────
export const EMERGENCY_TRANSITIONS: Record<EmergencyStatus, EmergencyStatus[]> = {
  open:       ["dispatched", "cancelled"],
  dispatched: ["en_route",   "cancelled"],
  en_route:   ["on_scene",   "cancelled"],
  on_scene:   ["resolved",   "cancelled"],
  resolved:   [],
  cancelled:  [],
};

// ─── Delivery State Machine ───────────────────────────────────────────────────
export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending:    ["assigned",   "cancelled"],
  assigned:   ["picked_up",  "cancelled"],
  picked_up:  ["in_transit"],
  in_transit: ["delivered",  "failed"],
  delivered:  [],
  failed:     [],
  cancelled:  [],
};

// ─── Subscription State Machine ───────────────────────────────────────────────
export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  trialing:  ["active",    "cancelled"],
  active:    ["past_due",  "cancelled"],
  past_due:  ["active",    "cancelled", "expired"],
  cancelled: [],
  expired:   [],
};

// ─── Validator ────────────────────────────────────────────────────────────────
export function isValidTransition<T extends string>(
  transitions: Record<T, T[]>,
  from: T,
  to: T
): boolean {
  return (transitions[from] ?? []).includes(to);
}

export function assertValidTransition<T extends string>(
  transitions: Record<T, T[]>,
  from: T,
  to: T,
  entity: string
): void {
  if (!isValidTransition(transitions, from, to)) {
    const allowed = transitions[from] ?? [];
    throw new Error(
      `[STATE_MACHINE] Invalid ${entity} transition: ${from} → ${to}. Allowed: [${allowed.join(", ")}]`
    );
  }
}
