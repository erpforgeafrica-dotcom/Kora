import { useNotification, type Notification } from "../../contexts/NotificationContext";

const ICON_MAP = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ"
};

const COLOR_MAP = {
  success: "var(--color-success)",
  error: "var(--color-danger)",
  warning: "var(--color-warning)",
  info: "var(--color-accent)"
};

export function NotificationCenter() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 16,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 400,
        pointerEvents: "none"
      }}
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            pointerEvents: "all",
            padding: "12px 16px",
            background: "var(--color-surface)",
            border: `1px solid ${COLOR_MAP[notif.type]}40`,
            borderLeft: `4px solid ${COLOR_MAP[notif.type]}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            animation: "slideIn 0.3s ease-out",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: COLOR_MAP[notif.type],
              fontWeight: 700,
              minWidth: 20
            }}
          >
            {ICON_MAP[notif.type]}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: 2
              }}
            >
              {notif.title}
            </div>
            {notif.message && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)"
                }}
              >
                {notif.message}
              </div>
            )}
          </div>
          <button
            onClick={() => removeNotification(notif.id)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: 14,
              padding: 0,
              minWidth: 20,
              textAlign: "center"
            }}
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
