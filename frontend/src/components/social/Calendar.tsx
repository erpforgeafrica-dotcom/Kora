import { useMemo } from "react";
import type { CampaignRecord } from "../../services/api";

export function SocialCalendar({ campaigns }: { campaigns: CampaignRecord[] }) {
  const byStatus = useMemo(() => {
    return campaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [campaigns]);

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 18 }}>
      <div style={{ color: "var(--color-text-primary)", fontSize: 16, marginBottom: 12 }}>Content calendar</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 14 }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{status}</div>
            <div style={{ color: "var(--color-text-primary)", fontSize: 24 }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
