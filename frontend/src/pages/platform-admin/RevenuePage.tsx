import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import { useState, useEffect } from "react";
import { getPlatformRevenue } from "@/services/platformAdmin";

interface RevenueByOrg {
  org_id: string;
  org_name: string;
  completed_revenue_cents: number;
  transaction_count: number;
}

interface RevenueSummary {
  completed_revenue_cents: number;
  transaction_count: number;
  average_transaction_value_cents: number;
  by_org: RevenueByOrg[];
}

export default function PlatformRevenuePage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlatformRevenue()
      .then((data) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load revenue"))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD" 
    }).format(cents / 100);
  };

  const columns = [
    { 
      accessorKey: "org_name", 
      header: "Organization",
      sortable: true
    },
    { 
      accessorKey: "completed_revenue_cents", 
      header: "Revenue",
      sortable: true,
      cell: ({ row }: any) => formatMoney(row.original.completed_revenue_cents)
    },
    { 
      accessorKey: "transaction_count", 
      header: "Transactions",
      sortable: true
    },
    {
      id: "avg",
      header: "Avg Transaction",
      cell: ({ row }: any) => {
        const avg = row.original.transaction_count > 0 
          ? row.original.completed_revenue_cents / row.original.transaction_count 
          : 0;
        return formatMoney(avg);
      }
    }
  ];

  if (loading) return <Skeleton rows={8} />;
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ 
        padding: 16, 
        background: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
        border: "1px solid var(--color-danger)",
        borderRadius: 12,
        color: "var(--color-danger)",
        fontSize: 14
      }}>
        Error: {error}
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Revenue & Subscriptions"
      actions={
        <button 
          style={{
            padding: "10px 16px",
            background: "var(--color-surface-2)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace"
          }}
          onClick={() => window.location.reload()}
        >
          🔄 Refresh
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ 
          background: "var(--color-surface)", 
          border: "1px solid var(--color-border)", 
          borderRadius: 12, 
          padding: 20 
        }}>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Total Revenue
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-accent)", fontFamily: "'DM Mono', monospace" }}>
            {formatMoney(summary?.completed_revenue_cents || 0)}
          </div>
        </div>

        <div style={{ 
          background: "var(--color-surface)", 
          border: "1px solid var(--color-border)", 
          borderRadius: 12, 
          padding: 20 
        }}>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Total Transactions
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "'DM Mono', monospace" }}>
            {summary?.transaction_count?.toLocaleString() || 0}
          </div>
        </div>

        <div style={{ 
          background: "var(--color-surface)", 
          border: "1px solid var(--color-border)", 
          borderRadius: 12, 
          padding: 20 
        }}>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Avg Transaction
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "'DM Mono', monospace" }}>
            {formatMoney(summary?.average_transaction_value_cents || 0)}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-text-primary)" }}>
        Revenue by Organization
      </h2>
      
      <DataTableEnhanced 
        columns={columns} 
        data={summary?.by_org || []} 
      />
    </PageLayout>
  );
}
