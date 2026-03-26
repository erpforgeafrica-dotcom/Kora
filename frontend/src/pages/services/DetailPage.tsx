import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Skeleton from "@/components/ui/Skeleton";
import { useCrud } from "@/hooks/useCrud";
import type { Service } from "@/types";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteItem } = useCrud<Service>("/api/services");
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/services/${id}`)
      .then((res) => res.json())
      .then((data) => setService(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm("Delete this service? This action cannot be undone.")) return;
    
    try {
      await deleteItem(id);
      navigate("/app/business-admin/services");
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!service) return <div className="p-6">Service not found</div>;

  return (
    <PageLayout
      title={service.name || "Service"}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            onClick={() => navigate(`/app/business-admin/services/${id}/edit`)}
          >
            Edit
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
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-text-primary)" }}>
            Service Details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <DetailField label="Duration" value={service.duration_minutes ? `${service.duration_minutes} minutes` : undefined} />
            <DetailField 
              label="Price" 
              value={
                service.price_cents !== undefined
                  ? `${service.currency || "GBP"} ${(Number(service.price_cents) / 100).toFixed(2)}`
                  : undefined
              }
            />
            <DetailField label="Category ID" value={service.category_id} />
            <DetailField label="Created" value={service.created_at ? new Date(service.created_at).toLocaleDateString() : undefined} />
          </div>
        </div>

        {service.description && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 24
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-text-primary)" }}>
              Description
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              {service.description}
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
