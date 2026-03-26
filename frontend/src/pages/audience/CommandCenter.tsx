import { useMemo, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { ActionButton, AudienceSection, StatusPill, formatMoney } from "../../components/audience/AudiencePrimitives";

type AlertLevel = "critical" | "warning" | "info";
type AlertCategory = "no_show" | "compliance" | "revenue" | "staffing" | "ai_suggestion";

type Alert = {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
  suggestedAction?: string;
};

type CommandState = {
  selectedAlert: string | null;
  filterLevel: AlertLevel | "all";
  expandedMetrics: boolean;
};

const sampleAlerts: Alert[] = [
  {
    id: "alert-1",
    level: "critical",
    category: "no_show",
    title: "High no-show rate detected",
    description: "3 no-shows in last 2 hours. Pattern suggests booking confirmation issue.",
    timestamp: new Date().toISOString(),
    actionRequired: true,
    suggestedAction: "Send SMS reminder to unconfirmed bookings"
  },
  {
    id: "alert-2",
    level: "warning",
    category: "staffing",
    title: "Staff utilisation below target",
    description: "Marcus Johnson has 2/8 slots booked today. Revenue impact: £240.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    actionRequired: false,
    suggestedAction: "Recommend flash discount for afternoon slots"
  },
  {
    id: "alert-3",
    level: "warning",
    category: "compliance",
    title: "Liability waiver: 2 clients missing signature",
    description: "New medspa clients Amelia and Sarah missing signed waivers.",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    actionRequired: true,
    suggestedAction: "Send eSignature link (expires in 24h)"
  },
  {
    id: "alert-4",
    level: "info",
    category: "ai_suggestion",
    title: "AI: Upsell opportunity identified",
    description: "5 clients booking hair services this week haven't added deep conditioning.",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    actionRequired: false,
    suggestedAction: "Pre-add conditioner to cart, 15% discount if added before payment"
  },
  {
    id: "alert-5",
    level: "info",
    category: "revenue",
    title: "Daily revenue on track",
    description: "£3,240 collected. On pace for £4,100 daily target.",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    actionRequired: false
  }
];

function commandReducer(state: CommandState, action: { type: string; payload?: any }): CommandState {
  switch (action.type) {
    case "select-alert":
      return { ...state, selectedAlert: action.payload };
    case "filter-level":
      return { ...state, filterLevel: action.payload };
    case "toggle-metrics":
      return { ...state, expandedMetrics: !state.expandedMetrics };
    default:
      return state;
  }
}

function AlertIcon({ level }: { level: AlertLevel }) {
  const icons = { critical: "🔴", warning: "🟟", info: "🔵" };
  return <span style={{ fontSize: 18 }}>{icons[level]}</span>;
}

function AlertBadge({ level }: { level: AlertLevel }) {
  const colors = {
    critical: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#ef4444" },
    warning: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
    info: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", text: "#3b82f6" }
  };
  const color = colors[level];
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 6,
      background: color.bg,
      border: `1px solid ${color.border}`,
      color: color.text,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase"
    }}>
      {level}
    </span>
  );
}

export function CommandCenter() {
  const [state, dispatch] = useReducer(commandReducer, {
    selectedAlert: null,
    filterLevel: "all",
    expandedMetrics: true
  });

  const filteredAlerts = useMemo(() => {
    return state.filterLevel === "all"
      ? sampleAlerts
      : sampleAlerts.filter(a => a.level === state.filterLevel);
  }, [state.filterLevel]);

  const criticalCount = sampleAlerts.filter(a => a.level === "critical").length;
  const actionItems = sampleAlerts.filter(a => a.actionRequired).length;

  const selectedAlertDetail = sampleAlerts.find(a => a.id === state.selectedAlert);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Command Center
          </div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Live Operations</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusPill label={`${criticalCount} Critical`} tone={criticalCount > 0 ? "danger" : "muted"} />
          <StatusPill label={`${actionItems} Action Items`} tone="accent" />
        </div>
      </div>

      {/* KPI Dashboard */}
      <AudienceSection title="System Health" meta="Real-time metrics">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Online", value: "12/14", color: "#00e5c8" },
            { label: "Utilisation", value: "74%", color: "#fbbf24" },
            { label: "Queue Health", value: "Zero lag", color: "#10b981" },
            { label: "AI Budget", value: "£240/500", color: "#8b5cf6" }
          ].map((metric, i) => (
            <div key={i} style={{
              padding: 16,
              background: "var(--color-surface-2)",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: metric.color, marginBottom: 4 }}>
                {metric.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{metric.label}</div>
            </div>
          ))}
        </div>
      </AudienceSection>

      {/* Main alerts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 16 }}>
        {/* Alerts List */}
        <AudienceSection title={`Alerts (${filteredAlerts.length})`} meta="Priority ordered">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["all", "critical", "warning", "info"].map(level => (
              <button
                key={level}
                onClick={() => dispatch({ type: "filter-level", payload: level })}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: state.filterLevel === level ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: state.filterLevel === level ? "var(--color-accent-dim)" : "transparent",
                  color: state.filterLevel === level ? "var(--color-accent)" : "var(--color-text-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {level === "all" ? "All" : level}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10, maxHeight: 600, overflowY: "auto" }}>
            {filteredAlerts.map(alert => (
              <button
                key={alert.id}
                onClick={() => dispatch({ type: "select-alert", payload: state.selectedAlert === alert.id ? null : alert.id })}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: state.selectedAlert === alert.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: state.selectedAlert === alert.id ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start"
                }}
              >
                <AlertIcon level={alert.level} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {alert.description}
                  </div>
                  {alert.actionRequired && (
                    <div style={{ marginTop: 6 }}>
                      <StatusPill label="Action required" tone="danger" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </AudienceSection>

        {/* Alert Details & Actions */}
        <AudienceSection title="Alert Details" meta={selectedAlertDetail ? "Selected" : "Choose an alert"}>
          {selectedAlertDetail ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Level</div>
                <AlertBadge level={selectedAlertDetail.level} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Category</div>
                <StatusPill label={selectedAlertDetail.category} tone="muted" />
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
                  {selectedAlertDetail.description}
                </div>
              </div>

              {selectedAlertDetail.suggestedAction && (
                <div style={{
                  padding: 12,
                  background: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
                  borderRadius: 10,
                  border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)"
                }}>
                  <div style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 700, marginBottom: 4 }}>AI SUGGESTED ACTION</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {selectedAlertDetail.suggestedAction}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gap: 8 }}>
                <ActionButton tone="accent" style={{ width: "100%" }} onClick={() => {}}>Take Action</ActionButton>
                {selectedAlertDetail.level === "critical" && (
                  <ActionButton tone="ghost" style={{ width: "100%" }} onClick={() => {}}>Escalate to Manager</ActionButton>
                )}
              </div>

              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Detected {new Date(selectedAlertDetail.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>
              Select an alert to view details and suggested actions
            </div>
          )}
        </AudienceSection>
      </div>

      {/* AI Assistant Panel */}
      <AudienceSection title="AI Command Assistant" meta="Natural language operations">
        <div style={{
          padding: 16,
          background: "color-mix(in srgb, var(--color-accent) 6%, transparent)",
          borderRadius: 12,
          border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)"
        }}>
          <div style={{ fontSize: 13, marginBottom: 12, color: "var(--color-text-secondary)" }}>
            Ask me anything about your business right now:
          </div>
          <input
            type="text"
            placeholder="E.g., 'Who's running late today?' or 'Show me revenue trends this week'"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-1)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontFamily: "inherit"
            }}
          />
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-muted)" }}>
            AI processes in near real-time · cached results reduce latency
          </div>
        </div>
      </AudienceSection>
    </div>
  );
}
