import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { useState, useEffect } from "react";
import { getPlatformFeatureFlags } from "@/services/platformAdmin";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  source: string;
  scope: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlatformFeatureFlags()
      .then((data) => setFlags(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load feature flags"))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { 
      accessorKey: "key", 
      header: "Feature Key",
      sortable: true
    },
    { 
      accessorKey: "enabled", 
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => (
        <StatusBadge 
          status={row.original.enabled ? "enabled" : "disabled"} 
          variant={row.original.enabled ? "success" : "default"}
        />
      )
    },
    { 
      accessorKey: "scope", 
      header: "Scope",
      sortable: true
    },
    { 
      accessorKey: "source", 
      header: "Source",
      sortable: true
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
      title="Feature Flags"
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
      <div style={{ marginBottom: 16, padding: 16, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }}>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Platform capability toggles returned by the live backend. These flags control feature availability across all tenants.
        </div>
      </div>
      
      <DataTableEnhanced 
        columns={columns} 
        data={flags} 
      />
    </PageLayout>
  );
}
