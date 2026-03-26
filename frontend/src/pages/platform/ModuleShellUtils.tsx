import type { ReactNode, CSSProperties } from "react";

/**
 * Utility function to extract error messages from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unknown error occurred";
}

/**
 * Format ISO datetime string to readable date format
 * @example "2024-01-15T10:30:00Z" -> "Jan 15, 2024 at 10:30"
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return isoString;
  }
}

/**
 * Format time string to HH:MM format
 * @example "14:30:00" -> "2:30 PM"
 */
export function formatClock(timeString: string): string {
  try {
    // Handle ISO datetime strings  
    if (timeString.includes("T")) {
      const date = new Date(timeString);
      return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    // Handle HH:MM:SS format
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
}

/**
 * Format number as currency with USD symbol
 * @example 1234.56 -> "$1,234.56"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

/**
 * Normalize amount values (handle cents vs dollars)
 */
export function normalizeAmount(transaction: {
  amount?: number;
  amount_cents?: number;
  amount_usd?: number;
}): number {
  if (transaction.amount !== undefined && transaction.amount !== null) {
    return transaction.amount;
  }
  if (transaction.amount_cents !== undefined && transaction.amount_cents !== null) {
    return transaction.amount_cents / 100;
  }
  if (transaction.amount_usd !== undefined && transaction.amount_usd !== null) {
    return transaction.amount_usd;
  }
  return 0;
}

/**
 * Truncate text to specified length with ellipsis
 * @example "This is a long text" (10) -> "This is a..."
 */
export function truncate(text: string, length: number = 80): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

// Style constants used by DataModuleShell and pages
export const inputStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  fontSize: "14px",
  fontFamily: "inherit",
  backgroundColor: "var(--color-bg-secondary)",
  color: "var(--color-text)",
  minWidth: "200px"
};

export const strongText: CSSProperties = {
  fontWeight: 600,
  color: "var(--color-text-strong)"
};

export const mutedText: CSSProperties = {
  fontSize: "12px",
  color: "var(--color-text-muted)",
  marginTop: "4px"
};

// DataModuleShell component - A reusable container for module pages
export type DataModuleShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  metrics: Array<{ label: string; value: string | number }>;
  isLoading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyText: string;
  filters?: ReactNode;
  columns: string[];
  rows: ReactNode[][];
};

export function DataModuleShell({
  eyebrow,
  title,
  summary,
  metrics,
  isLoading,
  error,
  emptyTitle,
  emptyText,
  filters,
  columns,
  rows
}: DataModuleShellProps) {
  if (isLoading) {
    return (
      <div style={{ padding: "24px", color: "var(--color-text-muted)" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px", color: "var(--color-text-danger)" }}>
        Error: {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: "24px", color: "var(--color-text-muted)" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
          {emptyTitle}
        </div>
        <div style={{ fontSize: "13px" }}>{emptyText}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
        {eyebrow}
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0" }}>
        {title}
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text)", margin: "0 0 24px 0" }}>
        {summary}
      </p>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {metrics.map((metric, idx) => (
          <div key={idx} style={{ borderRadius: "6px", padding: "12px", backgroundColor: "var(--color-bg-secondary)" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              {metric.label}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {filters && (
        <div style={{ marginBottom: "16px" }}>
          {filters}
        </div>
      )}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "12px",
                  textTransform: "uppercase"
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              style={{
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: rowIdx % 2 === 0 ? "transparent" : "var(--color-bg-secondary)"
              }}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} style={{ padding: "12px 8px", verticalAlign: "top" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
