import { useEffect, useState } from 'react';
import PageLayout from '@/components/ui/PageLayout';
import { KpiCard, DashboardPanel } from '@/components/dashboard/DashboardPrimitives';
import { OperationsMetric } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';

export default function OperationsOverviewPage() {
  const [metrics, setMetrics] = useState<OperationsMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/operations/metrics')
      .then(res => res.json())
      .then((data: OperationsMetric) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback mock data
        setMetrics({
          active_deliveries: 14,
          queue_depth: 3,
          agent_available: 7,
          incidents: 1,
          avg_dispatch_time: 4.2,
          on_time_rate: 96.8,
          updated_at: new Date().toISOString()
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <Skeleton rows={8} />;

  return (
    <PageLayout title="Operations Overview" subtitle="Real-time signals • Dispatch • Capacity">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <KpiCard label="Active Deliveries" value={metrics?.active_deliveries?.toString() || '—'} tone="var(--color-accent)" />
        <KpiCard label="Queue Depth" value={metrics?.queue_depth?.toString() || '—'} tone="var(--color-warning)" />
        <KpiCard label="Agents Available" value={metrics?.agent_available?.toString() || '—'} tone="var(--color-success)" />
        <KpiCard label="Incidents" value={metrics?.incidents?.toString() || '—'} tone="var(--color-danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <DashboardPanel title="Performance Signals" meta={metrics?.updated_at ? new Date(metrics.updated_at).toLocaleTimeString() : '—'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{metrics?.avg_dispatch_time?.toFixed(1) || '—'} min</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Avg dispatch time</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{metrics?.on_time_rate?.toFixed(1) || '—'}%</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>On-time rate</div>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Action Required" meta="Priorities">
          {metrics?.incidents && metrics.incidents > 0 ? (
            <div style={{ background: 'var(--color-danger-dim)', padding: 16, borderRadius: 12, borderLeft: '4px solid var(--color-danger)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>🚨 {metrics.incidents} incident(s)</div>
              <Link to="/app/operations/support/escalations" style={{ fontSize: 13, color: 'var(--color-accent)' }}>Review support queue</Link>
            </div>
          ) : (
            <div style={{ color: 'var(--color-success)', fontSize: 18 }}>✅ All systems nominal</div>
          )}
          <div style={{ marginTop: 16 }}>
            <Link to="/app/operations/dispatch-dashboard" style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--color-accent-dim)', color: 'var(--color-accent)', borderRadius: 8, fontSize: 13 }}>Open Dispatch Console</Link>
          </div>
        </DashboardPanel>
      </div>

      <div style={{ marginTop: 32 }}>
        <Link to="/app/operations/delivery/bookings" style={{ padding: '12px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: 12, fontWeight: 600, textDecoration: 'none' }}>
          📦 View Active Bookings
        </Link>
      </div>
    </PageLayout>
  );
}

