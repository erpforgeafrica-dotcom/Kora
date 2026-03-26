import { useNavigate, useLocation } from "react-router-dom";
import type { DashboardRole } from "../../auth/dashboardAccess";
import { getMasterNav } from "../../data/masterDashboardNavigation";

interface AccordionNavigationProps {
  collapsed: boolean;
  userRole: DashboardRole;
}

export default function AccordionNavigation({
  collapsed,
  userRole
}: AccordionNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = getMasterNav(userRole);

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 0",
        overflow: "visible"
      }}
    >
      {nav.items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            style={{
              width: "calc(100% - 16px)",
              margin: "2px 8px",
              padding: collapsed ? "11px 12px" : "11px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: isActive ? "var(--color-accent-dim)" : "transparent",
              border: isActive ? "1px solid var(--color-accent)" : "1px solid transparent",
              color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 140ms ease",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textAlign: "left"
            }}
            title={collapsed ? item.label : undefined}
            type="button"
          >
            <span style={{ minWidth: 20, textAlign: "center" }}>•</span>
            <span
              style={{
                opacity: collapsed ? 0 : 1,
                transition: "opacity 150ms",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
