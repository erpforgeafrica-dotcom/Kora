import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import { getTenants, updateTenantStatus, type TenantRecord } from "@/services/platformAdmin";

export default function TenantsListPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTenants()
      .then((rows) => setTenants(rows))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load tenants"))
      .finally(() => setLoading(false));
  }, []);

  const filteredTenants = useMemo(() => {
    if (!searchQuery) return tenants;
    const query = searchQuery.toLowerCase();
    return tenants.filter((tenant) =>
      [tenant.name, tenant.industry ?? "", tenant.status].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, tenants]);

  async function handleStatusChange(id: string, status: string) {
    try {
      const updated = await updateTenantStatus(id, status);
      setTenants((prev) => prev.map((tenant) => (tenant.id === id ? updated : tenant)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update tenant status");
    }
  }

  const columns = [
    { accessorKey: "name", header: "Tenant Name", sortable: true },
    { accessorKey: "industry", header: "Industry", sortable: true },
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
              label: "View Tenant",
              icon: "👁",
              onClick: () => navigate(`/app/kora-admin/tenants/${row.original.id}`)
            },
            {
              label: "Edit Tenant",
              icon: "✏️",
              onClick: () => navigate(`/app/kora-admin/tenants/${row.original.id}/edit`)
            },
            {
              label: row.original.status === "suspended" ? "Activate" : "Suspend",
              icon: row.original.status === "suspended" ? "✅" : "⛔",
              onClick: () => void handleStatusChange(row.original.id, row.original.status === "suspended" ? "active" : "suspended")
            }
          ]}
        />
      )
    }
  ];

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;

  return (
    <PageLayout
      title="Tenants"
      subtitle="Platform-managed organizations with live status and subscription linkage."
      actions={
        <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => navigate("/app/kora-admin/tenants/create")}>
          + New Tenant
        </button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Search tenants…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="px-3 py-2 rounded bg-slate-700 text-white text-sm"
        />
      </div>
      <DataTableEnhanced columns={columns} data={filteredTenants} onRowClick={(row) => navigate(`/app/kora-admin/tenants/${row.id}`)} />
    </PageLayout>
  );
}
