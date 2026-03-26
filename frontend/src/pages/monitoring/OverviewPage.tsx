import PageLayout from '@/components/ui/PageLayout';
import { DashboardPanel } from '@/components/dashboard/DashboardPrimitives';
import { useAIInsights } from '@/hooks/useAIInsights';

export default function MonitoringOverviewPage() {
  const { orchestrationResult } = useAIInsights();

  return (
    <PageLayout title="Monitoring & AI Governance" subtitle="Usage • Performance • Compliance">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        <DashboardPanel title="AI Usage Overview" meta="Real-time">
          <div style={{ height: 200, background: 'var(--color-surface-2)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-accent)' }}>1,247</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Queries this week</div>
            </div>
          </div>
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 500 }}>Model breakdown →</summary>
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <div>GPT-4o: 62% (773)</div>
              <div>Claude-3.5: 28% (349)</div>
              <div>Llama-3: 10% (125)</div>
            </div>
          </details>
        </DashboardPanel>

        <DashboardPanel title="Compliance Status" meta="✓ All green">
          <div style={{ fontSize: 24, color: 'var(--color-success)' }}>✅ Compliant</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No policy violations detected</div>
        </DashboardPanel>

        <DashboardPanel title="Performance" meta="Latency">
          <div style={{ fontSize: 28, fontWeight: 600 }}>247ms</div>
          <div style={{ fontSize: 13, color: 'var(--color-success)' }}>p95 response time</div>
        </DashboardPanel>

        <DashboardPanel title="Coming Soon" meta="Roadmap">
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13 }}>🔄 Alerts: Real-time anomaly detection</div>
            <div style={{ fontSize: 13 }}>📈 Anomalies: Pattern analysis</div>
            <div style={{ fontSize: 13 }}>💡 Recommendations: Proactive insights</div>
            <div style={{ fontSize: 13 }}>📋 Logs: Full audit trail</div>
          </div>
        </DashboardPanel>
      </div>

      <div style={{ marginTop: 32, padding: 24, background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Governance Summary</h3>
        <div style={{ display: 'flex', gap: 32, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Usage Policy</div>
            <div>Cost guardrails enforced</div>
            <div>Rate limits active</div>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Data Residency</div>
            <div>EU-compliant storage</div>
            <div>Retention: 90 days</div>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Security</div>
            <div>Input sanitization 100%</div>
            <div>Output filtering active</div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

