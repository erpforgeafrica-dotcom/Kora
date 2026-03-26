import { useMemo } from "react";
import type { MembershipTier } from "../types/audience";

export interface LoyaltyWidgetProps {
  points: number;
  tier: MembershipTier;
  nextTierPoints: number;
  onRedeemClick?: () => void;
}

const TIER_INFO: Record<MembershipTier, { label: string; color: string; nextTier: MembershipTier | null }> = {
  none: { label: "No Membership", color: "#64748b", nextTier: "silver" },
  silver: { label: "Silver", color: "#a1a5ab", nextTier: "gold" },
  gold: { label: "Gold", color: "#f59e0b", nextTier: "platinum" },
  platinum: { label: "Platinum", color: "#00e5c8", nextTier: null }
};

export function LoyaltyWidget({
  points,
  tier,
  nextTierPoints,
  onRedeemClick
}: LoyaltyWidgetProps) {
  const tierInfo = TIER_INFO[tier];
  const progress = (points / nextTierPoints) * 100;
  const clampedProgress = Math.min(progress, 100);

  const displayNextTier = tierInfo.nextTier ? TIER_INFO[tierInfo.nextTier].label : null;

  return (
    <div
      style={{
        background: "var(--color-background-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16
      }}
    >
      {/* SVG Ring */}
      <svg
        width={120}
        height={120}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background circle */}
        <circle
          cx={60}
          cy={60}
          r={50}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={6}
        />
        {/* Progress circle */}
        <circle
          cx={60}
          cy={60}
          r={50}
          fill="none"
          stroke={tierInfo.color}
          strokeWidth={6}
          strokeDasharray={`${(Math.PI * 100 * clampedProgress) / 100} ${Math.PI * 100}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.3s ease"
          }}
        />
        {/* Center text */}
        <text
          x={60}
          y={65}
          textAnchor="middle"
          fontSize={14}
          fontWeight="700"
          fill="var(--color-text-primary)"
          style={{ transform: "rotate(90deg)", transformOrigin: "60px 60px" }}
        >
          {points}
        </text>
      </svg>

      {/* Tier Badge */}
      <div
        style={{
          padding: "6px 12px",
          borderRadius: 20,
          background: `${tierInfo.color}22`,
          border: `1px solid ${tierInfo.color}44`,
          fontSize: 12,
          fontWeight: 700,
          color: tierInfo.color,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}
      >
        {tierInfo.label}
      </div>

      {/* Progress Label */}
      {displayNextTier && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            textAlign: "center",
            lineHeight: 1.6
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
            {points} / {nextTierPoints} pts
          </div>
          <div>to {displayNextTier}</div>
        </div>
      )}

      {/* Redeem Button */}
      {tier !== "none" && (
        <button
          onClick={onRedeemClick}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--color-accent-teal)",
            background: "rgba(0,229,200,0.1)",
            color: "var(--color-accent-teal)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textTransform: "uppercase"
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = "rgba(0,229,200,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "rgba(0,229,200,0.1)";
          }}
        >
          Redeem Points
        </button>
      )}
    </div>
  );
}
