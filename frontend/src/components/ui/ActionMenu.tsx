import { useState, useRef, useEffect } from "react";

interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  icon?: string;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export default function ActionMenu({ items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
          transition: "all 140ms ease"
        }}
      >
        ⋯
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: 160,
            padding: 6,
            borderRadius: 10,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 12px 28px color-mix(in srgb, var(--color-bg) 50%, transparent)",
            zIndex: 1000
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: item.variant === "danger" ? "var(--color-danger)" : "var(--color-text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 100ms ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
