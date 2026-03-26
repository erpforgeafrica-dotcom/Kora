import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

interface FacebookPage {
  access_token: string;
  category: string;
  category_list: Array<{ id: string; name: string }>;
  name: string;
  id: string;
  picture?: { data: { url: string } };
}

interface MetaConnection {
  platform: "instagram" | "facebook";
  account_id: string;
  account_name: string;
  is_active: boolean;
  connected_at: string;
}

interface ConnectedAccount {
  platform: string;
  account_id: string;
  account_name: string;
  is_active: boolean;
}

export function MetaConnect({ onConnected }: { onConnected?: (account: ConnectedAccount) => void }) {
  const { getToken } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [popup, setPopup] = useState<Window | null>(null);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [connections, setConnections] = useState<MetaConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"connect" | "instagram" | "facebook">("connect");

  useEffect(() => {
    fetchConnections();

    // Listen for OAuth callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "META_OAUTH_SUCCESS" && event.data.authUrl) {
        handleOAuthCallback();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const fetchConnections = async () => {
    try {
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
      }
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    }
  };

  const initiateOAuth = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch("/api/social/meta/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to get authorization URL");
      }

      const { auth_url } = await response.json();

      // Open OAuth popup
      const popup = window.open(
        auth_url,
        "Meta OAuth",
        "width=500,height=600,left=200,top=100"
      );

      if (!popup) {
        throw new Error("Could not open OAuth popup. Check browser popup blocker.");
      }

      setPopup(popup);

      // Poll for completion
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
          setPopup(null);

          // Refresh connections after OAuth completes
          setTimeout(fetchConnections, 1000);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth failed");
      setIsConnecting(false);
    }
  };

  const handleOAuthCallback = async () => {
    try {
      const token = await getToken();
      const orgId = localStorage.getItem("x-org-id");
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setError("No authorization code received");
        return;
      }

      const response = await fetch("/api/social/meta/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": orgId || "",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error("Failed to complete OAuth");
      }

      const data = await response.json();
      setAvailablePages(data.pages || []);
      setActiveTab("facebook");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Callback failed");
    }
  };

  const connectPage = async (page: FacebookPage, platform: "facebook" | "instagram") => {
    try {
      const token = await getToken();
      const orgId = localStorage.getItem("x-org-id");

      const endpoint = platform === "facebook" ? "/api/social/meta/facebook/connect" : "/api/social/meta/instagram/connect";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": orgId || "",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          [platform === "facebook" ? "page_id" : "account_id"]: page.id,
          [platform === "facebook" ? "page_name" : "account_name"]: page.name,
          access_token: page.access_token
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to connect ${platform} account`);
      }

      const connectedAccount = await response.json();
      onConnected?.({
        platform,
        account_id: page.id,
        account_name: page.name,
        is_active: true
      });

      fetchConnections();
      setSelectedPage(null);
      setAvailablePages([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const disconnectAccount = async (platform: string, accountId: string) => {
    try {
      const token = await getToken();
      const orgId = localStorage.getItem("x-org-id");

      const response = await fetch(`/api/social/meta/disconnect/${platform}/${accountId}`, {
        method: "POST",
        headers: {
          "x-org-id": orgId || "",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchConnections();
        setError(null);
      } else {
        throw new Error("Failed to disconnect account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnection failed");
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "var(--color-success)" : "var(--color-danger)";
  };

  return (
    <div
      style={{
        padding: "clamp(20px, 5vw, 32px)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        background: "var(--color-surface)"
      }}
    >
      <div style={{ marginBottom: "clamp(16px, 4vw, 24px)" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "clamp(18px, 4vw, 22px)", color: "var(--color-text-primary)" }}>
          Meta Connect
        </h2>
        <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 13px)", color: "var(--color-text-muted)" }}>
          Connect your Instagram Business & Facebook Pages
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "clamp(12px, 3vw, 16px)",
            background: "var(--color-danger-soft)",
            border: `1px solid var(--color-danger)`,
            borderRadius: 8,
            marginBottom: "clamp(12px, 3vw, 16px)",
            color: "var(--color-danger)",
            fontSize: "clamp(11px, 2vw, 12px)"
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "clamp(8px, 2vw, 12px)",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "clamp(16px, 4vw, 24px)"
        }}
      >
        {["connect", "instagram", "facebook"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "connect" | "instagram" | "facebook")}
            style={{
              padding: "clamp(8px, 1.5vw, 12px) clamp(12px, 3vw, 16px)",
              background: activeTab === tab ? "transparent" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "3px solid var(--color-accent)" : "none",
              color: activeTab === tab ? "var(--color-accent)" : "var(--color-text-muted)",
              fontSize: "clamp(12px, 2vw, 14px)",
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: "pointer",
              transition: "all 140ms ease",
              textTransform: "capitalize"
            }}
          >
            {tab === "connect" ? "📱 Connect" : tab === "instagram" ? "📷 Instagram" : "💬 Facebook"}
          </button>
        ))}
      </div>

      {/* Connect Tab */}
      {activeTab === "connect" && (
        <div>
          <div style={{ marginBottom: "clamp(16px, 4vw, 24px)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "clamp(14px, 2.5vw, 16px)", color: "var(--color-text-primary)" }}>
              Required Permissions
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: "clamp(16px, 4vw, 20px)",
                fontSize: "clamp(11px, 2vw, 12px)",
                color: "var(--color-text-muted)",
                lineHeight: "1.6"
              }}
            >
              <li>📧 Email address access</li>
              <li>👤 Public profile information</li>
              <li>📄 Page list management</li>
              <li>📸 Instagram Business Account access</li>
              <li>💬 Messaging capabilities</li>
              <li>📊 Insights and analytics</li>
              <li>✍️ Post publishing permissions</li>
            </ul>
          </div>

          <button
            onClick={initiateOAuth}
            disabled={isConnecting}
            style={{
              width: "100%",
              padding: "clamp(12px, 3vw, 16px)",
              background: isConnecting ? "var(--color-surface-2)" : "var(--color-accent)",
              border: "1px solid var(--color-accent)",
              color: isConnecting ? "var(--color-text-muted)" : "white",
              fontSize: "clamp(12px, 2vw, 14px)",
              fontWeight: 700,
              borderRadius: 8,
              cursor: isConnecting ? "not-allowed" : "pointer",
              transition: "all 140ms ease"
            }}
          >
            {isConnecting ? "⏳ Connecting..." : "🔐 Connect with Meta"}
          </button>
        </div>
      )}

      {/* Instagram Tab */}
      {activeTab === "instagram" && (
        <div>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "clamp(14px, 2.5vw, 16px)", color: "var(--color-text-primary)" }}>
            Connected Instagram Accounts
          </h3>

          {connections.filter((c) => c.platform === "instagram").length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "clamp(12px, 2vw, 13px)" }}>
              No Instagram accounts connected yet. Use the Connect tab to authorize.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)" }}>
              {connections
                .filter((c) => c.platform === "instagram")
                .map((account) => (
                  <div
                    key={account.account_id}
                    style={{
                      padding: "clamp(12px, 3vw, 16px)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      background: "var(--color-surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "clamp(8px, 2vw, 12px)"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "clamp(12px, 2vw, 13px)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {account.account_name}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(10px, 1.8vw, 11px)",
                          color: getStatusColor(account.is_active),
                          marginTop: 4
                        }}
                      >
                        ● {account.is_active ? "Connected" : "Disconnected"}
                      </div>
                    </div>
                    <button
                      onClick={() => disconnectAccount(account.platform, account.account_id)}
                      style={{
                        padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)",
                        background: "var(--color-danger-soft)",
                        border: "1px solid var(--color-danger)",
                        color: "var(--color-danger)",
                        fontSize: "clamp(11px, 2vw, 12px)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 140ms ease"
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
                ))}
            </div>
          )}
        </div>
      )}

      {/* Facebook Tab */}
      {activeTab === "facebook" && (
        <div>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "clamp(14px, 2.5vw, 16px)", color: "var(--color-text-primary)" }}>
            Connected Facebook Pages
          </h3>

          {connections.filter((c) => c.platform === "facebook").length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "clamp(12px, 2vw, 13px)" }}>
              No Facebook pages connected yet. Use the Connect tab to authorize.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)" }}>
              {connections
                .filter((c) => c.platform === "facebook")
                .map((account) => (
                  <div
                    key={account.account_id}
                    style={{
                      padding: "clamp(12px, 3vw, 16px)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      background: "var(--color-surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "clamp(8px, 2vw, 12px)"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "clamp(12px, 2vw, 13px)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {account.account_name}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(10px, 1.8vw, 11px)",
                          color: getStatusColor(account.is_active),
                          marginTop: 4
                        }}
                      >
                        ● {account.is_active ? "Connected" : "Disconnected"}
                      </div>
                    </div>
                    <button
                      onClick={() => disconnectAccount(account.platform, account.account_id)}
                      style={{
                        padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)",
                        background: "var(--color-danger-soft)",
                        border: "1px solid var(--color-danger)",
                        color: "var(--color-danger)",
                        fontSize: "clamp(11px, 2vw, 12px)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 140ms ease"
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
                ))}
            </div>
          )}

          {availablePages.length > 0 && (
            <div style={{ marginTop: "clamp(16px, 4vw, 24px)" }}>
              <h4 style={{ fontSize: "clamp(12px, 2vw, 14px)", color: "var(--color-text-primary)", marginBottom: 12 }}>
                Available Pages to Connect
              </h4>
              {availablePages.map((page) => (
                <div
                  key={page.id}
                  style={{
                    padding: "clamp(8px, 2vw, 12px)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 140ms ease",
                    background: selectedPage?.id === page.id ? "var(--color-accent-soft)" : "transparent"
                  }}
                  onClick={() => setSelectedPage(page)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "clamp(11px, 2vw, 12px)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {page.name}
                    </div>
                    <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>
                      {page.category}
                    </div>
                  </div>
                  {selectedPage?.id === page.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        connectPage(page, "facebook");
                      }}
                      style={{
                        padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
                        background: "var(--color-accent)",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        fontSize: "clamp(10px, 1.8vw, 11px)",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
