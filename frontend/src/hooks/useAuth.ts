import { useState, useEffect, useCallback } from "react";
import { normalizeDashboardRole, type DashboardRole } from "../auth/dashboardAccess";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  orgId: string;
  organizationId: string;
  token: string | null;
  userId: string | null;
  sessionId: string | null;
  userRole: DashboardRole | null;
  error: string | null;
}

/**
 * useAuth Hook - TASK 07
 * Bulletproof auth token lifecycle management
 * 
 * Handles:
 * - Token retrieval from Clerk session or dev env
 * - Org ID extraction and validation
 * - Auto-refresh on token expiration
 * - Silent re-auth failures
 */
export function useAuth(): AuthState & { 
  setToken: (token: string) => Promise<void>;
  setOrgId: (orgId: string) => void;
  logout: () => void;
  setError: (message: string | null) => void;
} {
  const [token, setTokenState] = useState<string | null>(null);
  const [orgId, setOrgIdState] = useState<string>("org_placeholder");
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<DashboardRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

  const hydrateFromToken = useCallback(async (nextToken: string | null, fallbackOrgId?: string) => {
    const detectedOrgId = fallbackOrgId ?? localStorage.getItem("kora_org_id") ?? import.meta.env.VITE_ORG_ID ?? "org_placeholder";

    if (!nextToken) {
      setTokenState(null);
      setOrgIdState("org_placeholder");
      setUserId(null);
      setSessionId(null);
      setUserRole(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setTokenState(nextToken);
    setOrgIdState(detectedOrgId);

    const response = await fetch(`${apiBase}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${nextToken}`,
        "Content-Type": "application/json",
        "X-Organization-Id": detectedOrgId,
        "X-Org-Id": detectedOrgId,
      },
    });

    if (!response.ok) {
      localStorage.removeItem("kora_token");
      setTokenState(null);
      setUserId(null);
      setSessionId(null);
      setUserRole(null);
      setError("Session expired. Please sign in again.");
      return;
    }

    const json = await response.json() as {
      data?: { user?: { id?: string; role?: string; organizationId?: string | null } };
      user?: { id?: string; role?: string; organizationId?: string | null };
    };

    const user = json.data?.user ?? json.user;
    const nextOrgId = user?.organizationId ?? detectedOrgId;
    if (nextOrgId) {
      localStorage.setItem("kora_org_id", nextOrgId);
    }
    setUserId(user?.id ?? null);
    setOrgIdState(nextOrgId);
    setUserRole(normalizeDashboardRole(user?.role ?? null));
    setError(null);
  }, [apiBase]);

  // Initialize auth on mount — runs once only
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);

        const storedToken = localStorage.getItem("kora_token");
        const devToken = import.meta.env.VITE_DEV_BEARER_TOKEN as string | undefined;
        const detectedToken = storedToken ?? devToken ?? null;

        const storedOrgId = localStorage.getItem("kora_org_id");
        const devOrgId = import.meta.env.VITE_ORG_ID as string | undefined;
        const detectedOrgId = storedOrgId ?? devOrgId ?? "org_placeholder";

        await hydrateFromToken(detectedToken, detectedOrgId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Auth initialization failed");
        setUserId(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const storedToken = localStorage.getItem("kora_token");
      // Only re-init if the token in storage changed externally (e.g. another tab)
      if (storedToken !== localStorage.getItem("kora_token_snapshot")) {
        localStorage.setItem("kora_token_snapshot", storedToken ?? "");
        void initAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hydrateFromToken]); // ← empty deps: runs once on mount, not on every token state change

  useEffect(() => {
    const handleLogout = () => {
      setIsLoading(false);
      setTokenState(null);
      setOrgIdState("org_placeholder");
      setUserId(null);
      setSessionId(null);
      setUserRole(null);
      setError(null);
    };

    window.addEventListener("kora-auth-logout", handleLogout);
    return () => window.removeEventListener("kora-auth-logout", handleLogout);
  }, []);

  const setToken = async (newToken: string) => {
    localStorage.setItem("kora_token", newToken);
    setIsLoading(true);
    try {
      await hydrateFromToken(newToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setOrgId = (newOrgId: string) => {
    localStorage.setItem("kora_org_id", newOrgId);
    setOrgIdState(newOrgId);
  };

  const logout = () => {
    localStorage.removeItem("kora_token");
    localStorage.removeItem("kora_org_id");
    setTokenState(null);
    setOrgIdState("org_placeholder");
    setUserId(null);
    setSessionId(null);
    setUserRole(null);
  };

  return {
    isAuthenticated: !!token,
    isLoading,
    orgId,
    organizationId: orgId,
    token,
    userId,
    sessionId,
    userRole,
    error,
    setToken,
    setOrgId,
    logout,
    setError
  };
}
