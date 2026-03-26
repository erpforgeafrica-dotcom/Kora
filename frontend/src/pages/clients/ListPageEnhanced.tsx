import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import { SkeletonTable } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import BulkActions from "@/components/ui/BulkActions";
import FilterPanel from "@/components/ui/FilterPanel";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { exportToCSV } from "@/utils/export";
import type { Client } from "@/types";
import { useState } from "react";

export default function ClientsListPageEnhanced() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem, refetch } = useCrud<Client>("/api/clients");
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const debouncedSearch = useDebounce(searchQuery, 300);

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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} clients? This action cannot be undone.`)) return;
    
    try {
      await Promise.all(selectedIds.map(id => deleteItem(id)));
      showToast(`${selectedIds.length} clients deleted successfully`, "success");
      setSelectedIds([]);
      refetch();
    } catch (err: any) {
      showToast(`Failed to delete clients: ${err.message}`, "error");
    }
  };

  const handleExport = () => {
    if (!filteredData?.length) return;
    
    const exportData = selectedIds.length > 0
      ? filteredData.filter(c => selectedIds.includes(c.id))
      : filteredData;

    exportToCSV(
      exportData,
      `clients-${new Date().toISOString().split('T')[0]}`,
      [
        { key: "full_name", label: "Full Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "loyalty_points", label: "Loyalty Points" },
      ]
    );
    showToast(`Exported ${exportData.length} clients`, "success");
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilters({});
  };

  const filteredData = data?.filter((client) => {
    if (!debouncedSearch && !filters.tier) return true;
    
    const query = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || (
      client.full_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    );

    const matchesTier = !filters.tier || client.membership_tier === filters.tier;

    return matchesSearch && matchesTier;
  });

  const columns = [
    {
      id: "select",
      header: "",
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(prev => [...prev, row.original.id]);
            } else {
              setSelectedIds(prev => prev.filter(id => id !== row.original.id));
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4"
        />
      ),
    },
    { 
      accessorKey: "full_name", 
      header: "Full Name",
      sortable: true
    },
    { 
      accessorKey: "email", 
      header: "Email",
      sortable: true
    },
    { 
      accessorKey: "phone", 
      header: "Phone"
    },
    { 
      accessorKey: "loyalty_points", 
      header: "Loyalty Points",
      sortable: true,
      cell: ({ row }: any) => (
        <StatusBadge 
          status={`${row.original.loyalty_points || 0} pts`} 
          variant="info" 
        />
      )
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
              onClick: () => navigate(`/app/business-admin/clients/${row.original.id}`)
            },
            {
              label: "Edit",
              icon: "✏️",
              onClick: () => navigate(`/app/business-admin/clients/${row.original.id}/edit`)
            },
            {
              label: "Delete",
              icon: "🗑",
              variant: "danger",
              onClick: () => handleDelete(row.original.id, row.original.full_name)
            }
          ]}
        />
      ),
    },
  ];

  if (loading) return (
    <PageLayout title="Customers">
      <SkeletonTable rows={8} />
    </PageLayout>
  );
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
  
  if (!filteredData?.length && !searchQuery && !filters.tier) return (
    <EmptyState
      message="No Clients yet"
      action={{ label: "+ New Client", onClick: () => navigate("/app/business-admin/clients/create") }}
    />
  );

  return (
    <PageLayout
      title="Customers"
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
            fontFamily: "'DM Mono', monospace",
            transition: "all 140ms ease"
          }}
          onClick={() => navigate("/app/business-admin/clients/create")}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-accent-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-accent)";
          }}
        >
          + New Client
        </button>
      }
    >
      <BulkActions
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        onClear={() => setSelectedIds([])}
      />
      <Toolbar 
        search={
          <input 
            placeholder="Search customers…" 
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
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-600"
            >
              📥 Export
            </button>
            <FilterPanel
              filters={[
                {
                  key: "tier",
                  label: "Membership Tier",
                  type: "select",
                  options: [
                    { label: "Bronze", value: "bronze" },
                    { label: "Silver", value: "silver" },
                    { label: "Gold", value: "gold" },
                    { label: "Platinum", value: "platinum" },
                  ],
                },
              ]}
              values={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
          </div>
        }
      />
      
      {filteredData?.length === 0 && (debouncedSearch || filters.tier) ? (
        <div style={{ 
          padding: 32, 
          textAlign: "center", 
          color: "var(--color-text-muted)",
          fontSize: 14
        }}>
          No results for "{debouncedSearch}" {filters.tier && `with tier "${filters.tier}"`}
        </div>
      ) : (
        <DataTableEnhanced 
          columns={columns} 
          data={filteredData || []} 
          onRowClick={(row) => navigate(`/app/business-admin/clients/${row.id}`)} 
        />
      )}
    </PageLayout>
  );
}
