import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";

interface Appointment {
  id: string;
  service_name: string;
  client_name: string;
  start_time: string;
  status: string;
}

export default function TodayJobsPage() {
  const { data, loading, error } = useCrud<Appointment>("/api/appointments?staffId=me&date=today");

  if (loading) return <Skeleton rows={5} />;
  if (error) return <div className="p-6 text-amber-400">Error: {error}</div>;

  return (
    <PageLayout title="Today's Jobs">
      {!data?.length ? (
        <div className="p-6 text-center text-gray-400">No appointments today</div>
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
