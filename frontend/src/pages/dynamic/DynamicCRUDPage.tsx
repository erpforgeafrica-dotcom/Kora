import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { DynamicList } from "../../components/dynamic/DynamicList";
import { DynamicForm } from "../../components/dynamic/DynamicForm";

interface DynamicCRUDPageProps {
  entity: string;
}

export function DynamicCRUDPage({ entity }: DynamicCRUDPageProps) {
  const { organizationId } = useAuth();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);

  const handleCreate = async (data: Record<string, any>) => {
    await fetch(`/api/${entity}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": organizationId || ""
      },
      body: JSON.stringify(data)
    });
    setView("list");
  };

  const handleEdit = async (data: Record<string, any>) => {
    await fetch(`/api/${entity}/${selectedId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": organizationId || ""
      },
      body: JSON.stringify(data)
    });
    setView("list");
  };

  const handleEditClick = async (id: string) => {
    const res = await fetch(`/api/${entity}/${id}`, {
      headers: { "x-org-id": organizationId || "" }
    });
    const data = await res.json();
    setSelectedId(id);
    setSelectedData(data);
    setView("edit");
  };

  return (
    <>
      {view === "list" && (
        <DynamicList
          entity={entity}
          onCreate={() => setView("create")}
          onEdit={handleEditClick}
          onDelete={(id) => console.log("Delete", id)}
        />
      )}

      {view === "create" && (
        <DynamicForm
          entity={entity}
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => setView("list")}
        />
      )}

      {view === "edit" && selectedId && (
        <DynamicForm
          entity={entity}
          mode="edit"
          initialData={selectedData}
          onSubmit={handleEdit}
          onCancel={() => setView("list")}
        />
      )}
    </>
  );
}
