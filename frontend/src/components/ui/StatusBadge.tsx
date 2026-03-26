interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: {
    background: "var(--color-surface-2)",
    color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border)"
  },
  success: {
    background: "color-mix(in srgb, #10b981 10%, transparent)",
    color: "#10b981",
    border: "1px solid #10b981"
  },
  warning: {
    background: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
    color: "var(--color-warning)",
    border: "1px solid var(--color-warning)"
  },
  danger: {
    background: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
    color: "var(--color-danger)",
    border: "1px solid var(--color-danger)"
  },
  info: {
    background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)"
  }
};

export default function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const autoVariant = getAutoVariant(status);
  const finalVariant = variant === "default" ? autoVariant : variant;
  const styles = variantStyles[finalVariant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono', monospace",
        ...styles
      }}
    >
      {status}
    </span>
  );
}

function getAutoVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  const lower = status.toLowerCase();
  
  if (["completed", "confirmed", "active", "approved", "paid", "success"].includes(lower)) {
    return "success";
  }
  
  if (["pending", "in_progress", "processing", "scheduled"].includes(lower)) {
    return "warning";
  }
  
  if (["cancelled", "failed", "rejected", "error", "no_show"].includes(lower)) {
    return "danger";
  }
  
  if (["new", "draft", "queued"].includes(lower)) {
    return "info";
  }
  
  return "default";
}
