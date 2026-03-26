import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useCrud } from "@/hooks/useCrud";
import type { Client } from "@/types";

export default function CustomersListPage() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem } = useCrud<Client>("/api/clients");

  const columns = [
    { accessorKey: "full_name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "dob", header: "Date of birth" },
    { accessorKey: "loyalty_points", header: "Loyalty points" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="text-xs text-teal-400 hover:underline" onClick={() => navigate(`/api/clients/${row.original.id}`)}>
            View
          </button>
          <button className="text-xs text-amber-400 hover:underline" onClick={() => navigate(`/api/clients/${row.original.id}/edit`)}>
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
      message="No Clients yet"
      action={{ label: "+ New Client", onClick: () => navigate("/api/clients/new") }}
    />
  );

  return (
    <PageLayout
      title="Customers"
      actions={
        <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => navigate("/api/clients/new")}>
          + New Client
        </button>
      }
    >
      <Toolbar search={<input placeholder="Search customers…" className="px-3 py-1 rounded bg-slate-700 text-white text-sm" />} />
      <DataTable columns={columns} data={data || []} onRowClick={(row) => navigate(`/api/clients/${row.id}`)} />
    </PageLayout>
  );
}
