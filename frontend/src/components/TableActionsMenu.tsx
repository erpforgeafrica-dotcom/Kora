import { useState } from "react";

interface TableActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onCreate?: () => void;
}

export function TableActionsMenu({
  onView,
  onEdit,
  onDelete,
  onExport,
  onCreate
}: TableActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    onCreate && { label: "Create", icon: "➕", onClick: onCreate },
    onView && { label: "View", icon: "👁", onClick: onView },
    onEdit && { label: "Edit", icon: "✏️", onClick: onEdit },
    onDelete && { label: "Delete", icon: "🗑️", onClick: onDelete, danger: true },
    onExport && { label: "Export", icon: "📥", onClick: onExport }
  ].filter(Boolean) as Array<{ label: string; icon: string; onClick: () => void; danger?: boolean }>;

  const handleAction = (action: { onClick: () => void }) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 12px",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          color: "var(--color-text-primary)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
      >
        ⋮ Actions
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
            minWidth: 180
          }}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleAction(action)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                textAlign: "left",
                color: action.danger ? "var(--color-danger)" : "var(--color-text-primary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: idx < actions.length - 1 ? "1px solid var(--color-border)" : "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 14 }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
