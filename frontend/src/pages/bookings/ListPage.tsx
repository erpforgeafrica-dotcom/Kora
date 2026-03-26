import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useCrud } from "@/hooks/useCrud";
import type { Booking } from "@/types";

export default function BookingsListPage() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem } = useCrud<Booking>("/api/bookings");

  const columns = [
    { accessorKey: "client_id", header: "Customer" },
    { accessorKey: "service_id", header: "Service" },
    { accessorKey: "staff_id", header: "Staff" },
    { accessorKey: "start_time", header: "Start time" },
    { accessorKey: "end_time", header: "End time" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "notes", header: "Notes" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="text-xs text-teal-400 hover:underline" onClick={() => navigate(`/api/bookings/${row.original.id}`)}>
            View
          </button>
          <button className="text-xs text-amber-400 hover:underline" onClick={() => navigate(`/api/bookings/${row.original.id}/edit`)}>
            Edit
          </button>
          <button className="text-xs text-red-400 hover:underline" onClick={() => { if (window.confirm("Delete this item?")) deleteItem(row.original.id); }}>Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!data?.length) return (
    <EmptyState
      message="No Bookings yet"
      action={{ label: "+ New Booking", onClick: () => navigate("/api/bookings/new") }}
    />
  );

  return (
    <PageLayout
      title="Bookings"
      actions={
        <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => navigate("/api/bookings/new")}>
          + New Booking
        </button>
      }
    >
      <Toolbar search={<input placeholder="Search bookings…" className="px-3 py-1 rounded bg-slate-700 text-white text-sm" />} />
      <DataTable columns={columns} data={data || []} onRowClick={(row) => navigate(`/api/bookings/${row.id}`)} />
    </PageLayout>
  );
}
