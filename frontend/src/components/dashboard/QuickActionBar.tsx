import { useNotification, type Notification } from "../../contexts/NotificationContext";

export interface QuickActionItem {
  id: string;
  icon: string;
  label: string;
  onClick: () => void | Promise<void>;
  color?: string;
}

export interface QuickActionBarProps {
  actions: QuickActionItem[];
}

export function QuickActionBar({ actions }: QuickActionBarProps) {
  const { addNotification } = useNotification();

  const handleAction = async (action: QuickActionItem) => {
    try {
      await action.onClick();
      addNotification({
        type: "success",
        title: "Action Completed",
        message: `${action.label} executed successfully`
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Action Failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        gap: 12,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 8,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)"
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action)}
          title={action.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: action.color ?? "var(--color-accent)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 140ms",
            fontFamily: "inherit"
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.transform = "scale(1.05)";
            btn.style.boxShadow = `0 4px 16px ${action.color || "var(--color-accent)"}40`;
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            btn.style.transform = "";
            btn.style.boxShadow = "";
          }}
        >
          <span style={{ fontSize: 16 }}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
