import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"], duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const fallbackToastContext: ToastContextValue = {
  toasts: [],
  showToast: (message, type = "info") => {
    console.warn(`[kora-toast:${type}] ${message}`);
  },
  hideToast: () => {}
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info", duration = 3000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      window.setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn("ToastProvider context unavailable. Falling back to no-op toast handling.");
    return fallbackToastContext;
  }
  return context;
}

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 88,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 420
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

export function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const colors = {
    success: {
      bg: "color-mix(in srgb, #10b981 14%, var(--color-surface))",
      border: "#10b981",
      text: "#9ef0ce"
    },
    error: {
      bg: "color-mix(in srgb, var(--color-danger) 16%, var(--color-surface))",
      border: "var(--color-danger)",
      text: "#ffd3d0"
    },
    warning: {
      bg: "color-mix(in srgb, var(--color-warning) 16%, var(--color-surface))",
      border: "var(--color-warning)",
      text: "#ffe5b8"
    },
    info: {
      bg: "color-mix(in srgb, var(--color-accent) 16%, var(--color-surface))",
      border: "var(--color-accent)",
      text: "var(--color-text-primary)"
    }
  } as const;

  const style = colors[toast.type];

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "var(--shadow-shell)"
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: style.text,
          fontFamily: "'DM Mono', monospace",
          lineHeight: 1.6,
          flex: 1
        }}
      >
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          color: style.text,
          cursor: "pointer",
          fontSize: 16,
          padding: 0
        }}
      >
        x
      </button>
    </div>
  );
}
