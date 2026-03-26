import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AudienceMetric, AudienceSection, EmptyState, StatusPill, ActionButton } from "../../components/audience/AudiencePrimitives";
import { getBusinessSummary } from "../../services/api";
import type { BusinessSummary } from "../../types/audience";

const MOCK_SUMMARY: BusinessSummary = {
  revenue: { today: 126000, this_week: 752000, this_month: 2860000, vs_last_month_pct: 8.1 },
  bookings: { today_total: 28, no_show_rate_pct: 5.4, cancellation_rate_pct: 2.8, avg_booking_value: 10400 },
  staff: { utilisation_rate_pct: 77.5, top_performer_id: "ops-staff-1", understaffed_slots: 3 },
  staff_profiles: { utilisation_rate_pct: 77.5, top_performer_id: "ops-staff-1", understaffed_slots: 3 },
  clients: { active_count: 312, at_churn_risk: 7, new_this_month: 22, avg_lifetime_value: 40200 },
  customers: { active_count: 312, at_churn_risk: 7, new_this_month: 22, avg_lifetime_value: 40200 },
  ai_alerts: [
    {
      id: "ops-alert-1",
      title: "Dispatch congestion building on evening routes",
      severity: "high",
      sourceModule: "ai",
      context: "Route allocation is creating SLA risk for late-day bookings.",
      rank: 1,
      score: 89,
      reasoning: ["Assignment queue is slowing", "Driver coverage below target"],
      followUpChain: ["dispatch:Reassign load", "support:Warn affected bookings"],
      confidence: 0.79
    }
  ]
};

export function OperationsCommandCenterPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBusinessSummary()
      .then((data) => {
        setSummary(data);
        setError(null);
      })
      .catch((e) => {
        setSummary(MOCK_SUMMARY);
        setError(e?.message ?? "Operations overview is currently using preview data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const aiAlerts = summary?.ai_alerts ?? [];
  const bookings = summary?.bookings;
  const staff = summary?.staff;
  const clients = summary?.clients ?? summary?.customers;

  const tasks = useMemo(() => {
    if (!summary) return [];
    return [
      `${summary.bookings.today_total} active bookings in the daily queue`,
      `${summary.staff.understaffed_slots} understaffed slots need reassignment`,
      `${summary.ai_alerts.length} operational alerts require intervention`
    ];
  }, [summary]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        style={{
          borderRadius: 28,
          border: "1px solid color-mix(in srgb, var(--color-border) 70%, var(--color-accent) 30%)",
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 98%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
          padding: 24,
          boxShadow: "var(--shadow-shell)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 760 }}>
            <div style={eyebrowStyle}>Tenant Operations</div>
            <h1 style={{ margin: "14px 0 0", fontSize: 34, lineHeight: 1.08, color: "var(--color-text-primary)" }}>
              Operations command center
            </h1>
            <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
              Live operational orientation for dispatch, queue load, staffing pressure, and intervention planning. This
              is designed as an execution surface rather than a decorative dashboard.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionButton tone="ghost" onClick={() => navigate("/app/operations/delivery/bookings")}>Delivery bookings</ActionButton>
            <ActionButton tone="ghost" onClick={() => navigate("/app/operations/support")}>Support queue</ActionButton>
            <ActionButton onClick={() => navigate("/app/operations/dispatch-dashboard")}>Dispatch board</ActionButton>
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 16,
              background: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-warning) 28%, transparent)",
              color: "var(--color-warning)"
            }}
          >
            {error}
          </div>
        ) : null}

        {loading && !summary ? (
          <div style={{ marginTop: 18, color: "var(--color-text-muted)" }}>Loading operations data…</div>
        ) : null}

        {!loading && summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginTop: 20 }}>
            <AudienceMetric label="Bookings Today" value={String(bookings?.today_total ?? 0)} tone="var(--color-accent)" />
            <AudienceMetric label="No-Show Rate" value={`${bookings?.no_show_rate_pct ?? 0}%`} tone="var(--color-warning)" />
            <AudienceMetric label="Staff Utilisation" value={`${staff?.utilisation_rate_pct ?? 0}%`} tone="var(--color-success)" />
            <AudienceMetric label="Clients At Risk" value={String(clients?.at_churn_risk ?? 0)} tone="var(--color-danger)" />
            <AudienceMetric label="Open Alerts" value={String(aiAlerts.length)} tone="var(--color-text-primary)" />
          </div>
        ) : null}
      </section>

      {!loading && summary ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.85fr)", gap: 18 }}>
            <AudienceSection title="Operational summary" meta="Current shift">
              <div style={{ display: "grid", gap: 12 }}>
                <SummaryCard
                  title="Booking flow"
                  rows={[
                    `Cancellation rate: ${bookings?.cancellation_rate_pct ?? 0}%`,
                    `Average booking value: £${Math.round((bookings?.avg_booking_value ?? 0) / 100)}`
                  ]}
                />
                <SummaryCard
                  title="Staffing"
                  rows={[
                    `Understaffed slots: ${staff?.understaffed_slots ?? 0}`,
                    `Top performer: ${staff?.top_performer_id ? `#${staff.top_performer_id.slice(0, 8)}` : "—"}`
                  ]}
                />
                <SummaryCard
                  title="Customer signal"
                  rows={[
                    `Active customers: ${clients?.active_count ?? 0}`,
                    `New this month: ${clients?.new_this_month ?? 0}`
                  ]}
                />
              </div>
            </AudienceSection>

            <AudienceSection title="Pending tasks" meta="Execution next">
              <div style={{ display: "grid", gap: 10 }}>
                {tasks.map((task) => (
                  <TaskPill key={task} text={task} />
                ))}
              </div>
            </AudienceSection>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 18 }}>
            <AudienceSection title="Active alerts" meta={`${aiAlerts.length} open`}>
              <div style={{ display: "grid", gap: 10 }}>
                {aiAlerts.length > 0 ? (
                  aiAlerts.map((alert) => (
                    <div key={alert.id} style={noticeCardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{alert.title}</div>
                        <StatusPill
                          label={alert.severity}
                          tone={alert.severity === "critical" ? "danger" : alert.severity === "high" ? "warning" : "accent"}
                        />
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7, color: "var(--color-text-muted)" }}>{alert.context}</div>
                      <div style={{ marginTop: 8 }}>
                        <ActionButton size="sm" onClick={() => navigate("/app/operations/dispatch-dashboard")}>Open dispatch board</ActionButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No active alerts" detail="Operational anomalies and AI-driven intervention cues will appear here when detected." />
                )}
              </div>
            </AudienceSection>

            <AudienceSection title="Shortcuts" meta="Workspaces">
              <div style={{ display: "grid", gap: 12 }}>
                <ShortcutTile title="Dispatch dashboard" detail="Reassign load and coordinate field coverage." onClick={() => navigate("/app/operations/dispatch-dashboard")} />
                <ShortcutTile title="Support queue" detail="Review escalations and customer-impacting issues." onClick={() => navigate("/app/operations/support")} />
                <ShortcutTile title="Delivery bookings" detail="Inspect route-level bookings and assignment flow." onClick={() => navigate("/app/operations/delivery/bookings")} />
              </div>
            </AudienceSection>
          </div>
        </>
      ) : null}

      {!loading && !summary && !error ? (
        <EmptyState title="No operations data" detail="Connect live analytics and dispatch telemetry to populate this command center." />
      ) : null}
    </div>
  );
}

function SummaryCard({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div style={noticeCardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {rows.map((row) => (
          <div key={row} style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskPill({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid color-mix(in srgb, var(--color-accent) 24%, transparent)",
        background: "var(--color-accent-dim)",
        color: "var(--color-accent)",
        fontSize: 12
      }}
    >
      {text}
    </div>
  );
}

function ShortcutTile({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 16,
        borderRadius: 18,
        border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
        background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
        cursor: "pointer"
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "var(--color-text-muted)" }}>{detail}</div>
    </button>
  );
}

const eyebrowStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "var(--color-accent-dim)",
  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
  color: "var(--color-accent)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace"
} as const;

const noticeCardStyle = {
  padding: 16,
  borderRadius: 18,
  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)"
} as const;
