import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, LayoutGrid, User, Clock, Users, Map, Calendar, Briefcase,
  Tag, DollarSign, Megaphone, Settings, Activity, AlertTriangle,
  Headphones, Truck, Globe, Building2, Shield, Boxes, type LucideIcon,
} from "lucide-react";
import { getNavigationForRole, type NavSection, type UserRole } from "../../config/navigation";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home, grid: LayoutGrid, user: User, clock: Clock, users: Users,
  map: Map, calendar: Calendar, briefcase: Briefcase, tag: Tag,
  dollar: DollarSign, megaphone: Megaphone, settings: Settings,
  activity: Activity, alert: AlertTriangle, headset: Headphones,
  truck: Truck, globe: Globe, building: Building2, shield: Shield, boxes: Boxes,
};

interface SidebarProps {
  collapsed?: boolean;
  role: UserRole;
}

function pathMatchesSection(section: NavSection, pathname: string, search: string): boolean {
  return section.children.some((c) => {
    const [cp, cq] = c.path.split("?");
    if (cp !== pathname) return false;
    if (!cq) return true;
    const cur = new URLSearchParams(search);
    const tgt = new URLSearchParams(cq);
    return Array.from(tgt.entries()).every(([k, v]) => cur.get(k) === v);
  });
}

function isChildActive(path: string, pathname: string, search: string): boolean {
  const [cp, cq] = path.split("?");
  if (cp !== pathname) return false;
  if (!cq) return true;
  const cur = new URLSearchParams(search);
  const tgt = new URLSearchParams(cq);
  return Array.from(tgt.entries()).every(([k, v]) => cur.get(k) === v);
}

export default function Sidebar({ collapsed = false, role }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sections = getNavigationForRole(role).filter((s) => !s.hidden);
  const initialized = useRef(false);

  const [openId, setOpenId] = useState<string | null>(() => {
    const active = sections.find((s) => pathMatchesSection(s, location.pathname, location.search));
    return active?.id ?? sections[0]?.id ?? null;
  });

  // Auto-expand section when route changes externally
  useEffect(() => {
    const active = sections.find((s) => pathMatchesSection(s, location.pathname, location.search));
    if (active && active.id !== openId) {
      setOpenId(active.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  function handleParentClick(section: NavSection) {
    if (openId === section.id) {
      // Already open — navigate to overview
      navigate(section.overviewPath);
    } else {
      // Open this section and navigate to its overview
      setOpenId(section.id);
      navigate(section.overviewPath);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        paddingTop: 12,
        paddingBottom: 24,
      }}
    >
      {sections.map((section) => {
        const isOpen = openId === section.id;
        const Icon = ICON_MAP[section.icon] ?? Activity;
        const hasActiveChild = pathMatchesSection(section, location.pathname, location.search);

        return (
          <div key={section.id} style={{ marginBottom: 2 }}>
            {/* Parent row */}
            <button
              type="button"
              title={collapsed ? section.title : undefined}
              onClick={() => handleParentClick(section)}
              style={{
                width: "calc(100% - 16px)",
                margin: "1px 8px",
                padding: collapsed ? "11px 12px" : "11px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isOpen || hasActiveChild
                  ? "var(--color-accent-soft)"
                  : "transparent",
                border: "none",
                borderRadius: 10,
                color: isOpen || hasActiveChild
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "all 140ms ease",
                textAlign: "left",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", minWidth: 18, flexShrink: 0 }}>
                <Icon size={14} />
              </span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1, lineHeight: 1.3 }}>{section.title}</span>
                  <span
                    style={{
                      fontSize: 10,
                      transition: "transform 140ms ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.6,
                    }}
                  >
                    ▼
                  </span>
                </>
              )}
            </button>

            {/* Children — only shown when open */}
            {isOpen && !collapsed && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  paddingLeft: 28,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 6,
                  animation: "sidebarSlide 120ms ease-out",
                }}
              >
                {section.children
                  .filter((c) => !c.hidden)
                  .map((child) => {
                    const active = isChildActive(child.path, location.pathname, location.search);
                    return (
                      <button
                        key={child.path + child.label}
                        type="button"
                        onClick={() => navigate(child.path)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          background: active ? "var(--color-accent-dim)" : "transparent",
                          border: active
                            ? "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)"
                            : "1px solid transparent",
                          borderRadius: 8,
                          color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                          cursor: "pointer",
                          fontSize: 12,
                          transition: "all 100ms ease",
                          textAlign: "left",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: active ? "var(--color-accent)" : "var(--color-text-muted)",
                              flexShrink: 0,
                            }}
                          />
                          {child.label}
                        </span>
                        {child.badge && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 999,
                              background: "var(--color-accent-dim)",
                              color: "var(--color-accent)",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                            }}
                          >
                            {child.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes sidebarSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
