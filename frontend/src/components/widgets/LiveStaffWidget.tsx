import { useEffect, useState } from "react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: "available" | "busy" | "offline";
  activeClients?: number;
}

export function LiveStaffWidget() {
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: "1", name: "Sarah Chen", role: "Manager", status: "available", activeClients: 0 },
    { id: "2", name: "Marcus Johnson", role: "Specialist", status: "busy", activeClients: 2 },
    { id: "3", name: "Emma Rodriguez", role: "Specialist", status: "available", activeClients: 1 },
    { id: "4", name: "Alex Thompson", role: "Support", status: "offline", activeClients: 0 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStaff((prev) =>
        prev.map((member) => {
          const statuses: Array<"available" | "busy" | "offline"> = ["available", "busy", "offline"];
          return {
            ...member,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            activeClients: Math.floor(Math.random() * 3)
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "available":
        return "var(--color-success)";
      case "busy":
        return "var(--color-warning)";
      case "offline":
        return "var(--color-text-muted)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const statusEmoji = (status: string) => {
    switch (status) {
      case "available":
        return "✓";
      case "busy":
        return "⟹";
      case "offline":
        return "●";
      default:
        return "?";
    }
  };

  const availableCount = staff.filter((m) => m.status === "available").length;
  const busyCount = staff.filter((m) => m.status === "busy").length;

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
          STAFF AVAILABILITY
        </div>
        <h3 style={{ margin: 0, fontSize: "clamp(18px, 3.5vw, 20px)", color: "var(--color-text-primary)" }}>
          {availableCount} Available • {busyCount} Busy
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
        {staff.map((member) => (
          <div
            key={member.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "clamp(6px, 1.5vw, 10px)",
              background: "var(--color-surface-2)",
              borderRadius: 8,
              transition: "all 200ms ease"
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "clamp(11px, 2vw, 12px)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: 2
                }}
              >
                {member.name}
              </div>
              <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>
                {member.role}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(4px, 1vw, 8px)"
              }}
            >
              {member.activeClients ? (
                <div
                  style={{
                    fontSize: "clamp(9px, 1.8vw, 10px)",
                    padding: "clamp(1px, 0.5vw, 2px) clamp(4px, 1vw, 6px)",
                    background: "var(--color-accent-dim)",
                    color: "var(--color-accent)",
                    borderRadius: 4,
                    fontWeight: 700
                  }}
                >
                  {member.activeClients} client{member.activeClients !== 1 ? "s" : ""}
                </div>
              ) : null}

              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: statusColor(member.status),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700
                }}
              >
                {statusEmoji(member.status)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
