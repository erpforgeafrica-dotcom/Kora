import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useCrud } from "@/hooks/useCrud";
import type { PaymentTransaction } from "@/types";

export default function PaymentTransactionsListPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useCrud<PaymentTransaction>("/api/payments/transactions");

  const columns = [
    { accessorKey: "booking_id", header: "Booking ID" },
    { accessorKey: "amount_cents", header: "Amount (cents)" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "payment_method", header: "Method" },
    { accessorKey: "created_at", header: "Created" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="text-xs text-teal-400 hover:underline" onClick={() => navigate(`/app/business-admin/payments/transactions/${row.original.id}`)}>
            View
          </button>
          <button className="text-xs text-amber-400 hover:underline" onClick={() => navigate(`/app/business-admin/payments/transactions/${row.original.id}/edit`)}>
            Edit
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!data?.length) {
    return <EmptyState message="No Payment Transactions yet" action={undefined} />;
  }

  return (
    <PageLayout title="Payment Transactions">
      <Toolbar search={<input placeholder="Search payment transactions…" className="px-3 py-1 rounded bg-slate-700 text-white text-sm" />} />
      <DataTable columns={columns} data={data || []} onRowClick={(row: any) => navigate(`/app/business-admin/payments/transactions/${row.id}`)} />
    </PageLayout>
  );
}
