import { ColumnSchema } from "../../types/schema";

interface DynamicFieldProps {
  column: ColumnSchema;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function DynamicField({ column, value, onChange, error }: DynamicFieldProps) {
  const { ui, type, required } = column;

  if (ui.hidden) return null;

  const baseStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--color-surface-2)",
    border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
    borderRadius: 6,
    color: "var(--color-text-primary)",
    fontSize: 14,
    fontFamily: "inherit"
  };

  const renderInput = () => {
    switch (ui.widget) {
      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={ui.placeholder}
            rows={4}
            style={baseStyle}
            disabled={ui.readonly}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={ui.readonly}
            style={{ width: 20, height: 20 }}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={baseStyle}
            disabled={ui.readonly}
          />
        );

      case "datetime":
        return (
          <input
            type="datetime-local"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={baseStyle}
            disabled={ui.readonly}
          />
        );

      case "hidden":
        return <input type="hidden" value={value || ""} />;

      default:
        return (
          <input
            type={type === "number" ? "number" : type === "string" ? "text" : "text"}
            value={value || ""}
            onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) : e.target.value)}
            required={required}
            placeholder={ui.placeholder}
            style={baseStyle}
            disabled={ui.readonly}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {ui.widget !== "hidden" && (
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--color-text-primary)" }}>
          {ui.label} {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
        </label>
      )}
      {renderInput()}
      {ui.helpText && <small style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", marginTop: 4 }}>{ui.helpText}</small>}
      {error && <small style={{ fontSize: 11, color: "var(--color-danger)", display: "block", marginTop: 4 }}>{error}</small>}
    </div>
  );
}
