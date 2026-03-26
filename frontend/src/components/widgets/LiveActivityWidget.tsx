import { useEffect, useState } from "react";

interface Activity {
  id: string;
  type: "booking" | "review" | "payment" | "message";
  description: string;
  timeAgo: string;
  icon: string;
}

export function LiveActivityWidget() {
  const [activities, setActivities] = useState<Activity[]>([
    { id: "1", type: "booking", description: "New booking from Sarah M.", timeAgo: "2 min", icon: "📅" },
    { id: "2", type: "review", description: "5-star review received", timeAgo: "15 min", icon: "⭐" },
    { id: "3", type: "payment", description: "Payment of $450 completed", timeAgo: "28 min", icon: "💳" },
    { id: "4", type: "message", description: "Client message: How to reschedule?", timeAgo: "45 min", icon: "💬" },
    { id: "5", type: "booking", description: "Booking cancelled", timeAgo: "1 hour", icon: "❌" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const types: Array<"booking" | "review" | "payment" | "message"> = ["booking", "review", "payment", "message"];
      const icons = { booking: "📅", review: "⭐", payment: "💳", message: "💬" };
      const descriptions = {
        booking: [`New booking from ${["Sarah", "John", "Emma"][Math.floor(Math.random() * 3)]} M.`],
        review: ["5-star review received", "4-star review received"],
        payment: [`Payment of $${Math.floor(Math.random() * 500) + 100} completed`],
        message: ["Client message: Can I reschedule?", "Client inquiry received"]
      };

      const type = types[Math.floor(Math.random() * types.length)];
      const descArray = descriptions[type];
      const newActivity: Activity = {
        id: Date.now().toString(),
        type,
        description: descArray[Math.floor(Math.random() * descArray.length)],
        timeAgo: "now",
        icon: icons[type]
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 4)]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

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
          RECENT ACTIVITY
        </div>
        <h3 style={{ margin: 0, fontSize: "clamp(18px, 3.5vw, 20px)", color: "var(--color-text-primary)" }}>
          Live Feed
        </h3>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(6px, 1.5vw, 8px)",
          maxHeight: 280,
          overflowY: "auto"
        }}
      >
        {activities.map((activity) => (
          <div
            key={activity.id}
            style={{
              display: "flex",
              gap: "clamp(8px, 2vw, 12px)",
              padding: "clamp(6px, 1.5vw, 10px)",
              background: "var(--color-surface-2)",
              borderRadius: 8,
              borderLeft: "3px solid var(--color-accent)",
              animation: "slideDown 300ms ease"
            }}
          >
            <div style={{ fontSize: "clamp(14px, 3vw, 16px)" }}>{activity.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "clamp(11px, 2vw, 12px)",
                  color: "var(--color-text-primary)",
                  marginBottom: 2
                }}
              >
                {activity.description}
              </div>
              <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>
                {activity.timeAgo}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
