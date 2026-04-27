import { useCallback, useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useOrganization, useUser } from "@clerk/shared/react";
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
 * useAuth — Clerk v5 backed.
 * Role: Clerk org membership role → publicMetadata.role → "client"
 * orgId: Clerk active organization
 */
export function useAuth(): AuthState & {
  setToken: (token: string) => Promise<void>;
  setOrgId: (orgId: string) => void;
  logout: () => void;
  setError: (message: string | null) => void;
} {
  const clerkAuth = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();

  const [token, setTokenState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clerk v5: isLoaded, isSignedIn, getToken, signOut are on useAuth()
  const isLoaded = (clerkAuth as any).isLoaded ?? true;
  const isSignedIn = (clerkAuth as any).isSignedIn ?? false;
  const sessionId = (clerkAuth as any).sessionId ?? null;
  const getToken: () => Promise<string | null> = clerkAuth.getToken;
  const signOut: () => void = (clerkAuth as any).signOut ?? (() => {});

  const isLoading = !isLoaded || !userLoaded || !orgLoaded;

  const resolveRole = useCallback((): DashboardRole | null => {
    if (!user) return null;
    const clerkOrgRole = (membership as any)?.role as string | undefined;
    const metaRole = (user.publicMetadata as any)?.role as string | undefined;
    return normalizeDashboardRole(clerkOrgRole ?? metaRole ?? "client");
  }, [user, membership]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) { setTokenState(null); return; }
    getToken().then(t => {
      setTokenState(t);
      if (t) localStorage.setItem("kora_token", t);
      else localStorage.removeItem("kora_token");
    }).catch(() => setTokenState(null));
  }, [isLoaded, isSignedIn, getToken, sessionId]);

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
    sessionId,
    userRole: resolveRole(),
    error,
    setToken: async (t: string) => { localStorage.setItem("kora_token", t); setTokenState(t); },
    setOrgId: (id: string) => { localStorage.setItem("kora_org_id", id); },
    logout: () => { signOut(); localStorage.removeItem("kora_token"); localStorage.removeItem("kora_org_id"); setTokenState(null); },
    setError,
  };
}
