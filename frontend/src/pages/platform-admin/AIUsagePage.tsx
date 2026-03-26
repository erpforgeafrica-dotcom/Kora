import { useMemo, useState, useEffect } from "react";
import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import { getPlatformAiUsage } from "@/services/platformAdmin";

interface AISpendSummary {
  total_spend_usd: number;
  by_provider: Record<string, number>;
  by_org: Array<{
    org_id: string;
    org_name: string;
    spend_usd: number;
    pct_of_total: number;
  }>;
  top_task_types: Array<{
    task: string;
    token_count: number;
    cost_usd: number;
  }>;
  budget_alerts: Array<{
    org_id: string;
    org_name: string;
    pct_of_total?: number;
    utilisation_pct?: number;
  }>;
}

const TABLE_CARD_STYLE = {
  borderRadius: 20,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
  padding: 18
} as const;

export default function AIUsagePage() {
  const [summary, setSummary] = useState<AISpendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlatformAiUsage()
      .then((data) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load AI usage"))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const providerData = useMemo(
    () =>
      summary?.by_provider
        ? Object.entries(summary.by_provider).map(([provider, amount]) => ({
            provider,
            amount: Number(amount) || 0
          }))
        : [],
    [summary]
  );

  const orgData = useMemo(
    () =>
      summary?.by_org
        ? summary.by_org.map((org) => ({
            organization: org.org_name,
            amount: Number(org.spend_usd) || 0,
            pct_of_total: Number(org.pct_of_total) || 0
          }))
        : [],
    [summary]
  );

  const totalProviders = providerData.length;
  const topProvider = providerData.sort((a, b) => b.amount - a.amount)[0];

  const providerColumns = [
    {
      accessorKey: "provider",
      header: "Provider",
      sortable: true
    },
    {
      accessorKey: "amount",
      header: "Spend",
      sortable: true,
      cell: ({ row }: any) => formatMoney(row.original.amount)
    }
  ];

  const orgColumns = [
    {
      accessorKey: "organization",
      header: "Organization",
      sortable: true
    },
    {
      accessorKey: "amount",
      header: "Spend",
      sortable: true,
      cell: ({ row }: any) => formatMoney(row.original.amount)
    },
    {
      accessorKey: "pct_of_total",
      header: "Share",
      sortable: true,
      cell: ({ row }: any) => `${row.original.pct_of_total.toFixed(1)}%`
    }
  ];

  if (loading) return <Skeleton rows={8} />;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            padding: 16,
            background: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
            border: "1px solid var(--color-danger)",
            borderRadius: 12,
            color: "var(--color-danger)",
            fontSize: 14
          }}
        >
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Monitoring and AI"
      subtitle="Provider usage, AI spend posture, and operational governance across the KORA platform."
      actions={
        <>
          <button style={secondaryButtonStyle} onClick={() => window.location.reload()}>
            Refresh
          </button>
          <button style={primaryButtonStyle}>Open AI settings</button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
          <MetricCard label="Total AI Spend" value={formatMoney(summary?.total_spend_usd || 0)} tone="var(--color-accent)" />
          <MetricCard label="Providers Active" value={String(totalProviders)} tone="var(--color-text-primary)" />
          <MetricCard label="Top Provider" value={topProvider ? topProvider.provider : "—"} tone="var(--color-success)" />
          <MetricCard label="Budget Alerts" value={String(summary?.budget_alerts.length ?? 0)} tone="var(--color-warning)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)", gap: 18 }}>
          <div style={TABLE_CARD_STYLE}>
            <div style={sectionLabelStyle}>AI Usage</div>
            <h2 style={sectionTitleStyle}>Spend by provider</h2>
            <div style={{ marginTop: 6, marginBottom: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
              Platform-level cost visibility across active AI providers.
            </div>
            <DataTableEnhanced columns={providerColumns} data={providerData} showPagination={false} />
          </div>

          <div style={TABLE_CARD_STYLE}>
            <div style={sectionLabelStyle}>Governance</div>
            <h2 style={sectionTitleStyle}>Operational notices</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <NoticeCard text={`${totalProviders} providers currently active in spend reporting.`} tone="accent" />
              <NoticeCard text={`${summary?.budget_alerts.length ?? 0} budget alerts need governance review.`} tone="muted" />
              <NoticeCard text={topProvider ? `${topProvider.provider} is currently the largest spend source.` : "No provider spend detected."} tone="warning" />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
          <div style={TABLE_CARD_STYLE}>
            <div style={sectionLabelStyle}>Recommendations</div>
            <h2 style={sectionTitleStyle}>Model review</h2>
            <div style={{ marginTop: 6, marginBottom: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
              Compare organization-level spend and detect where governance attention is needed.
            </div>
            {orgData.length ? (
              <DataTableEnhanced columns={orgColumns} data={orgData} showPagination={false} />
            ) : (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>No organization spend available</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "var(--color-text-muted)" }}>
                  This environment has not produced organization-level AI spend data yet.
                </div>
              </div>
            )}
          </div>

          <div style={TABLE_CARD_STYLE}>
            <div style={sectionLabelStyle}>Logs</div>
            <h2 style={sectionTitleStyle}>Monitoring summary</h2>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {providerData.map((provider) => (
                <div key={provider.provider}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{provider.provider}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{formatMoney(provider.amount)}</div>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--color-border)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${summary?.total_spend_usd ? (provider.amount / summary.total_spend_usd) * 100 : 0}%`,
                        height: "100%",
                        background: "var(--color-accent)"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      style={{
        padding: "18px 18px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 82%, transparent), color-mix(in srgb, var(--color-surface-2) 90%, transparent))",
        border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)"
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: tone }}>{value}</div>
    </div>
  );
}

function NoticeCard({ text, tone }: { text: string; tone: "accent" | "warning" | "muted" }) {
  const colorMap = {
    accent: "var(--color-accent)",
    warning: "var(--color-warning)",
    muted: "var(--color-text-muted)"
  };

  return (
    <div
      style={{
        padding: "12px 14px",
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

const primaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-accent) 36%, transparent)",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-surface) 82%), color-mix(in srgb, var(--color-surface-2) 92%, transparent))",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  cursor: "pointer"
} as const;

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
  color: "var(--color-text-secondary)",
  fontWeight: 600,
  cursor: "pointer"
} as const;

const sectionLabelStyle = {
  fontSize: 11,
  color: "var(--color-accent)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace"
} as const;

const sectionTitleStyle = {
  margin: "8px 0 0",
  fontSize: 22,
  color: "var(--color-text-primary)"
} as const;

const emptyStateStyle = {
  minHeight: 220,
  borderRadius: 18,
  border: "1px dashed color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 72%, transparent)",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  padding: 22
} as const;
