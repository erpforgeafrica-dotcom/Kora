import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import api from "@/services/api";
import { CrmLead } from "@/services/api";

const CRM_PATH = "/api/crm/leads";

const columns = [
  {
    key: "full_name",
    header: "Name",
    cell: (row: CrmLead) => row.full_name,
  },
  {
    key: "status",
    header: "Status",
    cell: (row: CrmLead) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.status === "qualified" ? "bg-green-500" :
        row.status === "converted" ? "bg-blue-500" :
        row.status === "new" ? "bg-gray-500" : "bg-yellow-500"
      } text-white`}>
        {row.status}
      </span>
    ),
  },
  {
    key: "score",
    header: "Score",
    cell: (row: CrmLead) => row.score ?? "N/A",
  },
  {
    key: "email",
    header: "Email",
    cell: (row: CrmLead) => row.email ?? "-",
  },
];

export default function LeadsListPage() {
  const {
    data: leads,
    loading,
    error,
    create,
    update,
    deleteItem,
    refetch
  } = useCrud<CrmLead>(CRM_PATH);

  const handleQualify = async (leadId: string, score: number) => {
    try {
      await api.post(`/api/crm/leads/${leadId}/qualify`, { score });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageLayout title="CRM Leads" subtitle="Pipeline • Activities • Deals">
      <DataTable
        columns={columns}
        data={leads ?? []}
        loading={loading}
        error={error}
        onDelete={deleteItem}
        onCreate={create}
        onUpdate={update}
        entityName="Lead"
        fields={[
          { name: "full_name", label: "Name", required: true },
          { name: "email", label: "Email" },
          { name: "phone", label: "Phone" },
          { name: "source", label: "Source" },
          { name: "score", label: "Score", type: "number" },
        ]}
        bulkActions={[
          { label: "Export Pipeline", onClick: () => {/* */} },
          { label: "Bulk Qualify", onClick: () => {/* */} },
        ]}
        pageSize={25}
        searchable={true}
        filterable={true}
        customActions={[
          {
            label: "Qualify",
            onClick: (row: CrmLead) => handleQualify(row.id, 75),
          },
          {
            label: "Convert",
            onClick: (row: CrmLead) => window.location.href = `/crm/leads/${row.id}/convert`,
          },
        ]}
      />
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-bold text-blue-100">New Leads</h4>
          <p className="text-2xl font-bold text-blue-200">{leads?.filter(l => l.status === "new").length || 0}</p>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h4 className="font-bold text-green-100">Qualified</h4>
          <p className="text-2xl font-bold text-green-200">{leads?.filter(l => l.status === "qualified").length || 0}</p>
        </div>
      </div>
    </PageLayout>
  );
}
