import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ActionMenu from "@/components/ui/ActionMenu";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import { useState } from "react";
import type { Service } from "@/types";

export default function ServicesListPageEnhanced() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem, refetch } = useCrud<Service>("/api/services");
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`)) return;
    
    try {
      await deleteItem(id);
      showToast(`${name} deleted successfully`, "success");
      refetch();
    } catch (err: any) {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  };

  const filteredData = data?.filter((service) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name?.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });

  const columns = [
    { 
      accessorKey: "name", 
      header: "Service Name",
      sortable: true
    },
    { 
      accessorKey: "duration_minutes", 
      header: "Duration",
      sortable: true,
      cell: ({ row }: any) => `${row.original.duration_minutes || 0} min`
    },
    { 
      accessorKey: "price_cents", 
      header: "Price",
      sortable: true,
      cell: ({ row }: any) => {
        const cents = Number(row.original.price_cents ?? 0);
        const amount = Number.isFinite(cents) ? (cents / 100).toFixed(2) : "0.00";
        const currency = row.original.currency || "GBP";
        return `${currency} ${amount}`;
      }
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
              onClick: () => navigate(`/app/business-admin/services/${row.original.id}`)
            },
            {
              label: "Edit",
              icon: "✏️",
              onClick: () => navigate(`/app/business-admin/services/${row.original.id}/edit`)
            },
            {
              label: "Delete",
              icon: "🗑",
              variant: "danger",
              onClick: () => handleDelete(row.original.id, row.original.name || "Service")
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
  
  if (!filteredData?.length && !searchQuery) return (
    <EmptyState
      message="No Services yet"
      action={{ label: "+ New Service", onClick: () => navigate("/app/business-admin/services/create") }}
    />
  );

  return (
    <PageLayout
      title="Services"
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
          onClick={() => navigate("/app/business-admin/services/create")}
        >
          + New Service
        </button>
      }
    >
      <Toolbar 
        search={
          <input 
            placeholder="Search services…" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              width: 300,
              fontFamily: "'DM Mono', monospace"
            }}
          />
        } 
      />
      
      {filteredData?.length === 0 && searchQuery ? (
        <div style={{ 
          padding: 32, 
          textAlign: "center", 
          color: "var(--color-text-muted)",
          fontSize: 14
        }}>
          No results for "{searchQuery}"
        </div>
      ) : (
        <DataTableEnhanced 
          columns={columns} 
          data={filteredData || []} 
          onRowClick={(row) => navigate(`/app/business-admin/services/${row.id}`)} 
        />
      )}
    </PageLayout>
  );
}
