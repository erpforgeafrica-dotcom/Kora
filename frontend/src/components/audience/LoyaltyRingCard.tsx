interface LoyaltyRingCardProps {
  points: number;
  tier: "none" | "silver" | "gold" | "platinum";
  nextTierPoints: number;
  caption?: string;
}

const TIER_LABELS: Record<LoyaltyRingCardProps["tier"], string> = {
  none: "Member",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum"
};

export function LoyaltyRingCard({ points, tier, nextTierPoints, caption }: LoyaltyRingCardProps) {
  const safeTarget = Math.max(nextTierPoints, 1);
  const progress = Math.min(100, Math.max(0, (points / safeTarget) * 100));
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        display: "grid",
        gap: 14
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden="true">
          <circle
            cx="54"
            cy="54"
            r="44"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="10"
          />
          <circle
            cx="54"
            cy="54"
            r="44"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 54 54)"
          />
          <text x="54" y="50" textAnchor="middle" style={{ fill: "var(--color-text-primary)", fontSize: 21, fontWeight: 700 }}>
            {points}
          </text>
          <text x="54" y="68" textAnchor="middle" style={{ fill: "var(--color-text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            pts
          </text>
        </svg>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            {TIER_LABELS[tier]} Tier
          </div>
          <div style={{ fontSize: 16, color: "var(--color-text-primary)", fontWeight: 700 }}>
            {points} / {safeTarget} pts
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {Math.max(0, safeTarget - points)} pts to next tier
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
        {caption ?? `Progressing toward ${TIER_LABELS[tier === "platinum" ? "platinum" : tier === "gold" ? "platinum" : tier === "silver" ? "gold" : "silver"]}.`}
      </div>
    </div>
  );
}
