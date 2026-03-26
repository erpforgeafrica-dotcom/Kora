import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCrud } from "@/hooks/useCrud";
import type { Client } from "@/types";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteItem } = useCrud<Client>("/api/clients");
  const [client, setClient] = useState<Client | null>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/clients/${id}`)
      .then((res) => res.json())
      .then((data) => setClient(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);


  useEffect(() => {
    if (!id) return;
    setLoyaltyLoading(true);
    fetch(`/api/clients/${id}/loyalty`)
      .then((res) => res.json())
      .then((data) => setLoyalty(data))
      .catch((err) => console.error('Loyalty load error:', err))
      .finally(() => setLoyaltyLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm("Delete this client? This action cannot be undone.")) return;
    
    try {
      await deleteItem(id);
      navigate("/app/business-admin/clients");
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!client) return <div className="p-6">Client not found</div>;

  return (
    <PageLayout
      title={client.full_name}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            onClick={() => navigate(`/app/business-admin/clients/${id}/edit`)}
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
            Contact Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <DetailField label="Email" value={client.email} />
            <DetailField label="Phone" value={client.phone ?? undefined} />
            <DetailField label="Membership Tier" value={client.membership_tier ?? "—"} />
            <DetailField label="Telehealth Consent" value={client.telehealth_consent ? "Yes" : "No"} />
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 24
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-text-primary)" }}>
            Loyalty & Membership
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <DetailField label="Loyalty Points" value={client.loyalty_points?.toString() || "0"} />
            <DetailField label="Risk Score" value={client.risk_score !== undefined && client.risk_score !== null ? String(client.risk_score) : "—"} />
            <DetailField label="Member Since" value={client.created_at ? new Date(client.created_at).toLocaleDateString() : "—"} />
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 24
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
              Loyalty History
            </h2>
            {loyaltyLoading ? (
              <div style={{ width: 100, height: 16, background: "var(--color-surface-2)", borderRadius: 4 }} />
            ) : null}
          </div>
          {loyalty ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
              <DetailField label="Current Points" value={loyalty.points?.toString() || "0"} />
              <DetailField label="Tier" value={loyalty.tier} />
              {loyalty.redemption_history && loyalty.redemption_history.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Recent Transactions ({loyalty.redemption_history.length})
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {loyalty.redemption_history.slice(0, 5).map((tx: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{tx.description || tx.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: tx.points >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                          {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>
              No loyalty data available
            </div>
          )}
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
