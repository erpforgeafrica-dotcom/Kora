import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import { getSubscriptions, type SubscriptionRecord } from "@/services/platformAdmin";

export default function SubscriptionsListPage() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptions()
      .then((rows) => setSubscriptions(rows))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load subscriptions"))
      .finally(() => setLoading(false));
  }, []);

  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery) return subscriptions;
    const query = searchQuery.toLowerCase();
    return subscriptions.filter((subscription) =>
      [subscription.organization_id, subscription.plan, subscription.status].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, subscriptions]);

  const columns = [
    { accessorKey: "organization_id", header: "Organization", sortable: true },
    { accessorKey: "plan", header: "Plan", sortable: true },
    {
      accessorKey: "status",
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />
    },
    {
      accessorKey: "current_period_start",
      header: "Period Start",
      sortable: true,
      cell: ({ row }: any) => new Date(row.original.current_period_start).toLocaleDateString()
    },
    {
      accessorKey: "current_period_end",
      header: "Period End",
      sortable: true,
      cell: ({ row }: any) => row.original.current_period_end ? new Date(row.original.current_period_end).toLocaleDateString() : "Open-ended"
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <ActionMenu
          items={[
            {
              label: "Edit Subscription",
              icon: "✏️",
              onClick: () => navigate(`/app/kora-admin/subscriptions/${row.original.id}/edit`)
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
      title="Subscriptions"
      subtitle="Real subscription records returned by the platform subscriptions module."
      actions={
        <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => navigate("/app/kora-admin/subscriptions/create")}>
          + New Subscription
        </button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Search subscriptions…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="px-3 py-2 rounded bg-slate-700 text-white text-sm"
        />
      </div>
      <DataTableEnhanced columns={columns} data={filteredSubscriptions} />
    </PageLayout>
  );
}
