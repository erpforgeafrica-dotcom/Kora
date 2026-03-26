import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import api, { type DeliveryBooking } from "@/services/api";

const DELIVERY_PATH = "/api/delivery/bookings";

const columns = [
  {
    key: "customer_name",
    header: "Customer",
    cell: (row: DeliveryBooking) => row.customer_name || "-",
  },
  {
    key: "pickup_address",
    header: "Pickup",
    cell: (row: DeliveryBooking) => row.pickup_address.substring(0, 30) + "...",
  },
  {
    key: "dropoff_address",
    header: "Dropoff",
    cell: (row: DeliveryBooking) => row.dropoff_address.substring(0, 30) + "...",
  },
  {
    key: "status",
    header: "Status",
    cell: (row: DeliveryBooking) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.status === "delivered" ? "bg-green-500" :
        row.status === "in_transit" ? "bg-blue-500" :
        row.status === "picked_up" ? "bg-yellow-500" :
        "bg-gray-500"
      } text-white`}>
        {row.status}
      </span>
    ),
  },
  {
    key: "price_cents",
    header: "Price",
    cell: (row: DeliveryBooking) => `$${ (row.price_cents ?? 0) / 100 }`,
  },
];

export default function DeliveryBookingsPage() {
  const {
    data: bookings,
    loading,
    error,
    create,
    update,
    deleteItem,
    refetch
  } = useCrud<DeliveryBooking>(DELIVERY_PATH);

  const handleAssign = async (bookingId: string) => {
    try {
      await api.post(`/api/delivery/bookings/${bookingId}/assignments`, { agent_id: "auto" });
      refetch();
      console.info('Agent assigned');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await api.post(`/api/delivery/bookings/${bookingId}/status`, { status: newStatus });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageLayout title="Delivery Bookings" subtitle="Dispatch • Agents • Zones">
      <DataTable
        columns={columns}
        data={bookings ?? []}
        loading={loading}
        error={error}
        onDelete={deleteItem}
        onCreate={create}
        onUpdate={update}
        entityName="Delivery Booking"
        fields={[
          { name: "customer_name", label: "Customer Name" },
          { name: "pickup_address", label: "Pickup", required: true },
          { name: "dropoff_address", label: "Dropoff", required: true },
          { name: "pickup_at", label: "Pickup Time", type: "datetime" },
          { name: "price_cents", label: "Price (cents)", type: "number" },
        ]}
        bulkActions={[
          { label: "Dispatch Batch", onClick: () => {/* */} },
          { label: "Export Manifest", onClick: () => {/* */} },
        ]}
        pageSize={25}
        searchable={true}
        filterable={true}
        customActions={[
          {
            label: "Assign Agent",
            onClick: (row: DeliveryBooking) => handleAssign(row.id),
          },
          {
            label: "View Route",
            onClick: (row: DeliveryBooking) => {/* map modal */},
          },
        ]}
      />
      
      <div className="mt-8 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
        <h3 className="text-lg font-bold text-indigo-100 mb-2">Delivery Dashboard</h3>
        <p className="text-indigo-200">Real-time dispatch console with map, ETA, inventory check for meds/items.</p>
      </div>
    </PageLayout>
  );
}
