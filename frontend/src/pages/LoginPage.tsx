import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { normalizeErrorResponse, normalizeLoginResponse, renderSafeString } from "@/services/normalizers";
import { getDefaultDashboardPath, normalizeDashboardRole } from "../auth/dashboardAccess";

export default function LoginPage() {
  const { setToken, isLoading, userRole, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorMessage =
    error == null
      ? null
      : typeof error === "string"
        ? error
        : typeof error === "object" && "message" in (error as Record<string, unknown>)
          ? renderSafeString((error as { message?: unknown }).message)
          : renderSafeString(error);

  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole) {
      navigate(getDefaultDashboardPath(userRole), { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, userRole]);

  if (!isLoading && isAuthenticated && userRole) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(normalizeErrorResponse(json).message);
        return;
      }

      const login = normalizeLoginResponse(json);
      await setToken(login.accessToken);
      const returnedRole = normalizeDashboardRole(login.user.role ?? null);
      navigate(returnedRole ? getDefaultDashboardPath(returnedRole) : "/app", { replace: true });
    } catch {
      setError("Unable to reach the server. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--color-bg)" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 32, borderRadius: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--color-accent)", fontFamily: "'DM Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>
          KÓRA Platform
        </div>
        <h1 style={{ margin: "0 0 24px", fontSize: 22, color: "var(--color-text-primary)" }}>Sign in</h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {errorMessage && (
            <div style={{ fontSize: 12, color: "var(--color-danger)", padding: "10px 12px", borderRadius: 8, background: "color-mix(in srgb, var(--color-danger) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 24%, transparent)" }}>
              {errorMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "12px 0", borderRadius: 10, border: "none", background: "var(--color-accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text-primary)",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
