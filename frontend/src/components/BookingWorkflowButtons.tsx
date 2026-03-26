import { useState } from "react";

interface BookingWorkflowButtonsProps {
  bookingId: string;
  status: string;
  onCheckIn?: () => void;
  onStartService?: () => void;
  onComplete?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onRefund?: () => void;
}

export function BookingWorkflowButtons({
  bookingId,
  status,
  onCheckIn,
  onStartService,
  onComplete,
  onReschedule,
  onCancel,
  onRefund
}: BookingWorkflowButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflows: Array<{
    status: string;
    action: string;
    button: { label: string; icon: string; onClick: () => void; danger?: boolean };
  }> = [];

  if (status === "pending") {
    workflows.push({
      status: "pending",
      action: "check-in",
      button: { label: "Check In", icon: "✓", onClick: onCheckIn || (() => {}) }
    });
  }

  if (status === "checked-in") {
    workflows.push({
      status: "checked-in",
      action: "start-service",
      button: { label: "Start Service", icon: "▶", onClick: onStartService || (() => {}) }
    });
  }

  if (status === "in-progress") {
    workflows.push({
      status: "in-progress",
      action: "complete",
      button: { label: "Complete", icon: "✓", onClick: onComplete || (() => {}) }
    });
  }

  if (["pending", "checked-in"].includes(status)) {
    workflows.push({
      status: status,
      action: "reschedule",
      button: { label: "Reschedule", icon: "🔄", onClick: onReschedule || (() => {}), danger: false }
    });
  }

  if (["pending", "checked-in", "in-progress"].includes(status)) {
    workflows.push({
      status: status,
      action: "cancel",
      button: { label: "Cancel", icon: "✕", onClick: onCancel || (() => {}), danger: true }
    });
  }

  if (["completed", "cancelled"].includes(status)) {
    workflows.push({
      status: status,
      action: "refund",
      button: { label: "Refund", icon: "💰", onClick: onRefund || (() => {}), danger: true }
    });
  }

  const currentWorkflow = workflows.filter(w => w.status === status).map(w => w.button);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {currentWorkflow.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.onClick}
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: btn.danger ? "rgba(239, 68, 68, 0.1)" : "var(--color-accent)",
            border: btn.danger ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--color-accent)",
            borderRadius: 6,
            color: btn.danger ? "var(--color-danger)" : "#0c0e14",
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            transition: "all 200ms"
          }}
        >
          <span style={{ fontSize: 14 }}>{btn.icon}</span>
          {btn.label}
        </button>
      ))}

      {error && (
        <span style={{ fontSize: 12, color: "var(--color-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
