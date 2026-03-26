import { useEffect, useState } from "react";

interface RevenueData {
  today: number;
  week: number;
  month: number;
  trend: number; // percentage change
}

export function LiveRevenueWidget() {
  const [data, setData] = useState<RevenueData>({
    today: 4250,
    week: 28650,
    month: 125400,
    trend: 12.5
  });
  const [animatedValue, setAnimatedValue] = useState(data.today);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        today: prev.today + Math.random() * 500 - 100,
        trend: prev.trend + (Math.random() - 0.5) * 2
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animate = () => {
      setAnimatedValue((prev) => prev + (data.today - prev) * 0.1);
    };
    const animation = setInterval(animate, 50);
    return () => clearInterval(animation);
  }, [data.today]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div
      style={{
        padding: "clamp(16px, 4vw, 20px)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(12px, 3vw, 16px)"
      }}
    >
      <div>
        <div
          style={{
            fontSize: "clamp(9px, 1.8vw, 10px)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            fontWeight: 700,
            marginBottom: 4
          }}
        >
          REVENUE
        </div>
        <h3 style={{ margin: 0, fontSize: "clamp(20px, 5vw, 28px)", color: "var(--color-text-primary)" }}>
          {formatCurrency(Math.round(animatedValue))}
        </h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px, 2vw, 12px)" }}>
        <div>
          <div style={{ fontSize: "clamp(10px, 1.8vw, 11px)", color: "var(--color-text-muted)", marginBottom: 6 }}>
            This Week
          </div>
          <div style={{ fontSize: "clamp(14px, 2.5vw, 16px)", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {formatCurrency(data.week)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "clamp(10px, 1.8vw, 11px)", color: "var(--color-text-muted)", marginBottom: 6 }}>
            This Month
          </div>
          <div style={{ fontSize: "clamp(14px, 2.5vw, 16px)", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {formatCurrency(data.month)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(4px, 1vw, 6px)",
          padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)",
          background: "var(--color-success)",
          borderRadius: 6,
          color: "white",
          fontSize: "clamp(11px, 2vw, 12px)",
          fontWeight: 700
        }}
      >
        <span>📈</span>
        <span>+{data.trend.toFixed(1)}% vs last period</span>
      </div>

      <div
        style={{
          height: 40,
          background: "var(--color-surface-2)",
          borderRadius: 6,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))",
            opacity: 0.3,
            animation: "pulse 2s ease-in-out infinite"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: 2,
            width: `${Math.min((animatedValue / data.month) * 100, 100)}%`,
            background: "var(--color-accent)",
            transition: "width 100ms ease"
          }}
        />
      </div>
    </div>
  );
}
