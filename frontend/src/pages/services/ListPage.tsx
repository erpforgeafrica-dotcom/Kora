import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useCrud } from "@/hooks/useCrud";
import type { Service } from "@/types";

export default function ServicesListPage() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem } = useCrud<Service>("/api/services");

  const columns = [
    { accessorKey: "name", header: "Service name" },
    { accessorKey: "category_id", header: "Category" },
    { accessorKey: "service_type", header: "Type" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "duration_minutes", header: "Duration (min)" },
    { accessorKey: "price_cents", header: "Price (cents)" },
    { accessorKey: "requires_staff", header: "Requires staff" },
    { accessorKey: "requires_room", header: "Requires room" },
    { accessorKey: "active", header: "Active" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="text-xs text-teal-400 hover:underline" onClick={() => navigate(`/api/services/${row.original.id}`)}>
            View
          </button>
          <button className="text-xs text-amber-400 hover:underline" onClick={() => navigate(`/api/services/${row.original.id}/edit`)}>
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
      message="No Services yet"
      action={{ label: "+ New Service", onClick: () => navigate("/api/services/new") }}
    />
  );

  return (
    <PageLayout
      title="Services"
      actions={
        <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => navigate("/api/services/new")}>
          + New Service
        </button>
      }
    >
      <Toolbar search={<input placeholder="Search services…" className="px-3 py-1 rounded bg-slate-700 text-white text-sm" />} />
      <DataTable columns={columns} data={data || []} onRowClick={(row) => navigate(`/api/services/${row.id}`)} />
    </PageLayout>
  );
}
