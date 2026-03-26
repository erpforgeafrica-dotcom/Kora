import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface DynamicListProps {
  entity: string;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DynamicList({ entity, onCreate, onEdit, onDelete }: DynamicListProps) {
  const { organizationId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadSchema();
  }, [entity]);

  const loadSchema = async () => {
    const res = await fetch(`/api/schema/tables/${entity}`);
    const schema = await res.json();
    setSchema(schema);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${entity}`, {
        headers: { "x-org-id": organizationId || "" }
      });
      const json = await res.json();
      setData(json[entity] || json.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    
    await fetch(`/api/${entity}/${id}`, {
      method: "DELETE",
      headers: { "x-org-id": organizationId || "" }
    });
    loadData();
  };

  if (loading || !schema) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  const listColumns = schema.list?.columns || schema.columns.slice(0, 5).map((c: any) => c.name);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: "var(--color-text-primary)" }}>{schema.label}</h1>
        {schema.actions?.create && (
          <button
            onClick={onCreate}
            style={{
              padding: "10px 20px",
              background: "var(--color-accent)",
              color: "var(--color-bg)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Create {schema.label.slice(0, -1)}
          </button>
        )}
      </div>

      <div style={{ background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
              {listColumns.map((col: string) => (
                <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                  {col.replace(/_/g, " ")}
                </th>
              ))}
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                {listColumns.map((col: string) => (
                  <td key={col} style={{ padding: "12px 16px", fontSize: 14, color: "var(--color-text-primary)" }}>
                    {row[col] || "-"}
                  </td>
                ))}
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {schema.actions?.edit && (
                      <button
                        onClick={() => onEdit(row.id)}
                        style={{
                          padding: "6px 12px",
                          background: "transparent",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                          color: "var(--color-text-primary)",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {schema.actions?.delete && onDelete && (
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{
                          padding: "6px 12px",
                          background: "transparent",
                          border: "1px solid var(--color-danger)",
                          borderRadius: 4,
                          color: "var(--color-danger)",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
