import { useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth, useOrganization, useUser } from "@clerk/clerk-react";
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
 * useAuth — Clerk-backed.
 * Role: Clerk org membership role → publicMetadata.role → "client"
 * orgId: Clerk active organization — never from headers or localStorage alone
 */
export function useAuth(): AuthState & {
  setToken: (token: string) => Promise<void>;
  setOrgId: (orgId: string) => void;
  logout: () => void;
  setError: (message: string | null) => void;
} {
  const { isLoaded: clerkLoaded, isSignedIn, getToken, signOut, sessionId } = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();

  const [token, setTokenState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = !clerkLoaded || !userLoaded || !orgLoaded;

  const resolveRole = useCallback((): DashboardRole | null => {
    if (!user) return null;
    const clerkOrgRole = (membership as any)?.role as string | undefined;
    const metaRole = (user.publicMetadata as any)?.role as string | undefined;
    return normalizeDashboardRole(clerkOrgRole ?? metaRole ?? "client");
  }, [user, membership]);

  // Refresh Clerk JWT whenever session changes
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) { setTokenState(null); return; }
    getToken().then(t => {
      setTokenState(t);
      if (t) localStorage.setItem("kora_token", t);
      else localStorage.removeItem("kora_token");
    }).catch(() => setTokenState(null));
  }, [clerkLoaded, isSignedIn, getToken, sessionId]);

  // Keep org ID in localStorage for axios interceptor
  useEffect(() => {
    if (organization?.id) localStorage.setItem("kora_org_id", organization.id);
  }, [organization?.id]);

  const orgId = organization?.id ?? localStorage.getItem("kora_org_id") ?? "org_placeholder";

  return {
    isAuthenticated: !!isSignedIn && !!token,
    isLoading,
    orgId,
    organizationId: orgId,
    token,
    userId: user?.id ?? null,
    sessionId: sessionId ?? null,
    userRole: resolveRole(),
    error,
    setToken: async (t: string) => { localStorage.setItem("kora_token", t); setTokenState(t); },
    setOrgId: (id: string) => { localStorage.setItem("kora_org_id", id); },
    logout: () => { signOut(); localStorage.removeItem("kora_token"); localStorage.removeItem("kora_org_id"); setTokenState(null); },
    setError,
  };
}
