import { useState } from "react";

export interface NavSection {
  id: string;
  icon: string;
  label: string;
  items: NavItem[];
}

export interface NavItem {
  icon: string;
  label: string;
  path: string;
  badge?: number;
}

interface AccordionNavProps {
  sections: NavSection[];
  onNavigate: (path: string) => void;
  activePath: string;
}

export function AccordionNav({ sections, onNavigate, activePath }: AccordionNavProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 0"
      }}
    >
      {sections.map((section) => (
        <div key={section.id}>
          {/* Section Header */}
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 16px",
              width: "100%",
              cursor: "pointer",
              transition: "all 140ms ease",
              background:
                expandedId === section.id ? "var(--color-accent-soft)" : "transparent",
              border: "none",
              color:
                expandedId === section.id
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              margin: "2px 8px",
              letterSpacing: "0.12em"
            }}
            onMouseEnter={(e) => {
              if (expandedId !== section.id) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-accent-soft)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (expandedId !== section.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--color-text-muted)";
              }
            }}
          >
            <span style={{ fontSize: 16, minWidth: 24, textAlign: "center" }}>
              {section.icon}
            </span>
            <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
            <span
              style={{
                fontSize: 12,
                transition: "transform 140ms ease",
                transform: expandedId === section.id ? "rotate(180deg)" : "rotate(0deg)"
              }}
            >
              ▼
            </span>
          </button>

          {/* Section Items - Expandable */}
          {expandedId === section.id && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "4px 24px 8px 24px",
                animation: "slideDown 140ms ease-out"
              }}
            >
              {section.items.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    transition: "all 100ms ease",
                    background:
                      activePath === item.path
                        ? "var(--color-accent-soft)"
                        : "transparent",
                    border:
                      activePath === item.path
                        ? "1px solid var(--color-accent)"
                        : "1px solid transparent",
                    color:
                      activePath === item.path
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    borderRadius: 6,
                    textAlign: "left",
                    letterSpacing: "0.08em"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--color-accent-dim)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      activePath === item.path ? "var(--color-accent-soft)" : "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      activePath === item.path
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)";
                  }}
                >
                  <span style={{ fontSize: 14, minWidth: 18, textAlign: "center" }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--color-warning)",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
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
