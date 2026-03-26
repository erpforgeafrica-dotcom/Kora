import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface AIInsight {
  module: string;
  metric: string;
  value: number;
  trend: "up" | "down" | "stable";
  recommendation: string;
}

export function MarketplaceInsightsPage() {
  const { orgId: organizationId } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [demandForecast, setDemandForecast] = useState<any>(null);
  const [providerOptimization, setProviderOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const [marketplaceRes, analyticsRes, demandRes, optimizationRes] = await Promise.all([
        fetch(`/api/marketplace/recommendations?org_id=${organizationId}`),
        fetch(`/api/analytics/summary?org_id=${organizationId}`),
        fetch(`/api/marketplace/demand/forecast?org_id=${organizationId}`),
        fetch(`/api/marketplace/providers/optimize?org_id=${organizationId}`)
      ]);

      const marketplace = await marketplaceRes.json();
      const analytics = await analyticsRes.json();
      const demand = await demandRes.json();
      const optimization = await optimizationRes.json();

      const aggregatedInsights: AIInsight[] = [
        {
          module: "Marketplace",
          metric: "Smart Matching Score",
          value: marketplace.avg_match_score || 0,
          trend: "up",
          recommendation: "Proximity + rating scoring active"
        },
        {
          module: "Analytics",
          metric: "Booking Conversion",
          value: analytics.conversion_rate || 0,
          trend: analytics.trend || "stable",
          recommendation: "Optimize peak hours"
        },
        {
          module: "Demand Prediction",
          metric: "7-Day Forecast",
          value: demand.predicted_bookings || 0,
          trend: demand.trend || "stable",
          recommendation: demand.recommendation || "Maintain capacity"
        },
        {
          module: "Provider Optimization",
          metric: "Efficiency Score",
          value: optimization.avg_efficiency || 0,
          trend: "up",
          recommendation: optimization.top_recommendation || "Balanced load"
        }
      ];

      setInsights(aggregatedInsights);
      setDemandForecast(demand);
      setProviderOptimization(optimization);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading AI insights...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 28, marginBottom: 24 }}>AI Marketplace Insights</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        {insights.map((insight, idx) => (
          <div key={idx} style={{ background: "var(--color-surface)", padding: 20, borderRadius: 12, border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>{insight.module}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              {insight.value.toFixed(1)}
              <span style={{ fontSize: 14, marginLeft: 8, color: insight.trend === "up" ? "#10b981" : insight.trend === "down" ? "#ef4444" : "#6b7280" }}>
                {insight.trend === "up" ? "↑" : insight.trend === "down" ? "↓" : "→"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>{insight.metric}</div>
            <div style={{ fontSize: 12, padding: 8, background: "var(--color-background)", borderRadius: 6 }}>{insight.recommendation}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "var(--color-surface)", padding: 24, borderRadius: 12, border: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Demand Forecast (7 Days)</h3>
          {demandForecast?.forecast?.map((day: any, idx: number) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: 13 }}>{day.date}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{day.predicted_bookings} bookings</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--color-surface)", padding: 24, borderRadius: 12, border: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Provider Optimization</h3>
          {providerOptimization?.providers?.map((provider: any, idx: number) => (
            <div key={idx} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{provider.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Efficiency: {provider.efficiency_score}% | Load: {provider.current_load}/{provider.capacity}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, color: "#3b82f6" }}>{provider.recommendation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
