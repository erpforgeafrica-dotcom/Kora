import { AIChat } from "../../components/ai/AIChat";

export function AIChatbotPage() {
  return (
    <div style={{ padding: "clamp(12px, 4vw, 24px)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "clamp(16px, 4vw, 24px)" }}>
        <div
          style={{
            fontSize: "clamp(10px, 2vw, 12px)",
            letterSpacing: "0.12em",
            color: "var(--color-accent)",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 10,
            fontWeight: 700
          }}
        >
          AI TOOLS
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(20px, 5vw, 28px)",
            color: "var(--color-text-primary)",
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: 8
          }}
        >
          AI Assistant
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "clamp(12px, 3vw, 14px)",
            color: "var(--color-text-muted)"
          }}
        >
          Chat with KÓRA AI for business insights, scheduling help, and customer management advice.
        </p>
      </div>

      {/* Chat Container - Responsive Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gridAutoColumns: "minmax(0, 1fr)",
          gap: "clamp(12px, 3vw, 20px)",
          flex: 1,
          minHeight: 0,
          "@media (min-width: 1024px)": {
            gridTemplateColumns: "1fr 320px"
          }
        } as any}
      >
        {/* Main Chat */}
        <div style={{ minHeight: 0, minWidth: 0 }}>
          <AIChat title="KÓRA AI Assistant" />
        </div>

        {/* Quick Actions Sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 2vw, 12px)",
            minHeight: 0,
            minWidth: 0
          }}
        >
          <div
            style={{
              fontSize: "clamp(9px, 2vw, 10px)",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.12em",
              color: "var(--color-text-muted)",
              fontWeight: 700,
              marginBottom: 4
            }}
          >
            QUICK ACTIONS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "clamp(8px, 2vw, 12px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {[
              { emoji: "📊", text: "Weekly Report", desc: "Generate performance summary" },
              { emoji: "👥", text: "Staff Schedule", desc: "Manage team availability" },
              { emoji: "💰", text: "Revenue Insights", desc: "Analyze earning trends" },
              { emoji: "🎯", text: "Customer Segment", desc: "Smart customer grouping" },
              { emoji: "⚡", text: "Quick Tips", desc: "Growth recommendations" },
              { emoji: "🔧", text: "System Health", desc: "Check infrastructure status" }
            ].map((action) => (
              <button
                key={action.text}
                style={{
                  padding: "clamp(10px, 2vw, 12px)",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 140ms ease",
                  fontSize: "clamp(9px, 1.5vw, 12px)"
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "var(--color-surface-2)";
                  el.style.borderColor = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "var(--color-surface)";
                  el.style.borderColor = "var(--color-border)";
                }}
              >
                <div style={{ fontSize: "clamp(16px, 3vw, 18px)", marginBottom: 4 }}>{action.emoji}</div>
                <div style={{ fontSize: "clamp(10px, 1.8vw, 12px)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
                  {action.text}
                </div>
                <div style={{ fontSize: "clamp(9px, 1.5vw, 10px)", color: "var(--color-text-muted)" }}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>

          <div
            style={{
              padding: "clamp(10px, 2vw, 12px)",
              background: "var(--color-surface-2)",
              borderRadius: 8,
              fontSize: "clamp(9px, 1.8vw, 10px)",
              color: "var(--color-text-muted)",
              marginTop: "auto"
            }}
          >
            <strong>💡 Tip:</strong> Ask me about "bookings", "revenue", "team", or "customers" for specific insights!
          </div>
        </div>
      </div>
    </div>
  );
}
