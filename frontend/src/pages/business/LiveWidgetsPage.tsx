import { LiveRevenueWidget } from "../../components/widgets/LiveRevenueWidget";
import { LiveBookingWidget } from "../../components/widgets/LiveBookingWidget";
import { LiveStaffWidget } from "../../components/widgets/LiveStaffWidget";
import { LiveActivityWidget } from "../../components/widgets/LiveActivityWidget";
import { LiveSystemWidget } from "../../components/widgets/LiveSystemWidget";

export function LiveWidgetsPage() {
  return (
    <div style={{ padding: "clamp(12px, 4vw, 24px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "clamp(20px, 6vw, 32px)" }}>
        <div
          style={{
            fontSize: "clamp(10px, 2vw, 12px)",
            letterSpacing: "0.12em",
            color: "var(--color-accent)",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 10,
            fontWeight: 700
          }}
        >
          DASHBOARD
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(20px, 6vw, 28px)",
            color: "var(--color-text-primary)",
            fontFamily: "'Space Grotesk', sans-serif"
          }}
        >
          Live Dashboard
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(12px, 3vw, 14px)",
            color: "var(--color-text-muted)"
          }}
        >
          Real-time metrics and activity feeds. Data updates every 2-5 seconds.
        </p>
      </div>

      {/* Analytics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "clamp(12px, 4vw, 20px)",
          marginBottom: "clamp(12px, 4vw, 20px)"
        }}
      >
        <div style={{ gridColumn: "span 1" }}>
          <LiveRevenueWidget />
        </div>
        <div style={{ gridColumn: "span 1" }}>
          <LiveBookingWidget />
        </div>
        <div style={{ gridColumn: "span 1" }}>
          <LiveSystemWidget />
        </div>
      </div>

      {/* Activity Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "clamp(12px, 4vw, 20px)"
        }}
      >
        <div style={{ gridColumn: "span 1" }}>
          <LiveStaffWidget />
        </div>
        <div style={{ gridColumn: "span 1" }}>
          <LiveActivityWidget />
        </div>
      </div>

      {/* Footer Note */}
      <div
        style={{
          marginTop: "clamp(20px, 6vw, 32px)",
          padding: "clamp(12px, 3vw, 16px)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          fontSize: "clamp(11px, 2vw, 12px)",
          color: "var(--color-text-muted)"
        }}
      >
        <strong>Live Data Notice:</strong> This dashboard displays simulated real-time data. In production, this
        would connect to your backend metrics API for actual business metrics including revenue, bookings,
        staff availability, customer activity, and system performance.
      </div>
    </div>
  );
}
