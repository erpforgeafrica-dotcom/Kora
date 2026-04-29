import { useCallback, useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useOrganization, useUser } from "@clerk/shared/react";
import { normalizeDashboardRole, type DashboardRole } from "../auth/dashboardAccess";

type SafeClerkAuth = {
  isLoaded?: boolean;
  isSignedIn?: boolean;
  sessionId?: string | null;
  getToken?: () => Promise<string | null>;
  signOut?: () => void;
};

type SafeClerkUser = {
  id?: string | null;
  publicMetadata?: Record<string, unknown>;
};

type SafeMembership = {
  role?: string;
};

type SafeOrganization = {
  id?: string | null;
};

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
  let clerkAuth: SafeClerkAuth | null = null;
  let user: SafeClerkUser | null = null;
  let membership: SafeMembership | null = null;
  let organization: SafeOrganization | null = null;
  let userLoaded = true;
  let orgLoaded = true;

  try {
    clerkAuth = useClerkAuth();
  } catch {
    clerkAuth = null;
  }

  try {
    const userState = useUser();
    user = (userState.user as SafeClerkUser | null) ?? null;
    userLoaded = userState.isLoaded;
  } catch {
    user = null;
    userLoaded = true;
  }

  try {
    const organizationState = useOrganization();
    organization = (organizationState.organization as SafeOrganization | null) ?? null;
    membership = (organizationState.membership as SafeMembership | null) ?? null;
    orgLoaded = organizationState.isLoaded;
  } catch {
    organization = null;
    membership = null;
    orgLoaded = true;
  }

  const getStoredValue = (key: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  };

  const [token, setTokenState] = useState<string | null>(() => getStoredValue("kora_token"));
  const [error, setError] = useState<string | null>(null);

  // Clerk v5: isLoaded, isSignedIn, getToken, signOut are on useAuth()
  const isLoaded = clerkAuth?.isLoaded ?? true;
  const isSignedIn = clerkAuth?.isSignedIn ?? false;
  const sessionId = clerkAuth?.sessionId ?? null;
  const getToken: () => Promise<string | null> = clerkAuth?.getToken ?? (async () => getStoredValue("kora_token"));
  const signOut: () => void = clerkAuth?.signOut ?? (() => {});

  const hasLocalToken = !!token;
  const isLoading = isSignedIn ? (!isLoaded || !userLoaded || !orgLoaded) : false;

  const resolveRole = useCallback((): DashboardRole | null => {
    const storedRole = normalizeDashboardRole(getStoredValue("kora_user_role"));
    if (!user) return storedRole;
    const clerkOrgRole = (membership as any)?.role as string | undefined;
    const metaRole = (user.publicMetadata as any)?.role as string | undefined;
    return normalizeDashboardRole(clerkOrgRole ?? metaRole ?? storedRole ?? "client");
  }, [user, membership]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setTokenState(getStoredValue("kora_token"));
      return;
    }
    getToken().then(t => {
      setTokenState(t);
      if (typeof window === "undefined") return;
      if (t) window.localStorage.setItem("kora_token", t);
      else window.localStorage.removeItem("kora_token");
    }).catch(() => setTokenState(null));
  }, [isLoaded, isSignedIn, getToken, sessionId]);

  useEffect(() => {
    if (organization?.id && typeof window !== "undefined") {
      window.localStorage.setItem("kora_org_id", organization.id);
    }
  }, [organization?.id]);

  const orgId = organization?.id ?? getStoredValue("kora_org_id") ?? "org_placeholder";
  const userRole = resolveRole();

  return {
    isAuthenticated: isSignedIn || hasLocalToken,
    isLoading,
    orgId,
    organizationId: orgId,
    token,
    userId: user?.id ?? null,
    sessionId,
    userRole,
    error,
    setToken: async (t: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kora_token", t);
      }
      setTokenState(t);
    },
    setOrgId: (id: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kora_org_id", id);
      }
    },
    logout: () => {
      signOut();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("kora_token");
        window.localStorage.removeItem("kora_org_id");
        window.localStorage.removeItem("kora_user_role");
        window.localStorage.removeItem("kora_user_email");
      }
      setTokenState(null);
    },
    setError,
  };
}
