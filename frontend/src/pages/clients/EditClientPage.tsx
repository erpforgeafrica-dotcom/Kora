import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function EditClientPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    membershipTier: "standard"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/clients/:id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        navigate("/app/clients");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 28, color: "var(--color-text-primary)", marginBottom: 20 }}>Edit Client</h1>
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

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
            <button
              type="button"
              onClick={() => navigate("/app/clients")}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
