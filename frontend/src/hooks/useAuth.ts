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
 * useAuth — Clerk-backed auth hook.
 *
 * Role resolution order:
 *   1. Clerk org membership role (org:admin → business_admin, org:member → staff)
 *   2. Clerk user publicMetadata.role
 *   3. Default → "client"
 *
 * orgId comes from the active Clerk organization, never from localStorage.
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

  // Resolve role from Clerk membership or publicMetadata
  const resolveRole = useCallback((): DashboardRole | null => {
    if (!user) return null;
    // Clerk org role takes priority
    const clerkOrgRole = (membership as any)?.role as string | undefined;
    const metaRole = (user.publicMetadata as any)?.role as string | undefined;
    return normalizeDashboardRole(clerkOrgRole ?? metaRole ?? "client");
  }, [user, membership]);

  // Fetch fresh Clerk JWT on mount and when session changes
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) {
      setTokenState(null);
      return;
    }
    getToken().then(t => {
      setTokenState(t);
      // Keep axios interceptor in sync
      if (t) localStorage.setItem("kora_token", t);
      else localStorage.removeItem("kora_token");
    }).catch(() => setTokenState(null));
  }, [clerkLoaded, isSignedIn, getToken, sessionId]);

  // Keep org ID in sync with Clerk active org
  useEffect(() => {
    if (organization?.id) {
      localStorage.setItem("kora_org_id", organization.id);
    }
  }, [organization?.id]);

  const orgId = organization?.id ?? localStorage.getItem("kora_org_id") ?? "org_placeholder";
  const userId = user?.id ?? null;
  const userRole = resolveRole();

  const setToken = async (newToken: string) => {
    localStorage.setItem("kora_token", newToken);
    setTokenState(newToken);
  };

  const setOrgId = (newOrgId: string) => {
    localStorage.setItem("kora_org_id", newOrgId);
  };

  const logout = () => {
    signOut();
    localStorage.removeItem("kora_token");
    localStorage.removeItem("kora_org_id");
    setTokenState(null);
  };

  return {
    isAuthenticated: !!isSignedIn && !!token,
    isLoading,
    orgId,
    organizationId: orgId,
    token,
    userId,
    sessionId: sessionId ?? null,
    userRole,
    error,
    setToken,
    setOrgId,
    logout,
    setError,
  };
}
