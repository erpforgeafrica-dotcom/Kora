import { useState, useEffect, useCallback } from "react";
import { ActionButton, AudienceSection, StatusPill, EmptyState } from "../../components/audience/AudiencePrimitives";
import { listDeliveryBookings, createDeliveryBooking, updateDeliveryStatus, type DeliveryBooking } from "../../services/api";
import { useAuthContext } from "../../contexts/AuthContext";

function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280", assigned: "#3b82f6", picked_up: "#f59e0b",
  in_transit: "#8b5cf6", delivered: "#22c55e", failed: "#ef4444", cancelled: "#ef4444",
};

const STATUS_FLOW: Record<string, string[]> = {
  pending:    ["assigned", "cancelled"],
  assigned:   ["picked_up", "cancelled"],
  picked_up:  ["in_transit"],
  in_transit: ["delivered", "failed"],
  delivered:  [],
  failed:     [],
  cancelled:  [],
};



// ─── New booking form ────────────────────────────────────────────────────────
function NewBookingForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    pickup_address: "", dropoff_address: "", recipient_name: "",
    recipient_phone: "", notes: "", package_description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!form.pickup_address || !form.dropoff_address) return;
    setSubmitting(true);
    try { await createDeliveryBooking(form as any); onCreated(); }
    finally { setSubmitting(false); }
  }

  return (
    <AudienceSection title="New delivery booking" meta="Fill required fields">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Pickup address *", key: "pickup_address", placeholder: "Full pickup address" },
          { label: "Dropoff address *", key: "dropoff_address", placeholder: "Full delivery address" },
          { label: "Recipient name", key: "recipient_name", placeholder: "Name" },
          { label: "Recipient phone", key: "recipient_phone", placeholder: "+44…" },
          { label: "Package description", key: "package_description", placeholder: "What is being delivered?" },
          { label: "Notes", key: "notes", placeholder: "Special instructions" },
        ].map(f => (
          <div key={f.key}>
            <div style={labelStyle}>{f.label}</div>
            <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} style={inputStyle} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <ActionButton tone="accent" onClick={submit} disabled={submitting || !form.pickup_address || !form.dropoff_address}>
          {submitting ? "Creating…" : "Create Booking"}
        </ActionButton>
      </div>
    </AudienceSection>
  );
}

// ─── Booking detail panel ────────────────────────────────────────────────────
function BookingDetail({ booking, onUpdate }: { booking: DeliveryBooking; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const nextStatuses = STATUS_FLOW[booking.status] ?? [];

  async function advance(status: string) {
    setUpdating(true);
    try { await updateDeliveryStatus(booking.id, { status }); onUpdate(); }
    finally { setUpdating(false); }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AudienceSection title="Booking details" meta={`ID: ${booking.id.slice(0, 8)}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Status",    value: booking.status },
            { label: "Rider",     value: booking.rider_name ?? "Unassigned" },
            { label: "Pickup",    value: booking.pickup_address },
            { label: "Dropoff",   value: booking.dropoff_address },
            { label: "Recipient", value: booking.recipient_name ?? "—" },
            { label: "Phone",     value: booking.recipient_phone ?? "—" },
            { label: "ETA",       value: booking.estimated_delivery ? new Date(booking.estimated_delivery).toLocaleString() : "—" },
            { label: "Created",   value: booking.created_at ? new Date(booking.created_at).toLocaleString() : "—" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{f.value}</div>
            </div>
          ))}
        </div>
        {booking.notes && (
          <div style={{ marginTop: 12, padding: 10, background: "var(--color-surface-2)", borderRadius: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
            {booking.notes}
          </div>
        )}
      </AudienceSection>

      {nextStatuses.length > 0 && (
        <AudienceSection title="Workflow actions" meta="Advance delivery status">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {nextStatuses.map(s => (
              <ActionButton key={s} tone={s === "delivered" ? "accent" : s === "cancelled" || s === "failed" ? "ghost" : "ghost"}
                onClick={() => advance(s)} disabled={updating}>
                → {s.replace(/_/g, " ")}
              </ActionButton>
            ))}
          </div>
        </AudienceSection>
      )}

      {booking.status === "delivered" && (
        <AudienceSection title="Proof of delivery" meta="Completion record">
          {booking.proof_of_delivery
            ? <img src={booking.proof_of_delivery} alt="Proof of delivery" style={{ maxWidth: "100%", borderRadius: 8 }} />
            : <div style={{ padding: 16, color: "var(--color-text-muted)", fontSize: 13 }}>No proof of delivery uploaded.</div>
          }
          {booking.rating && (
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-primary)" }}>
              Rating: {"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}
            </div>
          )}
        </AudienceSection>
      )}
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
const DISPATCHER_ROLES = ["business_admin", "platform_admin", "operations", "dispatcher"];

export function DeliveryModule() {
  const { userRole } = useAuthContext();
  const isDispatcher = DISPATCHER_ROLES.includes(userRole ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<DeliveryBooking | null>(null);
  const [showNew, setShowNew] = useState(false);

  const bookings = useApi(() => listDeliveryBookings(), [statusFilter]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: 16, background: "color-mix(in srgb,#8b5cf6 8%,transparent)", border: "1px solid color-mix(in srgb,#8b5cf6 20%,transparent)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#8b5cf6", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
            🚚 Delivery & Mobility
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
            Delivery Operations
          </div>
        </div>
        {isDispatcher && (
          <ActionButton tone="accent" onClick={() => setShowNew(v => !v)}>
            {showNew ? "Cancel" : "+ New Booking"}
          </ActionButton>
        )}
      </div>

      {showNew && <NewBookingForm onCreated={() => { setShowNew(false); bookings.reload(); }} />}

      {/* Status filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["", "pending", "assigned", "picked_up", "in_transit", "delivered", "failed"] as const).map(f => (
          <button key={f || "all"} onClick={() => setStatusFilter(f)} style={{
            padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: statusFilter === f ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
            background: statusFilter === f ? "var(--color-accent-dim)" : "transparent",
            color: statusFilter === f ? "var(--color-accent)" : "var(--color-text-muted)",
          }}>
            {f || "All"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 16 }}>
        {/* Booking list */}
        <AudienceSection title={`Bookings (${Array.isArray(bookings.data) ? (bookings.data as any[]).length : (bookings.data as any)?.count ?? 0})`} meta="Select to manage">
          {bookings.loading && <div style={{ padding: 16, color: "var(--color-text-muted)" }}>Loading…</div>}
          {bookings.error && <div style={{ padding: 16, color: "var(--color-danger)" }}>{bookings.error}</div>}
          <div style={{ display: "grid", gap: 8, maxHeight: 560, overflowY: "auto" }}>
            {(Array.isArray(bookings.data) ? bookings.data as DeliveryBooking[] : (bookings.data as any)?.bookings ?? []).filter((b: DeliveryBooking) => !statusFilter || b.status === statusFilter).map((b: DeliveryBooking) => (
              <button key={b.id} onClick={() => setSelected(selected?.id === b.id ? null : b)} style={{
                padding: 12, borderRadius: 10, textAlign: "left", cursor: "pointer",
                border: selected?.id === b.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: selected?.id === b.id ? "var(--color-accent-dim)" : "var(--color-surface-2)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {b.dropoff_address}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                      From: {b.pickup_address}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 4 }}>
                      {b.created_at ? new Date(b.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                  <StatusPill label={b.status} tone={
                    b.status === "delivered" ? "success" :
                    b.status === "in_transit" || b.status === "picked_up" ? "warning" :
                    b.status === "failed" || b.status === "cancelled" ? "danger" : "muted"
                  } />
                </div>
                {b.rider_name && (
                  <div style={{ marginTop: 6, fontSize: 11, color: STATUS_COLORS[b.status] ?? "var(--color-text-muted)" }}>
                    🏍 {b.rider_name}
                  </div>
                )}
              </button>
            ))}
            {!bookings.loading && (Array.isArray(bookings.data) ? (bookings.data as any[]).length === 0 : (bookings.data as any)?.count === 0) && (
              <EmptyState title="No deliveries" detail={`No ${statusFilter || ""} delivery bookings found.`} />
            )}
          </div>
        </AudienceSection>

        {/* Detail */}
        <div>
          {selected
            ? <BookingDetail booking={selected} onUpdate={() => { bookings.reload(); setSelected(null); }} />
            : (
              <AudienceSection title="No booking selected" meta="Select from the list">
                <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
                  Select a delivery booking to view details, track status, and take workflow actions.
                </div>
              </AudienceSection>
            )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 } as const;
const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6,
  border: "1px solid var(--color-border)", background: "var(--color-surface-1)",
  color: "var(--color-text-primary)", fontSize: 13,
} as const;
