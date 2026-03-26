import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBusinessSummary, getChurnPrediction, getStaffPerformance, getStaffRoster } from "../../services/api";
import type { BusinessSummary, StaffMember, StaffPerformance } from "../../types/audience";
import { ActionButton, AudienceMetric, AudienceSection, EmptyState, StatusPill, formatMoney } from "../../components/audience/AudiencePrimitives";

const MOCK_SUMMARY: BusinessSummary = {
  revenue: { today: 182000, this_week: 960000, this_month: 4120000, vs_last_month_pct: 14.2 },
  bookings: { today_total: 34, no_show_rate_pct: 6.5, cancellation_rate_pct: 3.2, avg_booking_value: 12800 },
  staff: { utilisation_rate_pct: 82.4, top_performer_id: "staff-1", understaffed_slots: 2 },
  staff_profiles: { utilisation_rate_pct: 82.4, top_performer_id: "staff-1", understaffed_slots: 2 },
  clients: { active_count: 428, at_churn_risk: 12, new_this_month: 37, avg_lifetime_value: 48600 },
  customers: { active_count: 428, at_churn_risk: 12, new_this_month: 37, avg_lifetime_value: 48600 },
  ai_alerts: [
    {
      id: "alert-1",
      title: "Recover overdue balances from recent visitors",
      severity: "high",
      sourceModule: "finance",
      context: "4 clients have unpaid balances and recent visits",
      rank: 1,
      score: 91,
      reasoning: ["High recovery probability", "Revenue at risk this week"],
      followUpChain: ["finance:Send payment links", "notifications:Queue reminders"],
      confidence: 0.82
    }
  ]
};

const MOCK_STAFF: StaffMember[] = [
  { id: "staff-1", email: "mira@example.com", full_name: "Mira Cole", role: "manager", specializations: ["Spa", "Retention"], availability: {}, rating: 4.8, is_active: true },
  { id: "staff-2", email: "tari@example.com", full_name: "Tari Bello", role: "therapist", specializations: ["Recovery"], availability: {}, rating: 4.6, is_active: true }
];

const MOCK_PERFORMANCE: StaffPerformance = {
  bookings_completed: 52,
  avg_session_rating: 4.8,
  revenue_generated: 680000,
  no_show_contribution_pct: 4,
  client_retention_rate: 78,
  top_services: ["Deep Tissue", "Recovery Blend", "Express Reset"],
  availability_this_week: {}
};

export function BusinessAdminDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [performance, setPerformance] = useState<StaffPerformance | null>(null);
  const [churn, setChurn] = useState<Array<{ id: string; name: string; days_since_visit: number; predicted_churn_pct: number; recommended_action: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [summaryResponse, churnResponse, staffResponse] = await Promise.all([
          getBusinessSummary(),
          getChurnPrediction(),
          getStaffRoster()
        ]);
        setSummary(summaryResponse);
        setChurn(churnResponse.at_risk_clients);
        setStaff(staffResponse.staff);
        setSelectedStaffId(staffResponse.staff[0]?.id ?? null);
        setError(null);
      } catch (err) {
        setSummary(MOCK_SUMMARY);
        setChurn([
          { id: "client-2", name: "Sarah Bloom", days_since_visit: 39, predicted_churn_pct: 74, recommended_action: "Send personalized re-engagement message" }
        ]);
        setStaff(MOCK_STAFF);
        setSelectedStaffId(MOCK_STAFF[0].id);
        setError(err instanceof Error ? err.message : "Tenant operations overview is currently using preview data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    async function loadPerformance() {
      if (!selectedStaffId) return;
      try {
        setPerformance(await getStaffPerformance(selectedStaffId));
      } catch {
        setPerformance(MOCK_PERFORMANCE);
      }
    }
    void loadPerformance();
  }, [selectedStaffId]);

  const metrics = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Revenue Today", value: formatMoney(summary.revenue.today), tone: "var(--color-accent)" },
      { label: "Bookings Today", value: String(summary.bookings.today_total), tone: "var(--color-text-primary)" },
      { label: "Staff Utilisation", value: `${(summary.staff_profiles ?? summary.staff).utilisation_rate_pct.toFixed(1)}%`, tone: "var(--color-success)" },
      { label: "At-Risk Clients", value: String((summary.customers ?? summary.clients).at_churn_risk), tone: "var(--color-warning)" },
      { label: "New This Month", value: String((summary.customers ?? summary.clients).new_this_month), tone: "var(--color-text-primary)" }
    ];
  }, [summary]);

  if (loading && !summary) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Loading tenant operations overview…</div>;
  }

  if (!summary) {
    return <div style={{ padding: 24, color: "var(--color-danger)" }}>Tenant operations overview unavailable.</div>;
  }

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
              Operations overview
            </h1>
            <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
              A task-first overview for daily bookings, clients, services, staff, payments, and retention. The surface
              keeps the business oriented before operators move into the detailed workspaces.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionButton tone="ghost" onClick={() => navigate("/app/business-admin/bookings")}>Open bookings</ActionButton>
            <ActionButton tone="ghost" onClick={() => navigate("/app/business-admin/clients")}>Open clients</ActionButton>
            <ActionButton onClick={() => navigate("/app/business-admin/staff")}>Open staff</ActionButton>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginTop: 20 }}>
          {metrics.map((metric) => (
            <AudienceMetric key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.9fr)", gap: 18 }}>
        <AudienceSection title="Quick actions" meta="Core workflows">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <ActionTile title="Bookings" detail="Manage daily schedule, customer arrivals, and recovery throughput." onClick={() => navigate("/app/business-admin/bookings")} />
            <ActionTile title="Clinical" detail="Open patient records, appointments, and note workflows." onClick={() => navigate("/app/clinical")} />
            <ActionTile title="Emergency" detail="Handle live incident intake, dispatch, and resolution workflow." onClick={() => navigate("/app/emergency")} />
            <ActionTile title="Payments" detail="Monitor settlement activity and investigate transaction issues." onClick={() => navigate("/app/business-admin/payments")} />
            <ActionTile title="Inventory" detail="Review stock posture and low-supply operational risk." onClick={() => navigate("/app/business-admin/inventory")} />
            <ActionTile title="CRM" detail="Convert leads and follow up on at-risk customer relationships." onClick={() => navigate("/app/business-admin/crm")} />
          </div>
        </AudienceSection>

        <AudienceSection title="Pending tasks" meta="Immediate attention">
          <div style={{ display: "grid", gap: 10 }}>
            <TaskPill text={`${summary.bookings.today_total} bookings scheduled for today`} tone="accent" />
            <TaskPill text={`${summary.staff.understaffed_slots} understaffed slots need coverage`} tone={summary.staff.understaffed_slots > 0 ? "warning" : "muted"} />
            <TaskPill text={`${(summary.customers ?? summary.clients).at_churn_risk} customers need retention follow-up`} tone="warning" />
            <TaskPill text={`${summary.ai_alerts.length} AI recommendations waiting for review`} tone={summary.ai_alerts.length > 0 ? "accent" : "muted"} />
          </div>
        </AudienceSection>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)", gap: 18 }}>
        <AudienceSection title="Staff focus" meta="Selected team member">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 10 }}>
              {staff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedStaffId(member.id)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: selectedStaffId === member.id ? "1px solid var(--color-accent)" : "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
                    background: selectedStaffId === member.id ? "var(--color-accent-dim)" : "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>{member.full_name}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "var(--color-text-muted)" }}>
                        {member.specializations.join(" · ") || member.role}
                      </div>
                    </div>
                    <StatusPill label={member.role} tone="muted" />
                  </div>
                </button>
              ))}
            </div>

            {performance ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <AudienceMetric label="Bookings" value={String(performance.bookings_completed)} tone="var(--color-text-primary)" />
                  <AudienceMetric label="Revenue" value={formatMoney(performance.revenue_generated)} tone="var(--color-accent)" />
                  <AudienceMetric label="Rating" value={performance.avg_session_rating.toFixed(1)} tone="var(--color-success)" />
                  <AudienceMetric label="Retention" value={`${performance.client_retention_rate.toFixed(1)}%`} tone="var(--color-warning)" />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {performance.top_services.map((service) => <StatusPill key={service} label={service} tone="accent" />)}
                </div>
              </div>
            ) : (
              <EmptyState title="Select a team member" detail="Staff performance detail will appear here when a roster item is selected." />
            )}
          </div>
        </AudienceSection>

        <AudienceSection title="Recent signals" meta="Customers and AI">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={noticeCardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>At-risk customers</div>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {churn.length ? (
                  churn.slice(0, 4).map((client) => (
                    <div key={client.id}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{client.name}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
                        {client.days_since_visit} days since visit · {client.predicted_churn_pct}% churn risk
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No churn hotspots" detail="Retention watchlist entries will appear here as risk rises." />
                )}
              </div>
            </div>

            <div style={noticeCardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>AI recommendations</div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {summary.ai_alerts.map((alert) => (
                  <div key={alert.id} style={{ padding: "12px 0", borderBottom: "1px solid color-mix(in srgb, var(--color-border) 68%, transparent)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{alert.title}</div>
                      <StatusPill label={alert.severity} tone={alert.severity === "critical" ? "danger" : alert.severity === "high" ? "warning" : "accent"} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-muted)" }}>{alert.context}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AudienceSection>
      </div>
    </div>
  );
}

function ActionTile({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 18,
        borderRadius: 18,
        textAlign: "left",
        border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
        background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
        cursor: "pointer"
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "var(--color-text-muted)" }}>{detail}</div>
      <div style={{ marginTop: 14 }}>
        <span style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 700 }}>Open workspace</span>
      </div>
    </button>
  );
}

function TaskPill({ text, tone }: { text: string; tone: "accent" | "warning" | "muted" }) {
  const colorMap = {
    accent: "var(--color-accent)",
    warning: "var(--color-warning)",
    muted: "var(--color-text-muted)"
  };

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid color-mix(in srgb, ${colorMap[tone]} 24%, transparent)`,
        background: `color-mix(in srgb, ${colorMap[tone]} 10%, transparent)`,
        color: tone === "muted" ? "var(--color-text-secondary)" : colorMap[tone],
        fontSize: 12
      }}
    >
      {text}
    </div>
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
