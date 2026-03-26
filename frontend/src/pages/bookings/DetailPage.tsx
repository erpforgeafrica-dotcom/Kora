import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCrud } from "@/hooks/useCrud";
import type { Booking } from "@/types";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteItem } = useCrud<Booking>("/api/bookings");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/bookings/${id}`)
      .then((res) => res.json())
      .then((data) => setBooking(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    const reason = window.prompt("Cancellation reason (optional):");
    if (!id || !window.confirm("Cancel this booking?")) return;
    
    try {
      await fetch(`/api/bookings/${id}/cancel`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || null })
      });
      navigate("/app/business-admin/bookings");
    } catch (err: any) {
      alert(`Failed to cancel: ${err.message}`);
    }
  };

  const handleAssignStaff = async () => {
    const staffId = window.prompt("Staff ID to assign:");
    if (!staffId || !id) return;
    
    try {
      await fetch(`/api/bookings/${id}/assign-staff/${staffId}`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_type: "primary" })
      });
      alert("Staff assigned successfully");
      // Reload booking
      window.location.reload();
    } catch (err: any) {
      alert(`Failed to assign staff: ${err.message}`);
    }
  };

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!booking) return <div className="p-6">Booking not found</div>;

  return (
    <PageLayout
      title={`Booking #${booking.id?.slice(0, 8)}`}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            onClick={() => navigate(`/app/business-admin/bookings/${id}/edit`)}
          >
            Edit
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleAssignStaff}
          >
            Assign Staff
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleCancel}
          >
            Cancel Booking
          </button>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 20 }}>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 24
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
              Booking Details
            </h2>
            <StatusBadge status={booking.status || "pending"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <DetailField label="Client ID" value={booking.client_id} />
            <DetailField label="Service ID" value={booking.service_id} />
            <DetailField label="Staff ID" value={booking.staff_id} />
            <DetailField label="Start Time" value={new Date(booking.start_time || "").toLocaleString()} />
            <DetailField label="End Time" value={new Date(booking.end_time || "").toLocaleString()} />
          </div>
        </div>

        {booking.notes && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 24
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-text-primary)" }}>
              Notes
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              {booking.notes}
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontFamily: "'DM Mono', monospace" }}>
        {value || "—"}
      </div>
    </div>
  );
}
