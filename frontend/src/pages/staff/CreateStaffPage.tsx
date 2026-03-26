import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateStaffPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "staff",
    specializations: [] as string[],
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        navigate("/app/staff");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 28, color: "var(--color-text-primary)", marginBottom: 20 }}>Create Staff Member</h1>
        <form onSubmit={handleSubmit} style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          display: "grid",
          gap: 16
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: 4,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: 4,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: 4,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: 4,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginTop: 4,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                color: "var(--color-text-primary)",
                fontSize: 14,
                fontFamily: "inherit"
              }}
            >
              <option value="staff">Staff</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <label style={{ fontSize: 13, color: "var(--color-text-muted)", cursor: "pointer" }}>
              Staff member is active
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
            <button
              type="button"
              onClick={() => navigate("/app/staff")}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                color: "var(--color-text-muted)",
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
              {loading ? "Creating..." : "Create Staff Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
