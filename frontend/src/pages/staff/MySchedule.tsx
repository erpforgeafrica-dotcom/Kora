// Phase 3: Staff Dashboard - MySchedule
import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface Appointment {
  id: string;
  booking_id: string;
  start_time: string;
  end_time: string;
  service_name: string;
  client_name: string;
  status: string;
}

export default function MySchedulePage() {
  const { data, loading, error } = useCrud<Appointment>("/api/appointments?staffId=me&view=week");

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400">Error: {error}</div>;

  return (
    <PageLayout title="My Schedule">
      {!data?.length ? (
        <EmptyState message="No appointments scheduled" />
      ) : (
        <DataTable
          columns={[
            { accessorKey: "start_time", header: "Time" },
            { accessorKey: "service_name", header: "Service" },
            { accessorKey: "client_name", header: "Client" },
            { accessorKey: "status", header: "Status" },
          ]}
          data={data}
        />
      )}
    </PageLayout>
  );
}
