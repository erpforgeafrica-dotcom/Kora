import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import type { UserRole } from "../../config/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import ThemeSwitcher from "../ThemeSwitcher";
import Sidebar from "./Sidebar";

function getAiDestination(role: UserRole) {
  if (role === "platform_admin" || role === "kora_admin") {
    return "/app/kora-admin/ai-usage";
  }

  if (role === "operations" || role === "dispatcher" || role === "delivery_agent") {
    return "/app/operations/dispatch-dashboard";
  }

  return "/dashboard/ai";
}

function getWorkspaceLabel(pathname: string) {
  if (pathname.includes("/support")) return "Support";
  if (pathname.includes("/settings")) return "Settings";
  if (pathname.includes("/kora-admin")) return "Platform Control";
  if (pathname.includes("/operations")) return "Tenant Operations";
  if (pathname.includes("/business-admin")) return "Tenant Operations";
  if (pathname.includes("/dashboard/ai")) return "Monitoring & AI";
  return "Workspace";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { userRole, isAuthenticated, isLoading } = useAuthContext();
  const workspaceLabel = useMemo(() => getWorkspaceLabel(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }
    const close = () => setUserMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [userMenuOpen]);

  if (isLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "var(--color-bg)", color: "var(--color-text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
        Loading workspace…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "var(--color-bg)", color: "var(--color-text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
        Resolving workspace…
      </div>
    );
  }

  const currentRole = userRole as UserRole;
  const orgName = localStorage.getItem("kora_org_name") ?? "Demo Organization";
  const initials = orgName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarWidth = sidebarCollapsed ? 92 : 344;
  const mainMargin = sidebarCollapsed ? 92 : 344;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 14%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 92%, transparent), color-mix(in srgb, #020612 92%, transparent))"
      }}
    >
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 76,
          display: "grid",
          gridTemplateColumns: "auto minmax(260px, 420px) auto",
          alignItems: "center",
          gap: 18,
          padding: "0 20px",
          zIndex: 100,
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, transparent), color-mix(in srgb, var(--color-surface-2) 80%, transparent))",
          borderBottom: "1px solid color-mix(in srgb, var(--color-border) 78%, var(--color-accent) 22%)",
          backdropFilter: "blur(18px)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            style={{ ...iconButtonStyle, width: 42, height: 42, borderRadius: 14 }}
            aria-label="Toggle sidebar"
          >
            <span style={{ fontSize: 16 }}>☰</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(currentRole === "platform_admin" || currentRole === "kora_admin" ? "/app/kora-admin/tenants" : "/app/business-admin")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              color: "inherit"
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-surface) 82%), color-mix(in srgb, var(--color-surface-2) 90%, transparent))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
                boxShadow: "var(--glow-accent)"
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "var(--color-accent)",
                  fontFamily: "'DM Mono', monospace"
                }}
              >
                K
              </span>
            </span>

            {!sidebarCollapsed ? (
              <span>
                <span
                  style={{
                    display: "block",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--color-text-primary)"
                  }}
                >
                  KORA
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontFamily: "'DM Mono', monospace"
                  }}
                >
                  Enterprise Workspace
                </span>
              </span>
            ) : null}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("kora:open-command-palette"))}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderRadius: 16,
              padding: "12px 14px",
              border: "1px solid color-mix(in srgb, var(--color-border) 76%, var(--color-accent) 24%)",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, transparent), color-mix(in srgb, var(--color-surface-2) 94%, transparent))",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              boxShadow: "var(--shadow-shell)"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "var(--color-accent)" }}>⌕</span>
              <span style={{ fontSize: 13 }}>Search, jump to a module, or run a workflow</span>
            </span>
            <span
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid var(--color-border)",
                background: "color-mix(in srgb, var(--color-surface) 76%, transparent)",
                fontSize: 11,
                color: "var(--color-text-muted)",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              ⌘K
            </span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, var(--color-border) 78%, transparent)",
              background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
              minWidth: 0
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--color-success)",
                boxShadow: "0 0 14px color-mix(in srgb, var(--color-success) 65%, transparent)"
              }}
            />
            <span
              style={{
                maxWidth: 168,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-primary)"
              }}
            >
              {orgName}
            </span>
            <span
              style={{
                padding: "3px 7px",
                borderRadius: 999,
                background: "var(--color-accent-dim)",
                color: "var(--color-accent)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {workspaceLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(getAiDestination(currentRole))}
            style={{
              ...iconButtonStyle,
              width: "auto",
              minWidth: 124,
              padding: "0 14px",
              gap: 8,
              borderRadius: 14,
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 12%, var(--color-surface) 88%), color-mix(in srgb, var(--color-surface-2) 92%, transparent))",
              color: "var(--color-text-primary)",
              border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
              boxShadow: "var(--glow-accent)"
            }}
          >
            <span style={{ color: "var(--color-accent)" }}>✦</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>KORA AI</span>
          </button>

          <ThemeSwitcher />

          <button type="button" style={iconButtonStyle} aria-label="Notifications">
            <span style={{ fontSize: 15 }}>◌</span>
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "var(--color-danger)",
                color: "var(--color-text-inverse)",
                fontSize: 9,
                fontFamily: "'DM Mono', monospace"
              }}
            >
              3
            </span>
          </button>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setUserMenuOpen((value) => !value);
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: "1px solid color-mix(in srgb, var(--color-accent) 24%, transparent)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 10%, var(--color-surface) 90%), color-mix(in srgb, var(--color-surface-2) 92%, transparent))",
                color: "var(--color-accent)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "var(--glow-accent)",
                fontWeight: 700
              }}
            >
              {initials}
            </button>
            {userMenuOpen ? (
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 50,
                  right: 0,
                  width: 220,
                  padding: 8,
                  borderRadius: 18,
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
                  border: "1px solid color-mix(in srgb, var(--color-border) 74%, var(--color-accent) 26%)",
                  boxShadow: "var(--shadow-shell)"
                }}
              >
                <div
                  style={{
                    padding: "10px 12px 12px",
                    marginBottom: 6,
                    borderBottom: "1px solid color-mix(in srgb, var(--color-border) 70%, transparent)"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{orgName}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--color-text-muted)" }}>
                    {currentRole.replace("_", " ")}
                  </div>
                </div>
                {["Profile", "Workspace Settings", "Sign out"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "var(--color-text-secondary)",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside
        style={{
          position: "fixed",
          top: 76,
          left: 0,
          width: sidebarWidth,
          height: "calc(100vh - 76px)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 95%, transparent), color-mix(in srgb, var(--color-surface-2) 94%, transparent))",
          borderRight: "1px solid color-mix(in srgb, var(--color-border) 78%, var(--color-accent) 22%)",
          transition: "width 220ms ease",
          overflowX: "hidden",
          overflowY: "auto",
          zIndex: 99,
          boxShadow: "var(--shadow-shell)"
        }}
      >
        <Sidebar collapsed={sidebarCollapsed} role={currentRole as UserRole} />
      </aside>

      <main
        style={{
          marginTop: 76,
          marginLeft: mainMargin,
          transition: "margin-left 220ms ease",
          minHeight: "calc(100vh - 76px)",
          padding: 22
        }}
      >
        {children}
      </main>
    </div>
  );
}

const iconButtonStyle: CSSProperties = {
  position: "relative",
  width: 42,
  height: 42,
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-border) 76%, var(--color-accent) 24%)",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, transparent), color-mix(in srgb, var(--color-surface-2) 94%, transparent))",
  color: "var(--color-text-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "var(--shadow-shell)"
};
