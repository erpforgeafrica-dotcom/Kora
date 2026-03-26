import { useEffect, useMemo, useState } from "react";
import { ActionButton, AudienceMetric, AudienceSection, EmptyState, StatusPill } from "../../components/audience/AudiencePrimitives";

interface InsightCard {
  id: string;
  category: "prediction" | "recommendation" | "anomaly" | "opportunity";
  title: string;
  description: string;
  icon: string;
  priority: "high" | "medium" | "low";
  ai_model: string;
  confidence: number;
  action?: string;
  action_handler?: () => void;
}

interface AIMetric {
  label: string;
  value: string | number;
  trend: "up" | "down" | "stable";
  change_pct: number;
  tone: string;
}

// Mock data
const MOCK_INSIGHTS: InsightCard[] = [
  {
    id: "ins-001",
    category: "prediction",
    title: "Client Churn Risk Alert",
    description: "Sarah Mitchell hasn't booked in 62 days. Based on her pattern (every 45 days), she's at high risk of churning. Recommend re-engagement email with 20% loyalty discount.",
    icon: "📉",
    priority: "high",
    ai_model: "claude-opus",
    confidence: 0.87,
    action: "Send Re-engagement Email",
  },
  {
    id: "ins-002",
    category: "recommendation",
    title: "Upsell Opportunity: Emily Rodriguez",
    description: "Emily booked 3 hair services in the last 60 days. AI predicts 76% probability she'll purchase a hair care product bundle (£45–65 value).",
    icon: "💰",
    priority: "medium",
    ai_model: "mistral-large",
    confidence: 0.76,
  },
  {
    id: "ins-003",
    category: "anomaly",
    title: "No-show Spike Detection",
    description: "No-show rate jumped from 3.2% to 6.5% this week. Likely cause: weather disruption (identified via correlation with transport data). Recommend flexibility on rescheduling fees.",
    icon: "⚠️",
    priority: "high",
    ai_model: "openai-gpt4",
    confidence: 0.82,
  },
  {
    id: "ins-004",
    category: "opportunity",
    title: "Staff Skill Gap: Medspa Demand",
    description: "Medspa bookings up 34% YoY. Current team has only 1 medspa specialist. Recommend hiring or cross-training 1–2 therapists to capture untapped demand.",
    icon: "🚀",
    priority: "medium",
    ai_model: "claude-opus",
    confidence: 0.79,
  },
  {
    id: "ins-005",
    category: "prediction",
    title: "Peak Booking Slot Prediction",
    description: "Saturday 10:00–12:00 is projected to be fully booked in 2 weeks. Recommend opening new weekend slots or extending Saturday hours.",
    icon: "📅",
    priority: "low",
    ai_model: "gemini-pro",
    confidence: 0.71,
  },
];

const MOCK_AI_METRICS: AIMetric[] = [
  { label: "Prediction Accuracy", value: "87%", trend: "up", change_pct: 4.2, tone: "var(--color-success)" },
  { label: "Avg Confidence Score", value: "0.79", trend: "up", change_pct: 2.1, tone: "var(--color-accent)" },
  { label: "Actions Accepted", value: "68%", trend: "up", change_pct: 5.8, tone: "var(--color-success)" },
  { label: "ROI Attributed", value: "£12.4K", trend: "up", change_pct: 18.3, tone: "var(--color-success)" },
];

// Subcomponents
function InsightCardComponent({ insight }: { insight: InsightCard }) {
  const category_color = {
    prediction: "var(--color-info)",
    recommendation: "var(--color-success)",
    anomaly: "var(--color-danger)",
    opportunity: "var(--color-accent)",
  }[insight.category];

  const priorityTone = {
    high: "danger" as const,
    medium: "warning" as const,
    low: "accent" as const,
  }[insight.priority];

  return (
    <div
      style={{
        padding: "16px",
        background: "var(--color-surface-2)",
        border: `1px solid ${category_color}40`,
        borderRadius: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ fontSize: 24 }}>{insight.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {insight.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
              {insight.category.replace("_", " ").toUpperCase()}
            </div>
          </div>
        </div>
        <StatusPill label={insight.priority} tone={priorityTone} />
      </div>

      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        {insight.description}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--color-text-muted)" }}>
          <span>Model: <strong style={{ color: "var(--color-text-secondary)" }}>{insight.ai_model}</strong></span>
          <span>Confidence: <strong style={{ color: category_color }}>{(insight.confidence * 100).toFixed(0)}%</strong></span>
        </div>

        {insight.action && (
          <ActionButton tone="accent">{insight.action}</ActionButton>
        )}
      </div>
    </div>
  );
}

function AIMetricsGrid({ metrics }: { metrics: AIMetric[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      {metrics.map((m, i) => (
        <div
          key={i}
          style={{
            padding: "16px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{m.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: m.tone }}>{m.value}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: m.tone }}>
            {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {Math.abs(m.change_pct)}% this week
          </div>
        </div>
      ))}
    </div>
  );
}

function AIModelComparison() {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--color-text-muted)", fontWeight: 600 }}>Model</th>
            <th style={{ textAlign: "center", padding: "10px 8px", color: "var(--color-text-muted)", fontWeight: 600 }}>Insights Generated</th>
            <th style={{ textAlign: "center", padding: "10px 8px", color: "var(--color-text-muted)", fontWeight: 600 }}>Avg Accuracy</th>
            <th style={{ textAlign: "center", padding: "10px 8px", color: "var(--color-text-muted)", fontWeight: 600 }}>Cost (this month)</th>
          </tr>
        </thead>
        <tbody>
          {[
            { model: "Claude Opus", insights: 248, accuracy: "89%", cost: "£1,240" },
            { model: "GPT-4", insights: 156, accuracy: "76%", cost: "£620" },
            { model: "Mistral Large", insights: 113, accuracy: "71%", cost: "£340" },
            { model: "Gemini Pro", insights: 82, accuracy: "68%", cost: "£280" },
          ].map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
              <td style={{ padding: "10px 8px", color: "var(--color-text-primary)" }}>{row.model}</td>
              <td style={{ padding: "10px 8px", textAlign: "center", color: "var(--color-text-secondary)" }}>{row.insights}</td>
              <td style={{ padding: "10px 8px", textAlign: "center", color: "var(--color-success)", fontWeight: 700 }}>{row.accuracy}</td>
              <td style={{ padding: "10px 8px", textAlign: "center", color: "var(--color-text-secondary)" }}>{row.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main component
export function AIInsightsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "prediction" | "recommendation" | "anomaly" | "opportunity">("all");

  const filtered_insights = useMemo(() => {
    if (selectedCategory === "all") return MOCK_INSIGHTS;
    return MOCK_INSIGHTS.filter((i) => i.category === selectedCategory);
  }, [selectedCategory]);

  const high_priority = MOCK_INSIGHTS.filter((i) => i.priority === "high").length;
  const total_value = MOCK_INSIGHTS.reduce((sum, i) => sum + (i.priority === "high" ? 3 : i.priority === "medium" ? 2 : 1), 0);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
          AI Intelligence
        </div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Unified AI Insights</div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
          Multi-model recommendations from Claude, GPT-4, Mistral & Gemini. Real-time learning from your business.
        </div>
      </div>

      {/* Alert Banner */}
      {high_priority > 0 && (
        <div
          style={{
            padding: "14px 16px",
            background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
            borderRadius: 12,
            border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-danger)", fontWeight: 700 }}>
            {high_priority} HIGH PRIORITY INSIGHT{high_priority === 1 ? "" : "S"} — Review now
          </div>
          <ActionButton tone="warning" size="sm" onClick={() => {}}>Review</ActionButton>
        </div>
      )}

      {/* KPIs */}
      <AIMetricsGrid metrics={MOCK_AI_METRICS} />

      {/* Insights */}
      <AudienceSection title="AI Insights" meta={`${MOCK_INSIGHTS.length} insights generated`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {(["all", "prediction", "recommendation", "anomaly", "opportunity"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: selectedCategory === c ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: selectedCategory === c ? "var(--color-accent-dim)" : "transparent",
                color: selectedCategory === c ? "var(--color-accent)" : "var(--color-text-muted)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {filtered_insights.length > 0 ? (
            filtered_insights.map((insight) => (
              <InsightCardComponent key={insight.id} insight={insight} />
            ))
          ) : (
            <EmptyState title="No insights" detail={`No ${selectedCategory} insights to display.`} />
          )}
        </div>
      </AudienceSection>

      {/* Model Performance */}
      <AudienceSection title="AI Model Performance & Cost" meta="Multi-model strategy">
        <AIModelComparison />
      </AudienceSection>

      {/* Settings */}
      <AudienceSection title="AI Preferences">
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Enable churn predictions</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Enable upsell recommendations</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Enable anomaly detection</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" style={{ width: 18, height: 18, cursor: "pointer" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Use budget-optimized models (lower cost, slightly lower accuracy)</span>
          </label>
        </div>
      </AudienceSection>
    </div>
  );
}
