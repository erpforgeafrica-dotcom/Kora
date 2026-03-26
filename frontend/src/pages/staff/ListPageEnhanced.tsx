import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import { useState } from "react";

interface Staff {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export default function StaffListPageEnhanced() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem, refetch } = useCrud<Staff>("/api/staff");
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

  const filteredData = data?.filter((staff) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      staff.full_name?.toLowerCase().includes(query) ||
      staff.email?.toLowerCase().includes(query) ||
      staff.phone?.toLowerCase().includes(query) ||
      staff.role?.toLowerCase().includes(query)
    );
  });

  const columns = [
    { 
      accessorKey: "full_name", 
      header: "Name",
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
      accessorKey: "role", 
      header: "Role",
      sortable: true
    },
    { 
      accessorKey: "status", 
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.status || "active"} />
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
              onClick: () => navigate(`/app/business-admin/staff/${row.original.id}`)
            },
            {
              label: "Edit",
              icon: "✏️",
              onClick: () => navigate(`/app/business-admin/staff/${row.original.id}/edit`)
            },
            {
              label: "Manage Schedule",
              icon: "📅",
              onClick: () => navigate(`/app/business-admin/staff/${row.original.id}/schedule`)
            },
            {
              label: "Delete",
              icon: "🗑",
              variant: "danger",
              onClick: () => handleDelete(row.original.id, row.original.full_name || "Staff")
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
      message="No Staff yet"
      action={{ label: "+ New Staff", onClick: () => navigate("/app/business-admin/staff/create") }}
    />
  );

  return (
    <PageLayout
      title="Staff Management"
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
          onClick={() => navigate("/app/business-admin/staff/create")}
        >
          + New Staff
        </button>
      }
    >
      <Toolbar 
        search={
          <input 
            placeholder="Search staff…" 
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
          onRowClick={(row) => navigate(`/app/business-admin/staff/${row.id}`)} 
        />
      )}
    </PageLayout>
  );
}
