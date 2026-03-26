import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface AccordionSection {
  id: string;
  label: string;
  icon: string;
  items: AccordionItem[];
}

export interface AccordionItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface AccordionNavProps {
  sections: AccordionSection[];
  defaultExpandedId?: string;
}

export function AccordionNav({ sections, defaultExpandedId }: AccordionNavProps) {
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId ?? null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSection = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isItemActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {sections.map((section) => (
        <div key={section.id} style={{ display: "flex", flexDirection: "column" }}>
          {/* Section Header */}
          <button
            onClick={() => toggleSection(section.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              background: expandedId === section.id ? "var(--color-surface)" : "transparent",
              border: "none",
              borderRadius: 8,
              color: expandedId === section.id ? "var(--color-accent)" : "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 140ms",
              fontFamily: "inherit",
              textAlign: "left"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              if (expandedId !== section.id) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: 16 }}>{section.icon}</span>
            <span style={{ flex: 1 }}>{section.label}</span>
            <span
              style={{
                fontSize: 12,
                transition: "transform 140ms",
                transform: expandedId === section.id ? "rotate(180deg)" : "rotate(0deg)"
              }}
            >
              ▼
            </span>
          </button>

          {/* Section Items (Collapse/Expand) */}
          {expandedId === section.id && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                paddingLeft: 20,
                paddingTop: 4,
                marginTop: 4,
                borderLeft: "2px solid var(--color-border)",
                animation: "slideDown 140ms ease-out"
              }}
            >
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    background: isItemActive(item.path) ? "var(--color-accent)20" : "transparent",
                    border: isItemActive(item.path)
                      ? "1px solid var(--color-accent)"
                      : "1px solid transparent",
                    borderRadius: 6,
                    color: isItemActive(item.path)
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 100ms",
                    fontFamily: "inherit",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    if (!isItemActive(item.path)) {
                      e.currentTarget.style.background = "var(--color-surface-2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isItemActive(item.path)) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
