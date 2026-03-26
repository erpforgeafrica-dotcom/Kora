import { useState, useEffect } from "react";
import { ActionButton, AudienceMetric, AudienceSection, EmptyState } from "../../components/audience/AudiencePrimitives";
import { getReportingSummary } from "../../services/api";
import type { ReportingSummary } from "../../types";

type ReportType = "daily" | "weekly" | "monthly";

function fmt(n: number) {
  return n.toLocaleString();
}

export function ReportsCenter() {
  const [tab, setTab] = useState<"overview" | "generate" | "history">("overview");
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [generated, setGenerated] = useState<{ jobId: string; type: string } | null>(null);

  useEffect(() => {
    getReportingSummary()
      .then(setSummary)
      .catch((e) => setError(e?.message ?? "Failed to load reporting summary"))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("kora_token") ?? import.meta.env.VITE_DEV_BEARER_TOKEN ?? "";
      const orgId = localStorage.getItem("kora_org_id") ?? import.meta.env.VITE_ORG_ID ?? "org_placeholder";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"}/api/reporting/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Org-Id": orgId,
          "X-Organization-Id": orgId,
        },
        body: JSON.stringify({ reportType }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGenerated({ jobId: data.jobId, type: reportType });
      setTab("history");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to enqueue report");
    } finally {
      setGenerating(false);
    }
  };

  const bookingMetric = summary?.metrics?.find((m) => m.key === "total_bookings");
  const revenueMetric = summary?.metrics?.find((m) => m.key === "total_revenue_cents");
  const clientMetric = summary?.metrics?.find((m) => m.key === "active_clients");
  const pendingMetric = summary?.metrics?.find((m) => m.key === "pending_reports");

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
          Reporting & Analytics
        </div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Reports Center</div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
          Schedule, generate, and download business reports backed by live data.
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "color-mix(in srgb, var(--color-danger) 10%, transparent)", color: "var(--color-danger)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <AudienceMetric label="Total Bookings" value={fmt(summary.total_bookings ?? 0)} tone="var(--color-accent)" />
          <AudienceMetric label="Total Revenue" value={`£${fmt(Math.round((summary.total_revenue_cents ?? 0) / 100))}`} tone="var(--color-success)" />
          <AudienceMetric label="Active Clients" value={fmt(summary.active_clients ?? 0)} tone="var(--color-text-primary)" />
          <AudienceMetric label="Pending Reports" value={fmt(summary.pending_reports ?? 0)} tone="var(--color-warning)" />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
        {(["overview", "generate", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", border: "none", background: "transparent",
              color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              borderBottom: tab === t ? "2px solid var(--color-accent)" : "none",
              marginBottom: -13,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {[
            { label: "Daily Report", type: "daily" as ReportType, desc: "Today's bookings, revenue, and staff activity." },
            { label: "Weekly Report", type: "weekly" as ReportType, desc: "7-day rolling summary: revenue trends, top services, no-show rates." },
            { label: "Monthly Report", type: "monthly" as ReportType, desc: "Full month: P&L, client retention, staff performance, AI impact." },
          ].map((r) => (
            <div key={r.type} style={{ padding: 16, background: "var(--color-surface-2)", borderRadius: 12, border: "1px solid var(--color-border)", display: "grid", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{r.label}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.desc}</div>
              <ActionButton tone="accent" size="sm" onClick={() => { setReportType(r.type); setTab("generate"); }}>
                Generate
              </ActionButton>
            </div>
          ))}
        </div>
      )}

      {tab === "generate" && (
        <AudienceSection title="Generate Report" meta="Enqueues async generation via BullMQ worker">
          <div style={{ display: "grid", gap: 14, maxWidth: 400 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-2)", color: "var(--color-text-primary)", fontSize: 13 }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <ActionButton tone="accent" onClick={handleGenerate} disabled={generating}>
              {generating ? "Queuing..." : "Generate Report"}
            </ActionButton>
          </div>
        </AudienceSection>
      )}

      {tab === "history" && (
        <AudienceSection title="Generation History" meta="Reports queued in this session">
          {generated ? (
            <div style={{ padding: 14, borderRadius: 10, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-success)" }}>✓ Report queued</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
                Type: {generated.type} · Job ID: {generated.jobId}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                Processing via BullMQ worker. Download will be available once complete.
              </div>
            </div>
          ) : (
            <EmptyState title="No reports generated yet" detail="Use the Generate tab to queue a report." />
          )}
        </AudienceSection>
      )}
    </div>
  );
}
