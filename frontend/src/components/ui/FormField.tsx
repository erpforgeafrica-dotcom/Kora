import { type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export default function FormField({
  label,
  error,
  helperText,
  required,
  id,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={fieldId}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-primary)",
          fontFamily: "'DM Mono', monospace"
        }}
      >
        {label}
        {required && <span style={{ color: "var(--color-danger)", marginLeft: 4 }}>*</span>}
      </label>
      
      <input
        id={fieldId}
        {...inputProps}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: error ? "1px solid var(--color-danger)" : "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
          color: "var(--color-text-primary)",
          fontSize: 13,
          fontFamily: "'DM Mono', monospace",
          transition: "border-color 140ms ease",
          outline: "none",
          ...inputProps.style
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--color-accent)";
          }
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--color-border)";
          }
          inputProps.onBlur?.(e);
        }}
      />
      
      {error && (
        <span
          style={{
            fontSize: 12,
            color: "var(--color-danger)",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
