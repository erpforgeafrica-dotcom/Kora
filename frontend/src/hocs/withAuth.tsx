// src/hocs/withAuth.tsx
// Role-based access control HOC
import React, { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import type { DashboardRole } from "../auth/dashboardAccess";

export type UserRole = DashboardRole;

interface WithAuthProps {
  // Will be injected by HOC
}

/**
 * HOC to protect routes by role
 * @param Component - Component to render
 * @param requiredRole - Role required to access (or array of roles)
 * @returns Protected component
 */
export function withAuth<P extends WithAuthProps = WithAuthProps>(
  Component: ComponentType<P>,
  requiredRole?: UserRole | UserRole[]
) {
  return function WithAuthComponent(props: P) {
    try {
      const auth = useAuthContext();
      const { isAuthenticated, isLoading, userRole, userId } = auth;

      // Still loading auth state
      if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
              <p className="mt-4 text-gray-300">Loading...</p>
            </div>
          </div>
        );
      }

      // Not authenticated
      if (!userId || !isAuthenticated) {
        return <Navigate to="/login" replace />;
      }

      // Role-based access check
      if (requiredRole) {
        const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        if (!rolesArray.includes((userRole as UserRole) ?? "client")) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
                <p className="text-gray-300 mb-6">
                  Your role ({userRole ?? "unknown"}) is not authorized to access this page.
                </p>
                <a href="/app" className="inline-block px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                  Return to Dashboard
                </a>
              </div>
            </div>
          );
        }
      }

      // Render protected component
      return <Component {...props} />;
    } catch (error) {
      // AuthContext not available - redirect to login
      return <Navigate to="/login" replace />;
    }
  };
}

/**
 * Hook to check if user has required role
 * @param requiredRole - Role(s) to check
 * @returns true if user has required role
 */
export function useHasRole(requiredRole: UserRole | UserRole[]): boolean {
  try {
    const { userRole } = useAuthContext();
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return rolesArray.includes((userRole as UserRole) ?? "client");
  } catch {
    return false;
  }
}

export function useIsAuthenticated(): boolean {
  try {
    const { isAuthenticated } = useAuthContext();
    return isAuthenticated;
  } catch {
    return false;
  }
}
