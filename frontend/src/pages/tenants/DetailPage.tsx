import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { getTenant, getTenantSubscription, updateTenantStatus, type SubscriptionRecord, type TenantRecord } from "@/services/platformAdmin";

export default function TenantDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTenant(id), getTenantSubscription(id)])
      .then(([tenantRecord, subscriptionRecord]) => {
        setTenant(tenantRecord);
        setSubscription(subscriptionRecord);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load tenant"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(status: string) {
    if (!id) return;
    try {
      const updated = await updateTenantStatus(id, status);
      setTenant(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update tenant status");
    }
  }

  if (loading) return <Skeleton rows={6} />;
  if (error || !tenant) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error ?? "Tenant not found"}</div>;

  return (
    <PageLayout
      title={tenant.name}
      subtitle="Tenant lifecycle, persisted schema, and linked subscription state."
      actions={
        <div style={{ display: "flex", gap: 10 }}>
          <button className="px-4 py-2 bg-slate-700 text-white rounded" onClick={() => navigate(`/app/kora-admin/tenants/${tenant.id}/edit`)}>
            Edit
          </button>
          <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => void handleStatusChange(tenant.status === "suspended" ? "active" : "suspended")}>
            {tenant.status === "suspended" ? "Activate" : "Suspend"}
          </button>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div className="p-5 rounded-xl border border-slate-700 bg-slate-800">
          <div className="text-xs text-slate-400 uppercase tracking-[0.08em]">Tenant Record</div>
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-slate-200">
            <div>
              <div className="text-slate-400">Name</div>
              <div className="mt-1">{tenant.name}</div>
            </div>
            <div>
              <div className="text-slate-400">Industry</div>
              <div className="mt-1">{tenant.industry || "Not set"}</div>
            </div>
            <div>
              <div className="text-slate-400">Status</div>
              <div className="mt-1"><StatusBadge status={tenant.status} /></div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-700 bg-slate-800">
          <div className="text-xs text-slate-400 uppercase tracking-[0.08em]">Linked Subscription</div>
          {subscription ? (
            <div className="mt-4 grid md:grid-cols-4 gap-4 text-sm text-slate-200">
              <div>
                <div className="text-slate-400">Plan</div>
                <div className="mt-1">{subscription.plan}</div>
              </div>
              <div>
                <div className="text-slate-400">Status</div>
                <div className="mt-1"><StatusBadge status={subscription.status} /></div>
              </div>
              <div>
                <div className="text-slate-400">Period Start</div>
                <div className="mt-1">{new Date(subscription.current_period_start).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Period End</div>
                <div className="mt-1">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleString() : "Open-ended"}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-400">No subscription is currently linked to this tenant.</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
