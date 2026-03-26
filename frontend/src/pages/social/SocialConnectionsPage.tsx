import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface SocialConnection {
  platform: string;
  account_name: string;
  is_active: boolean;
  connected_at: string;
}

export function SocialConnectionsPage() {
  const { orgId: organizationId } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch("/api/social/connections", {
        headers: { "x-org-id": organizationId || "" }
      });
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platform: string) => {
    try {
      const response = await fetch("/api/social/auth/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-org-id": organizationId || "" },
        body: JSON.stringify({ platform })
      });

      const { auth_url, state } = await response.json();
      sessionStorage.setItem("oauth_state", state);
      window.location.href = auth_url;
    } catch (err) {
      console.error(`Failed to connect ${platform}:`, err);
    }
  };

  const platforms = [
    { id: "instagram", name: "Instagram", icon: "📷", color: "#E4405F" },
    { id: "facebook", name: "Facebook", icon: "👥", color: "#1877F2" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "#25D366" },
    { id: "twitter", name: "Twitter", icon: "🐦", color: "#1DA1F2" },
    { id: "tiktok", name: "TikTok", icon: "🎵", color: "#000000" }
  ];

  if (loading) return <div style={{ padding: 24 }}>Loading connections...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 28, marginBottom: 24 }}>Social Media Connections</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {platforms.map((platform) => {
          const connection = connections.find((c) => c.platform === platform.id);
          const isConnected = connection?.is_active;

          return (
            <div
              key={platform.id}
              style={{
                background: "var(--color-surface)",
                padding: 24,
                borderRadius: 12,
                border: `2px solid ${isConnected ? platform.color : "var(--color-border)"}`,
                position: "relative"
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>{platform.icon}</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>{platform.name}</h3>

              {isConnected ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>
                    Connected as {connection.account_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✓ Active</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
                    Not connected
                  </div>
                  <button
                    onClick={() => connectPlatform(platform.id)}
                    style={{
                      padding: "10px 20px",
                      background: platform.color,
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Connect {platform.name}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
