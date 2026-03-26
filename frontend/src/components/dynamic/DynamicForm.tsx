import { useState, useEffect } from "react";
import { DynamicField } from "./DynamicField";
import { TableSchema } from "../../types/schema";

interface DynamicFormProps {
  entity: string;
  mode: "create" | "edit";
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
}

export function DynamicForm({ entity, mode, initialData, onSubmit, onCancel }: DynamicFormProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/schema/tables/${entity}`)
      .then(res => res.json())
      .then(setSchema)
      .catch(err => console.error("Failed to load schema:", err));
  }, [entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setErrors({ _form: err.message || "Failed to save" });
    } finally {
      setLoading(false);
    }
  };

  if (!schema) {
    return <div style={{ padding: 24 }}>Loading form...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24, color: "var(--color-text-primary)" }}>
        {mode === "create" ? `Create ${schema.label}` : `Edit ${schema.label}`}
      </h1>

      <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", padding: 24, borderRadius: 12, border: "1px solid var(--color-border)" }}>
        {errors._form && (
          <div style={{ padding: 12, marginBottom: 16, background: "rgba(239,68,68,0.1)", border: "1px solid var(--color-danger)", borderRadius: 6, color: "var(--color-danger)", fontSize: 13 }}>
            {errors._form}
          </div>
        )}

        {schema.columns.map(column => (
          <DynamicField
            key={column.name}
            column={column}
            value={formData[column.name]}
            onChange={(value) => setFormData({ ...formData, [column.name]: value })}
            error={errors[column.name]}
          />
        ))}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              color: "var(--color-text-primary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "var(--color-accent)",
              border: "none",
              borderRadius: 6,
              color: "var(--color-bg)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
