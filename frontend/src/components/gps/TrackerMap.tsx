import type { ProviderLocationRecord } from "../../services/api";

export function TrackerMap({ tracking }: { tracking: ProviderLocationRecord | null }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 18 }}>
      <div style={{ fontSize: 16, color: "var(--color-text-primary)", marginBottom: 8 }}>Live tracking</div>
      <div style={{ minHeight: 220, borderRadius: 14, border: "1px dashed var(--color-border)", background: "linear-gradient(180deg, rgba(0,229,200,0.06), rgba(167,139,250,0.04))", display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        {tracking?.location?.lat != null && tracking?.location?.lng != null
          ? `Provider at ${tracking.location.lat.toFixed(4)}, ${tracking.location.lng.toFixed(4)}`
          : "Live map placeholder - GPS signal pending"}
      </div>
      <div style={{ marginTop: 10, color: "var(--color-text-muted)", fontSize: 13 }}>
        ETA: {tracking?.eta_minutes ?? "pending"} min
      </div>
    </div>
  );
}
