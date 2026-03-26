import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface BookingFormData {
  clientId: string;
  serviceId: string;
  staffId: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  notes: string;
  paymentMethod: "cash" | "card" | "bank_transfer";
  amount: number;
}

export function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    clientId: "",
    serviceId: "",
    staffId: "",
    bookingDate: "",
    bookingTime: "",
    duration: 60,
    notes: "",
    paymentMethod: "cash",
    amount: 0
  });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${id}`, {
          headers: {
            "X-Organization-Id": localStorage.getItem("kora_org_id") || "org_default"
          }
        });
        if (!response.ok) throw new Error("Failed to fetch booking");
        const booking = await response.json();
        setFormData(booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-Id": localStorage.getItem("kora_org_id") || "org_default"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to update booking");
      navigate(`/app/bookings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "24px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Edit Booking
        </h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Update booking details</p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            color: "var(--color-danger)",
            fontSize: "13px"
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Client *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-text-primary)",
                fontFamily: "inherit"
              }}
            >
              <option value="">Select a client</option>
              <option value="client_123">John Smith</option>
              <option value="client_456">Jane Doe</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Service *
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-text-primary)",
                fontFamily: "inherit"
              }}
            >
              <option value="">Select a service</option>
              <option value="svc_001">Hair Cut</option>
              <option value="svc_002">Massage</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Staff Member *
            </label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-text-primary)",
                fontFamily: "inherit"
              }}
            >
              <option value="">Select staff</option>
              <option value="staff_001">Alice Johnson</option>
              <option value="staff_002">Bob Williams</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                Date *
              </label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                Time *
              </label>
              <input
                type="time"
                value={formData.bookingTime}
                onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Duration (minutes) *
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              required
              min="15"
              step="15"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-text-primary)",
                fontFamily: "inherit"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special requests or notes..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-text-primary)",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit"
                }}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                Amount ($) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  color: "var(--color-text-primary)",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px"
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
              color: "var(--color-bg)",
              border: "none",
              borderRadius: "6px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "12px",
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? "Saving..." : "Update Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
