import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import { InventoryItem } from "@/services/api";

const INVENTORY_PATH = "/api/inventory/items";

const columns = [
  {
    key: "name",
    header: "Name",
    cell: (row: InventoryItem) => row.name,
  },
  {
    key: "sku",
    header: "SKU",
    cell: (row: InventoryItem) => row.sku,
  },
  {
    key: "available_quantity",
    header: "Stock",
    cell: (row: InventoryItem) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        (row.available_quantity ?? 0) <= (row.reorder_threshold ?? 0) 
          ? "bg-red-500 text-white" 
          : "bg-green-500 text-white"
      }`}>
        {row.available_quantity ?? 0}
      </span>
    ),
  },
  {
    key: "reorder_threshold",
    header: "Reorder",
    cell: (row: InventoryItem) => row.reorder_threshold ?? 0,
  },
];

export default function InventoryItemsPage() {
  const {
    data: items,
    loading,
    error,
    create,
    deleteItem,
    refetch
  } = useCrud<InventoryItem>(INVENTORY_PATH);

  const handleCreate = async (formData: Omit<InventoryItem, "id">) => {
    try {
      const payload = {
        ...formData,
        cost_price_cents: formData.cost_price_cents === undefined || formData.cost_price_cents === null
          ? undefined
          : Math.round(Number(formData.cost_price_cents) * 100),
        sell_price_cents: formData.sell_price_cents === undefined || formData.sell_price_cents === null
          ? undefined
          : Math.round(Number(formData.sell_price_cents) * 100),
      };

      await create(payload);
      await refetch();
    } catch (err) {
      console.error("Create failed", err);
      throw err;
    }
  };

  return (
    <PageLayout title="Inventory Management" subtitle="Items • Stock • Movements">
      <DataTable
        columns={columns}
        data={items ?? []}
        loading={loading}
        error={error}
        onDelete={deleteItem}
        onCreate={handleCreate}
        entityName="Inventory Item"
        fields={[
          { name: "sku", label: "SKU", required: true },
          { name: "name", label: "Name", required: true },
          { name: "description", label: "Description" },
          { name: "uom", label: "UOM", default: "unit" },
          { name: "cost_price_cents", label: "Cost ($)", type: "number" },
          { name: "sell_price_cents", label: "Sell ($)", type: "number" },
          { name: "reorder_threshold", label: "Reorder Level", type: "number" },
        ]}
        bulkActions={[
          { label: "Export CSV", onClick: () => {/* */} },
          { label: "Bulk Update Prices", onClick: () => {/* */} },
        ]}
        pageSize={20}
        searchable={true}
        filterable={true}
      />
      
      <div className="mt-8 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
        <h3 className="text-lg font-bold text-orange-100 mb-2">Low Stock Alerts</h3>
        <p className="text-orange-200">Low stock items will appear here with reorder suggestions. Integrates with PO workflow.</p>
      </div>
    </PageLayout>
  );
}
