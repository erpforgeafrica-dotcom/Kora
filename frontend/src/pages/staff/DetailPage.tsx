import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCrud } from "@/hooks/useCrud";

interface Staff {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  created_at?: string;
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteItem } = useCrud<Staff>("/api/staff");
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/staff/${id}`)
      .then((res) => res.json())
      .then((data) => setStaff(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm("Delete this staff member? This action cannot be undone.")) return;
    
    try {
      await deleteItem(id);
      navigate("/app/business-admin/staff");
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!staff) return <div className="p-6">Staff member not found</div>;

  return (
    <PageLayout
      title={staff.full_name || "Staff Member"}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            onClick={() => navigate(`/app/business-admin/staff/${id}/edit`)}
          >
            Edit
          </button>
          <button
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
            onClick={() => navigate(`/app/business-admin/staff/${id}/schedule`)}
          >
            Manage Schedule
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleDelete}
          >
            Delete
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
              Staff Information
            </h2>
            {staff.status && <StatusBadge status={staff.status} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <DetailField label="Email" value={staff.email} />
            <DetailField label="Phone" value={staff.phone} />
            <DetailField label="Role" value={staff.role} />
            <DetailField label="Joined" value={staff.created_at ? new Date(staff.created_at).toLocaleDateString() : undefined} />
          </div>
        </div>
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
