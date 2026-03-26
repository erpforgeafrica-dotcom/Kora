import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

interface SocialConnection {
  id: string;
  platform: "instagram" | "facebook" | "whatsapp" | "twitter" | "tiktok";
  account_id: string;
  account_name: string;
  account_email?: string;
  account_image?: string;
  is_active: boolean;
  connected_at: string;
  last_post?: string;
  followers?: number;
  engagement_rate?: number;
  status: "active" | "inactive" | "error" | "expired";
  error_message?: string;
}

interface PlatformInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
  status: "ready" | "in-progress" | "coming-soon";
  features: string[];
}

const PLATFORMS: Record<string, PlatformInfo> = {
  instagram: {
    name: "Instagram",
    description: "Connect your Instagram Business Account for media posting, scheduling, and engagement tracking",
    icon: "📸",
    color: "#E4405F",
    status: "ready",
    features: [
      "Post scheduling",
      "Media library sync",
      "Engagement metrics",
      "Story posting",
      "Reel scheduling"
    ]
  },
  facebook: {
    name: "Facebook",
    description: "Manage your Facebook Pages with automatic posting, scheduling, and audience insights",
    icon: "👥",
    color: "#1877F2",
    status: "ready",
    features: [
      "Page posting",
      "Event creation",
      "Live streaming",
      "Audience targeting",
      "Performance analytics"
    ]
  },
  whatsapp: {
    name: "WhatsApp Business",
    description: "Enable WhatsApp messaging for customer support, appointment reminders, and marketing campaigns",
    icon: "💬",
    color: "#25D366",
    status: "in-progress",
    features: [
      "Auto reminders",
      "Message templates",
      "Booking confirmations",
      "Customer support",
      "Bulk messaging"
    ]
  },
  twitter: {
    name: "Twitter/X",
    description: "Post tweets, manage threads, monitor mentions, and engage with your audience in real-time",
    icon: "𝕏",
    color: "#000000",
    status: "in-progress",
    features: [
      "Tweet posting",
      "Thread management",
      "Mention monitoring",
      "Trend tracking",
      "Rate limit handling"
    ]
  },
  tiktok: {
    name: "TikTok",
    description: "Upload videos, manage content, track trends, and reach younger demographics through TikTok",
    icon: "🎬",
    color: "#000000",
    status: "coming-soon",
    features: [
      "Video uploads",
      "Scheduled posting",
      "Hashtag research",
      "Analytics tracking",
      "Trend integration"
    ]
  }
};

export function SocialDashboard() {
  const { getToken } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabView, setTabView] = useState<"overview" | "accounts" | "analytics">("overview");

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const orgId = localStorage.getItem("x-org-id");

      const response = await fetch("/api/social/meta/connections", {
        headers: {
          "x-org-id": orgId || "",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      } else if (response.status === 404) {
        setConnections([]);
      } else {
        throw new Error("Failed to fetch connections");
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
      setError("Failed to load social connections");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (platform: string, accountId: string) => {
    if (!window.confirm(`Disconnect ${platform} account?`)) return;

    try {
      const token = await getToken();
      const orgId = localStorage.getItem("x-org-id");

      const response = await fetch(`/api/social/meta/disconnect/${platform}/${accountId}`, {
        method: "POST",
        headers: {
          "x-org-id": orgId || "",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setConnections((prev) =>
          prev.filter((c) => !(c.platform === platform && c.account_id === accountId))
        );
      } else {
        setError("Failed to disconnect account");
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      setError("Failed to disconnect account");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "var(--color-success)";
      case "inactive":
        return "var(--color-warning)";
      case "error":
        return "var(--color-danger)";
      case "expired":
        return "var(--color-danger)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "active":
        return "✓";
      case "inactive":
        return "⊘";
      case "error":
        return "✕";
      case "expired":
        return "⟳";
      default:
        return "?";
    }
  };

  const connectedCount = connections.filter((c) => c.is_active).length;
  const platformStats = Object.entries(PLATFORMS).map(([key]) => ({
    platform: key,
    connected: connections.some((c) => c.platform === key && c.is_active),
    count: connections.filter((c) => c.platform === key).length
  }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(20px, 5vw, 32px)",
        padding: "clamp(16px, 4vw, 24px)",
        background: "var(--color-bg)",
        minHeight: "100vh"
      }}
    >
      {/* PAGE HEADER */}
      <div>
        <div
          style={{
            fontSize: "clamp(10px, 2vw, 12px)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            fontWeight: 700,
            marginBottom: 8
          }}
        >
          SOCIAL MEDIA MANAGEMENT
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(24px, 6vw, 36px)",
            color: "var(--color-text-primary)",
            fontWeight: 800,
            marginBottom: 8
          }}
        >
          Connected Social Platforms
        </h1>
        <p
          style={{
            margin: 0,
            marginTop: 8,
            fontSize: "clamp(13px, 2.5vw, 15px)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            maxWidth: "800px"
          }}
        >
          Manage all your social media accounts in one place. Connect platforms, schedule posts,
          track analytics, and engage with your audience across Instagram, Facebook, WhatsApp,
          Twitter/X, and TikTok.
        </p>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "clamp(12px, 3vw, 20px)"
        }}
      >
        <div
          style={{
            padding: "clamp(16px, 3vw, 20px)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)", fontWeight: 700 }}>
            TOTAL CONNECTED
          </div>
          <div style={{ fontSize: "clamp(28px, 6vw, 36px)", color: "var(--color-accent)", fontWeight: 800 }}>
            {connectedCount}/{Object.keys(PLATFORMS).length}
          </div>
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)" }}>
            Platforms active
          </div>
        </div>

        <div
          style={{
            padding: "clamp(16px, 3vw, 20px)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)", fontWeight: 700 }}>
            TOTAL ACCOUNTS
          </div>
          <div style={{ fontSize: "clamp(28px, 6vw, 36px)", color: "var(--color-success)", fontWeight: 800 }}>
            {connections.length}
          </div>
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)" }}>
            Across all platforms
          </div>
        </div>

        <div
          style={{
            padding: "clamp(16px, 3vw, 20px)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)", fontWeight: 700 }}>
            POST STATUS
          </div>
          <div style={{ fontSize: "clamp(28px, 6vw, 36px)", color: "var(--color-warning)", fontWeight: 800 }}>
            Ready
          </div>
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)" }}>
            To schedule
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div
        style={{
          display: "flex",
          gap: "clamp(8px, 2vw, 12px)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "clamp(12px, 2vw, 16px)",
          overflowX: "auto"
        }}
      >
        {["overview", "accounts", "analytics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setTabView(tab as any)}
            style={{
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)",
              background: tabView === tab ? "var(--color-accent)" : "transparent",
              border: `1px solid ${tabView === tab ? "var(--color-accent)" : "transparent"}`,
              borderRadius: 6,
              color: tabView === tab ? "white" : "var(--color-text-primary)",
              fontSize: "clamp(12px, 2vw, 13px)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 200ms ease",
              whiteSpace: "nowrap"
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB - PLATFORM CARDS */}
      {tabView === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "clamp(16px, 4vw, 24px)"
          }}
        >
          {Object.entries(PLATFORMS).map(([platformKey, platform]) => {
            const platformConnections = connections.filter((c) => c.platform === platformKey);
            const isConnected = platformConnections.some((c) => c.is_active);

            return (
              <div
                key={platformKey}
                onClick={() => setSelectedPlatform(selectedPlatform === platformKey ? null : platformKey)}
                style={{
                  padding: "clamp(16px, 3vw, 20px)",
                  background: "var(--color-surface)",
                  border: `2px solid ${selectedPlatform === platformKey ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(12px, 2vw, 16px)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.background = "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = selectedPlatform === platformKey ? "var(--color-accent)" : "var(--color-border)";
                  e.currentTarget.style.background = "var(--color-surface)";
                }}
              >
                {/* PLATFORM HEADER */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 12px)" }}>
                    <div style={{ fontSize: "clamp(28px, 5vw, 32px)" }}>{platform.icon}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "clamp(16px, 3vw, 18px)", fontWeight: 700 }}>
                        {platform.name}
                      </h3>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "clamp(10px, 1.8vw, 11px)",
                          padding: "clamp(2px, 0.5vw, 4px) clamp(6px, 1vw, 8px)",
                          background:
                            platform.status === "ready"
                              ? "var(--color-success-soft)"
                              : platform.status === "in-progress"
                                ? "var(--color-warning-soft)"
                                : "var(--color-surface-2)",
                          color:
                            platform.status === "ready"
                              ? "var(--color-success)"
                              : platform.status === "in-progress"
                                ? "var(--color-warning)"
                                : "var(--color-text-muted)",
                          borderRadius: 4,
                          fontWeight: 700,
                          display: "inline-block"
                        }}
                      >
                        {platform.status === "ready"
                          ? "✓ Ready"
                          : platform.status === "in-progress"
                            ? "⟳ In Progress"
                            : "Coming Soon"}
                      </div>
                    </div>
                  </div>

                  {isConnected && (
                    <div
                      style={{
                        padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 10px)",
                        background: "var(--color-success-soft)",
                        color: "var(--color-success)",
                        borderRadius: 4,
                        fontSize: "clamp(10px, 1.8vw, 11px)",
                        fontWeight: 700
                      }}
                    >
                      ✓ {platformConnections.length} connected
                    </div>
                  )}
                </div>

                {/* PLATFORM DESCRIPTION */}
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(11px, 2vw, 12px)",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.5
                  }}
                >
                  {platform.description}
                </p>

                {/* FEATURES LIST */}
                <div style={{ display: "flex", flexDirection: "column", gap: "clamp(4px, 1vw, 6px)" }}>
                  <div
                    style={{
                      fontSize: "clamp(10px, 1.8vw, 11px)",
                      fontWeight: 700,
                      color: "var(--color-text-muted)"
                    }}
                  >
                    Key Features:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(4px, 1vw, 6px)" }}>
                    {platform.features.map((feature) => (
                      <div
                        key={feature}
                        style={{
                          fontSize: "clamp(10px, 1.8vw, 11px)",
                          color: "var(--color-text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span style={{ color: "var(--color-accent)" }}>→</span> {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTON */}
                {platform.status === "ready" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle connect/manage action
                    }}
                    style={{
                      padding: "clamp(8px, 2vw, 10px) clamp(12px, 2vw, 16px)",
                      background: isConnected ? "var(--color-success)" : "var(--color-accent)",
                      border: "none",
                      borderRadius: 6,
                      color: "white",
                      fontSize: "clamp(11px, 2vw, 12px)",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 150ms ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.85";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {isConnected ? "Manage Account" : "Connect Now"}
                  </button>
                )}

                {platform.status !== "ready" && (
                  <div
                    style={{
                      padding: "clamp(8px, 2vw, 10px)",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      color: "var(--color-text-muted)",
                      fontSize: "clamp(11px, 2vw, 12px)",
                      textAlign: "center",
                      fontWeight: 700
                    }}
                  >
                    {platform.status === "in-progress" ? "Setup in progress..." : "Coming soon"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ACCOUNTS TAB - CONNECTED ACCOUNTS */}
      {tabView === "accounts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 2vw, 16px)" }}>
          {connections.length === 0 ? (
            <div
              style={{
                padding: "clamp(20px, 5vw, 40px)",
                background: "var(--color-surface)",
                border: "1px dashed var(--color-border)",
                borderRadius: 12,
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "clamp(20px, 4vw, 32px)", marginBottom: 12 }}>🔗</div>
              <h3 style={{ margin: 0, fontSize: "clamp(16px, 3vw, 18px)", marginBottom: 8 }}>
                No Connected Accounts
              </h3>
              <p style={{ margin: 0, fontSize: "clamp(12px, 2vw, 13px)", color: "var(--color-text-secondary)" }}>
                Connect your first social media account by selecting a platform above
              </p>
            </div>
          ) : (
            connections.map((connection) => (
              <div
                key={`${connection.platform}-${connection.account_id}`}
                style={{
                  padding: "clamp(12px, 2vw, 16px)",
                  background: "var(--color-surface)",
                  border: `1px solid ${connection.status === "error" ? "var(--color-danger)" : "var(--color-border)"}`,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "clamp(12px, 2vw, 16px)"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 12px)", marginBottom: 6 }}>
                    <span style={{ fontSize: "clamp(20px, 4vw, 24px)" }}>
                      {PLATFORMS[connection.platform]?.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: "clamp(13px, 2vw, 14px)", fontWeight: 700 }}>
                        {connection.account_name}
                      </div>
                      <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-muted)" }}>
                        {PLATFORMS[connection.platform]?.name}
                      </div>
                    </div>
                  </div>
                  {connection.last_post && (
                    <div style={{ fontSize: "clamp(10px, 1.8vw, 11px)", color: "var(--color-text-muted)" }}>
                      Last post: {connection.last_post}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 12px)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 10px)",
                      background: `${getStatusColor(connection.status)}20`,
                      color: getStatusColor(connection.status),
                      borderRadius: 4,
                      fontSize: "clamp(10px, 1.8vw, 11px)",
                      fontWeight: 700
                    }}
                  >
                    <span>{getStatusEmoji(connection.status)}</span>
                    {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                  </div>

                  <button
                    onClick={() => handleDisconnect(connection.platform, connection.account_id)}
                    style={{
                      padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 10px)",
                      background: "var(--color-danger-soft)",
                      border: "1px solid var(--color-danger)",
                      color: "var(--color-danger)",
                      borderRadius: 4,
                      fontSize: "clamp(10px, 1.8vw, 11px)",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 150ms ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-danger)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--color-danger-soft)";
                      e.currentTarget.style.color = "var(--color-danger)";
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tabView === "analytics" && (
        <div
          style={{
            padding: "clamp(20px, 5vw, 40px)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 32px)", marginBottom: 12 }}>📊</div>
          <h3 style={{ margin: 0, fontSize: "clamp(16px, 3vw, 18px)", marginBottom: 8 }}>
            Analytics Coming Soon
          </h3>
          <p style={{ margin: 0, fontSize: "clamp(12px, 2vw, 13px)", color: "var(--color-text-secondary)" }}>
            Cross-platform analytics and performance metrics will be available once accounts are connected
          </p>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div
          style={{
            padding: "clamp(12px, 2vw, 16px)",
            background: "var(--color-danger-soft)",
            border: `1px solid var(--color-danger)`,
            borderRadius: 8,
            color: "var(--color-danger)",
            fontSize: "clamp(12px, 2vw, 13px)"
          }}
        >
          ✕ {error}
        </div>
      )}
    </div>
  );
}
