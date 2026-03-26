import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/contexts/KoraToastContext";
import { useState, useEffect } from "react";
import { apiClient, getApiErrorMessage } from "@/services/api";

interface Ticket {
  id: string;
  customer_name?: string;
  channel: string;
  assignee_name?: string | null;
  priority?: string;
  status: string;
  created_at: string;
}

export default function TicketsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiClient
      .get<Ticket[]>("/api/support/cases", {
        params: {
          status: "open,assigned,in_progress,escalated",
          sort: "created_at:desc",
        },
      })
      .then((data) => {
        if (active) {
          setTickets(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load support cases"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await apiClient.patch(`/api/support/cases/${id}/status`, { status: "resolved" });
      showToast("Ticket resolved", "success");
      setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
    } catch (err) {
      showToast(`Failed to resolve: ${getApiErrorMessage(err, "Request failed")}`, "error");
    }
  };

  const columns = [
    { 
      accessorKey: "customer_name", 
      header: "Customer",
      sortable: true
    },
    { 
      accessorKey: "channel", 
      header: "Channel",
      sortable: true
    },
    { 
      accessorKey: "assignee_name", 
      header: "Assignee",
      sortable: true
    },
    { 
      accessorKey: "priority", 
      header: "Priority",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.priority} />
    },
    { 
      accessorKey: "status", 
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />
    },
    { 
      accessorKey: "created_at", 
      header: "Created",
      sortable: true,
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString()
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
              onClick: () => navigate(`/app/operations/support/${row.original.id}`)
            },
            {
              label: "Resolve",
              icon: "✅",
              onClick: () => handleResolve(row.original.id)
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
  
  if (!tickets.length) return (
    <EmptyState
      message="No Support Tickets"
      action={{ label: "Refresh", onClick: () => window.location.reload() }}
    />
  );

  return (
    <PageLayout
      title="Support Tickets"
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
      <DataTableEnhanced 
        columns={columns} 
        data={tickets} 
        onRowClick={(row) => navigate(`/app/operations/support/${row.id}`)}
      />
    </PageLayout>
  );
}
