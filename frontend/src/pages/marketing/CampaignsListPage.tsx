import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/contexts/KoraToastContext";
import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  sent_count: number;
  open_count: number;
  created_at: string;
}

export default function CampaignsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => setCampaigns(data.campaigns || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`)) return;
    
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      showToast(`${name} deleted successfully`, "success");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  };

  const columns = [
    { 
      accessorKey: "name", 
      header: "Campaign Name",
      sortable: true
    },
    { 
      accessorKey: "channel", 
      header: "Channel",
      sortable: true
    },
    { 
      accessorKey: "status", 
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />
    },
    { 
      accessorKey: "sent_count", 
      header: "Sent",
      sortable: true
    },
    { 
      accessorKey: "open_count", 
      header: "Opens",
      sortable: true
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <ActionMenu
          items={[
            {
              label: "View Details",
              icon: "👁",
              onClick: () => navigate(`/app/business-admin/marketing/${row.original.id}`)
            },
            {
              label: "Edit",
              icon: "✏️",
              onClick: () => navigate(`/app/business-admin/marketing/${row.original.id}/edit`)
            },
            {
              label: "Delete",
              icon: "🗑",
              variant: "danger",
              onClick: () => handleDelete(row.original.id, row.original.name)
            }
          ]}
        />
      ),
    },
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
  
  if (!campaigns.length) return (
    <EmptyState
      message="No Campaigns yet"
      action={{ label: "+ New Campaign", onClick: () => navigate("/app/business-admin/marketing/create") }}
    />
  );

  return (
    <PageLayout
      title="Marketing Campaigns"
      actions={
        <button 
          style={{
            padding: "10px 16px",
            background: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace"
          }}
          onClick={() => navigate("/app/business-admin/marketing/create")}
        >
          + New Campaign
        </button>
      }
    >
      <DataTableEnhanced 
        columns={columns} 
        data={campaigns} 
        onRowClick={(row) => navigate(`/app/business-admin/marketing/${row.id}`)} 
      />
    </PageLayout>
  );
}
