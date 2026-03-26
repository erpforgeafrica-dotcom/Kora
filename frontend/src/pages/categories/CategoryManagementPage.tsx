import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export function CategoryManagementPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", icon: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Failed to load categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", icon: "" });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description, icon: category.icon || "" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", icon: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error(`Failed to ${editingId ? "update" : "create"} category`);

      const newCategory = await response.json();
      if (editingId) {
        setCategories(categories.map(c => c.id === editingId ? newCategory : c));
      } else {
        setCategories([...categories, newCategory]);
      }

      handleCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-muted)" }}>
        Loading categories...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h1 style={{ fontSize: 28, color: "var(--color-text-primary)", margin: 0 }}>Service Categories</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>Manage service category system</p>
        </div>
        {!editingId && (
          <button
            onClick={handleAdd}
            style={{
              padding: "10px 20px",
              background: "var(--color-accent)",
              border: "none",
              borderRadius: 6,
              color: "#0c0e14",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            + New Category
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: 12,
          marginBottom: 24,
          background: "rgba(239, 68, 68, 0.06)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: 6,
          color: "var(--color-danger)",
          fontSize: 12
        }}>
          {error}
        </div>
      )}

      {editingId !== null && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24
        }}>
          <h3 style={{ color: "var(--color-text-primary)", margin: "0 0 16px 0", fontSize: 16 }}>
            {editingId ? "Edit Category" : "New Category"}
          </h3>
          <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Category Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit",
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit",
                  fontSize: 14,
                  minHeight: 80,
                  resize: "vertical"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Icon (emoji or icon name)
              </label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="e.g., 💆‍♀️ or spa"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit",
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  background: "var(--color-accent)",
                  border: "none",
                  borderRadius: 6,
                  color: "#0c0e14",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
              <th style={{ padding: "16px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 12 }}>
                Category
              </th>
              <th style={{ padding: "16px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 12 }}>
                Description
              </th>
              <th style={{ padding: "16px", textAlign: "right", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 12 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "16px", color: "var(--color-text-primary)" }}>
                  {category.icon && <span style={{ marginRight: 8 }}>{category.icon}</span>}
                  {category.name}
                </td>
                <td style={{ padding: "16px", color: "var(--color-text-muted)" }}>
                  {category.description}
                </td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <button
                    onClick={() => handleEdit(category)}
                    style={{
                      marginRight: 12,
                      padding: "6px 12px",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 4,
                      color: "var(--color-text-primary)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: 4,
                      color: "var(--color-danger)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
