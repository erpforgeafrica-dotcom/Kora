import { useEffect, useMemo, useState } from "react";
import { ActionButton, AudienceMetric, AudienceSection, EmptyState, StatusPill, formatMoney } from "../../components/audience/AudiencePrimitives";

// Types
interface TimeSlot {
  start: string;
  end: string;
  booked: boolean;
}

interface BookingEvent {
  id: string;
  client_name: string;
  service: string;
  staff: string;
  start_time: string;
  duration_minutes: number;
  status: "confirmed" | "checked_in" | "in_progress" | "completed" | "no_show";
  price: number;
  room?: string;
}

// Mock data
const MOCK_BOOKINGS: BookingEvent[] = [
  {
    id: "bk-1",
    client_name: "Sarah Chen",
    service: "Balayage Refresh",
    staff: "Ada Nwosu",
    start_time: "2026-03-08T10:00:00Z",
    duration_minutes: 120,
    status: "confirmed",
    price: 22000,
    room: "Studio A"
  },
  {
    id: "bk-2",
    client_name: "Marcus Johnson",
    service: "Deep Tissue Reset",
    staff: "Mira Cole",
    start_time: "2026-03-08T11:30:00Z",
    duration_minutes: 60,
    status: "checked_in",
    price: 13500,
    room: "Recovery 1"
  },
  {
    id: "bk-3",
    client_name: "Zainab Williams",
    service: "Personal Training Session",
    staff: "Jake Mitchell",
    start_time: "2026-03-08T14:00:00Z",
    duration_minutes: 60,
    status: "confirmed",
    price: 10000,
    room: "Studio B"
  },
  {
    id: "bk-4",
    client_name: "Emma Rodriguez",
    service: "Hydra Facial",
    staff: "Dr. Amelia Park",
    start_time: "2026-03-08T15:30:00Z",
    duration_minutes: 60,
    status: "in_progress",
    price: 18000,
    room: "MedSpa"
  }
];

const MOCK_KPI = {
  today_bookings: 34,
  revenue_today: 482000,
  no_show_count: 2,
  capacity_utilisation: 85,
  pending_checkins: 8
};

// Submodules
function BookingsList({ bookings, filter }: { bookings: BookingEvent[], filter: string }) {
  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "var(--color-accent)";
      case "checked_in":
        return "var(--color-warning)";
      case "in_progress":
        return "var(--color-info)";
      case "completed":
        return "var(--color-success)";
      case "no_show":
        return "var(--color-danger)";
      default:
        return "var(--color-text-muted)";
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {filtered.length > 0 ? filtered.map((booking) => (
        <div
          key={booking.id}
          style={{
            padding: "14px 16px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {booking.client_name}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
              {booking.service} · {booking.duration_minutes}min · {booking.staff}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
              {new Date(booking.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} {booking.room && `· ${booking.room}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {formatMoney(booking.price)}
              </div>
              <StatusPill label={booking.status.replace("_", " ")} tone="muted" />
            </div>
          </div>
        </div>
      )) : (
        <EmptyState title="No bookings" detail={`No ${filter} bookings to show.`} />
      )}
    </div>
  );
}

function CapacityGrid() {
  const hours = Array.from({ length: 16 }, (_, i) => `${8 + i}:00`);
  const staff_members = ["Mira Cole", "Tari Bello", "Ada Nwosu", "Jake Mitchell"];

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${hours.length}, 1fr)`, gap: 1, minWidth: "100%" }}>
        <div style={{ padding: "8px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>Staff</div>
        {hours.map((h) => (
          <div key={h} style={{ padding: "8px 4px", fontSize: 10, textAlign: "center", color: "var(--color-text-muted)" }}>
            {h}
          </div>
        ))}

        {staff_members.map((staff) => (
          <div key={staff} style={{ gridColumn: "1", padding: "12px 8px", fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {staff.split(" ")[0]}
          </div>
        ))}

        {staff_members.map((staff) =>
          hours.map((h) => (
            <div
              key={`${staff}-${h}`}
              style={{
                padding: "12px 4px",
                background: Math.random() > 0.6 ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                borderRadius: 4,
                fontSize: 9,
                textAlign: "center",
                cursor: "pointer",
                border: "1px solid var(--color-border)"
              }}
            >
              {Math.random() > 0.6 ? "○" : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NoShowAnalysis({ bookings }: { bookings: BookingEvent[] }) {
  const no_shows = bookings.filter((b) => b.status === "no_show");
  const no_show_rate = (no_shows.length / bookings.length) * 100;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AudienceMetric label="No-shows Today" value={String(no_shows.length)} tone="var(--color-danger)" />
        <AudienceMetric label="No-show Rate" value={`${no_show_rate.toFixed(1)}%`} tone="var(--color-warning)" />
      </div>
      {no_shows.length > 0 && (
        <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-danger)", marginBottom: 8 }}>
            At risk: {no_shows.map((b) => b.client_name).join(", ")}
          </div>
          <ActionButton tone="warning">Send recovery SMS</ActionButton>
        </div>
      )}
    </div>
  );
}

// Main component
export function BookingsCommandCenter() {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [filter, setFilter] = useState<"all" | "confirmed" | "checked_in" | "in_progress" | "completed" | "no_show">("all");
  const [tab, setTab] = useState<"timeline" | "capacity" | "analysis">("timeline");

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Operations
          </div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Bookings Command</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <AudienceMetric label="Today's Bookings" value={String(MOCK_KPI.today_bookings)} tone="var(--color-accent)" />
        <AudienceMetric label="Revenue" value={formatMoney(MOCK_KPI.revenue_today)} tone="var(--color-success)" />
        <AudienceMetric label="Capacity" value={`${MOCK_KPI.capacity_utilisation}%`} tone="var(--color-warning)" />
        <AudienceMetric label="Pending Check-ins" value={String(MOCK_KPI.pending_checkins)} tone="var(--color-info)" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
        {(["timeline", "capacity", "analysis"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "transparent",
              color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              borderBottom: tab === t ? "2px solid var(--color-accent)" : "none",
              marginBottom: -13
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "timeline" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0, 0.4fr)", gap: 16 }}>
          <AudienceSection title="Bookings Timeline">
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {(["all", "confirmed", "checked_in", "in_progress", "completed", "no_show"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: filter === f ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    background: filter === f ? "var(--color-accent-dim)" : "transparent",
                    color: filter === f ? "var(--color-accent)" : "var(--color-text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
            <BookingsList bookings={bookings} filter={filter} />
          </AudienceSection>

          <AudienceSection title="Quick Actions">
            <div style={{ display: "grid", gap: 10 }}>
              <ActionButton tone="accent">New Booking</ActionButton>
              <ActionButton tone="warning">Check-in Client</ActionButton>
              <ActionButton>Mark Complete</ActionButton>
              <ActionButton>Reschedule</ActionButton>
              <ActionButton tone="ghost">Email Confirmations</ActionButton>
            </div>
          </AudienceSection>
        </div>
      )}

      {tab === "capacity" && (
        <AudienceSection title="Capacity Heatmap (8AM–11PM)">
          <CapacityGrid />
        </AudienceSection>
      )}

      {tab === "analysis" && (
        <AudienceSection title="No-Show Analysis & Risk">
          <NoShowAnalysis bookings={bookings} />
        </AudienceSection>
      )}
    </div>
  );
}
