import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function EditStaffPage() {
  const navigate = useNavigate();
  const { staffId } = useParams<{ staffId: string }>();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    specialization: "",
    qualifications: "",
    availability: "mon,tue,wed,thu,fri"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/staff/${staffId}`);
        if (!response.ok) throw new Error("Failed to load staff member");
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (staffId) fetchStaff();
  }, [staffId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day: string) => {
    const days = formData.availability.split(",");
    const idx = days.indexOf(day);
    if (idx > -1) days.splice(idx, 1);
    else days.push(day);
    setFormData(prev => ({ ...prev, availability: days.join(",") }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to update staff member");
      navigate("/app/business-admin/staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-muted)" }}>
        Loading staff member...
      </div>
    );
  }

  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const selectedDays = formData.availability.split(",");

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: "var(--color-text-primary)", margin: 0 }}>Edit Staff Member</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>Update staff information and availability</p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 24,
        display: "grid",
        gap: 16
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
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
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
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
            >
              <option value="">Select a role</option>
              <option value="therapist">Therapist</option>
              <option value="consultant">Consultant</option>
              <option value="technician">Technician</option>
              <option value="specialist">Specialist</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
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
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
            Qualifications
          </label>
          <textarea
            name="qualifications"
            value={formData.qualifications}
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
          <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
            Available Days
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {days.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  padding: "10px 8px",
                  background: selectedDays.includes(day) ? "var(--color-accent)" : "var(--color-surface-2)",
                  border: `1px solid ${selectedDays.includes(day) ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: 6,
                  color: selectedDays.includes(day) ? "#0c0e14" : "var(--color-text-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                  transition: "all 200ms"
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: 12,
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 6,
            color: "var(--color-danger)",
            fontSize: 12
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
