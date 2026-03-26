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
import type { Booking } from "@/types";
import { useState } from "react";

export default function BookingsListPageEnhanced() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem, refetch } = useCrud<Booking>("/api/bookings");
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this booking?")) return;
    
    try {
      // Backend "delete" is a soft-cancel (sets status=cancelled)
      await deleteItem(id);
      showToast("Booking cancelled successfully", "success");
    } catch (err: any) {
      showToast(`Failed to cancel: ${err.message}`, "error");
    }
  };

  const filteredData = data?.filter((booking) => {
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.client_name?.toLowerCase().includes(query) ||
      booking.service_name?.toLowerCase().includes(query) ||
      booking.staff_name?.toLowerCase().includes(query) ||
      booking.client_id?.toLowerCase().includes(query) ||
      booking.service_id?.toLowerCase().includes(query) ||
      booking.staff_id?.toLowerCase().includes(query) ||
      booking.staff_member_id?.toLowerCase().includes(query)
    );
  });

  const columns = [
    { 
      accessorKey: "client_name", 
      header: "Customer",
      sortable: true
      ,
      cell: ({ row }: any) => row.original.client_name || row.original.client_id
    },
    { 
      accessorKey: "service_name", 
      header: "Service",
      sortable: true
      ,
      cell: ({ row }: any) => row.original.service_name || row.original.service_id
    },
    { 
      accessorKey: "staff_name", 
      header: "Staff"
      ,
      cell: ({ row }: any) => row.original.staff_name || row.original.staff_id || row.original.staff_member_id || "—"
    },
    { 
      accessorKey: "start_time", 
      header: "Start Time",
      sortable: true,
      cell: ({ row }: any) => new Date(row.original.start_time).toLocaleString()
    },
    { 
      accessorKey: "status", 
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.status || "pending"} />
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
              onClick: () => navigate(`/app/business-admin/bookings/${row.original.id}`)
            },
            {
              label: "Edit",
              icon: "✏️",
              onClick: () => navigate(`/app/business-admin/bookings/${row.original.id}/edit`)
            },
            {
              label: "Cancel Booking",
              icon: "❌",
              variant: "danger",
              onClick: () => handleCancel(row.original.id)
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
  
  if (!filteredData?.length && !searchQuery && statusFilter === "all") return (
    <EmptyState
      message="No Bookings yet"
      action={{ label: "+ New Booking", onClick: () => navigate("/app/business-admin/bookings/create") }}
    />
  );

  return (
    <PageLayout
      title="Bookings"
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
          onClick={() => navigate("/app/business-admin/bookings/create")}
        >
          + New Booking
        </button>
      }
    >
      <Toolbar 
        search={
          <div style={{ display: "flex", gap: 12 }}>
            <input 
              placeholder="Search bookings…" 
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                color: "var(--color-text-primary)",
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer"
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        } 
      />
      
      {filteredData?.length === 0 ? (
        <div style={{ 
          padding: 32, 
          textAlign: "center", 
          color: "var(--color-text-muted)",
          fontSize: 14
        }}>
          No bookings found
        </div>
      ) : (
        <DataTableEnhanced 
          columns={columns} 
          data={filteredData || []} 
          onRowClick={(row) => navigate(`/app/business-admin/bookings/${row.id}`)} 
        />
      )}
    </PageLayout>
  );
}
