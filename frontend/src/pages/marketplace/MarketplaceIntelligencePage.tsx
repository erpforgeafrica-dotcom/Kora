import { useEffect, useState } from "react";
import { AudienceSection, StatusPill } from "../../components/audience/AudiencePrimitives";

interface Recommendation {
  type: string;
  priority: string;
  action: string;
  impact: string;
}

interface DemandForecast {
  date: string;
  predicted_bookings: number;
  confidence: number;
  peak_hours: number[];
}

export function MarketplaceIntelligencePage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecast, setForecast] = useState<DemandForecast[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const orgId = localStorage.getItem("kora_org_id") || "";
      const headers = { "X-Org-Id": orgId };

      const [analyticsRes, optimizeRes, forecastRes] = await Promise.all([
        fetch("/api/marketplace/analytics", { headers }),
        fetch("/api/marketplace/optimize", { headers }),
        fetch("/api/marketplace/demand-forecast?days=7", { headers })
      ]);

      const analyticsData = await analyticsRes.json();
      const optimizeData = await optimizeRes.json();
      const forecastData = await forecastRes.json();

      setAnalytics(analyticsData);
      setMetrics(optimizeData.current_metrics);
      setRecommendations(optimizeData.recommendations);
      setForecast(forecastData.forecast || []);
    } catch (err) {
      console.error("Failed to load marketplace data", err);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
  };

  const getPriorityColor = (priority: string) => {
    return priority === "high" ? "var(--color-danger)" : priority === "medium" ? "var(--color-warning)" : "var(--color-accent)";
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
          AI Marketplace Intelligence
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          Smart matching, dynamic pricing, and demand forecasting
        </div>
      </div>

      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Staff Utilization</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {metrics.utilization_pct}%
            </div>
          </div>
          <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Revenue (30d)</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {formatCurrency(metrics.revenue_30d)}
            </div>
          </div>
          <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>No-Show Rate</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {metrics.no_show_rate_pct}%
            </div>
          </div>
          <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Avg Rating</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {metrics.avg_rating} ★
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }}>
        <AudienceSection title="AI Optimization Recommendations" meta="Actionable insights">
          <div style={{ display: "grid", gap: 12 }}>
            {recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--color-surface-2)",
                  border: `1px solid ${getPriorityColor(rec.priority)}33`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {rec.action}
                  </div>
                  <StatusPill
                    label={rec.priority}
                    tone={rec.priority === "high" ? "danger" : rec.priority === "medium" ? "warning" : "accent"}
                  />
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6 }}>
                  Type: {rec.type}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-success)", fontWeight: 600 }}>
                  💡 {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </AudienceSection>

        <AudienceSection title="Demand Forecast" meta="Next 7 days">
          <div style={{ display: "grid", gap: 10 }}>
            {forecast.slice(0, 7).map((day, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
                      Peak: {day.peak_hours.join(", ")}:00
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-accent)" }}>
                      {day.predicted_bookings}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {Math.round(day.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AudienceSection>
      </div>

      {analytics && (
        <AudienceSection title="Marketplace Analytics" meta="Last 30 days">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6 }}>Total Bookings</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {analytics.total_bookings}
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6 }}>Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {formatCurrency(analytics.revenue_cents)}
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6 }}>Avg Booking Value</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {formatCurrency(analytics.avg_booking_value_cents)}
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6 }}>Top Service</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                {analytics.top_service || "N/A"}
              </div>
            </div>
          </div>
        </AudienceSection>
      )}
    </div>
  );
}
