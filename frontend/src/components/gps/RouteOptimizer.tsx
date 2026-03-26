import type { ProviderLocationRecord } from "../../services/api";

export function RouteOptimizer({ route }: { route: ProviderLocationRecord | null }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 18 }}>
      <div style={{ fontSize: 16, color: "var(--color-text-primary)", marginBottom: 12 }}>Route optimizer</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 10 }}>
        {route?.optimized ? "Optimized route available from location history." : "Not enough location history to optimize route yet."}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {route?.route_points?.slice(-5).map((point) => (
          <div key={point.recorded_at} style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 10, color: "var(--color-text-muted)" }}>
            {point.lat.toFixed(4)}, {point.lng.toFixed(4)} · {new Date(point.recorded_at).toLocaleTimeString()}
          </div>
        ))}
      </div>
    </div>
  );
}
