import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  staffId: string;
}

export function AvailabilitySettingsPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff");
        if (!response.ok) throw new Error("Failed to load staff");
        const data = await response.json();
        setStaff(data);
        if (data.length > 0) {
          setSelectedStaff(data[0].id);
          fetchAvailability(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const fetchAvailability = async (staffId: string) => {
    try {
      const response = await fetch(`/api/availability/${staffId}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    }
  };

  const handleStaffChange = (staffId: string) => {
    setSelectedStaff(staffId);
    fetchAvailability(staffId);
  };

  const addSlot = () => {
    setSlots([
      ...slots,
      { day: "Monday", startTime: "09:00", endTime: "17:00", staffId: selectedStaff }
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/availability/${selectedStaff}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots)
      });

      if (!response.ok) throw new Error("Failed to save availability");
      navigate("/app/business-admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-muted)" }}>
        Loading availability settings...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: "var(--color-text-primary)", margin: 0 }}>Availability Settings</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>Manage staff member schedules</p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 24,
        display: "grid",
        gap: 20
      }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Select Staff Member
          </label>
          <select
            value={selectedStaff}
            onChange={(e) => handleStaffChange(e.target.value)}
            style={{
              padding: "10px 12px",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              color: "var(--color-text-primary)",
              fontFamily: "inherit",
              fontSize: 14
            }}
          >
            {staff.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ color: "var(--color-text-primary)", fontSize: 16, margin: 0 }}>Time Slots</h3>
            <button
              type="button"
              onClick={addSlot}
              style={{
                padding: "8px 16px",
                background: "var(--color-accent)",
                border: "none",
                borderRadius: 6,
                color: "#0c0e14",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              + Add Slot
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {slots.map((slot, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  padding: 16,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: 12,
                  alignItems: "end"
                }}
              >
                <div>
                  <label style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
                    Day
                  </label>
                  <select
                    value={slot.day}
                    onChange={(e) => updateSlot(idx, "day", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 4,
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                      fontFamily: "inherit"
                    }}
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(idx, "startTime", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 4,
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                      fontFamily: "inherit"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 4,
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                      fontFamily: "inherit"
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 4,
                    color: "var(--color-danger)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              </div>
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
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
