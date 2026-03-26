import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { canAccessDashboard, getDefaultDashboardPath, type DashboardRole } from "../../auth/dashboardAccess";
import { useAuthContext } from "@/contexts/AuthContext";

export function DashboardRouteGuard({
  allowedRoles,
  children
}: {
  allowedRoles: DashboardRole[];
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, userRole } = useAuthContext();

  if (isLoading) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Loading workspace...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Resolving workspace access...</div>;
  }

  const role = userRole;

  if (!role || !canAccessDashboard(role, allowedRoles)) {
    return <Navigate to={role ? getDefaultDashboardPath(role) : "/login"} replace />;
  }

  return <>{children}</>;
}

export function DefaultDashboardRedirect() {
  const { isLoading, isAuthenticated, userRole } = useAuthContext();

  if (isLoading) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Loading workspace...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Resolving workspace...</div>;
  }

  const role = userRole;
  return <Navigate to={getDefaultDashboardPath(role)} replace />;
}
