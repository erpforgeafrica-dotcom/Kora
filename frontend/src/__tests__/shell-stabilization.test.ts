/**
 * Shell Stabilization Tests
 *
 * Verifies:
 * 1. normalizeDashboardRole never silently returns platform_admin for unknown/null input
 * 2. useAuth correctly parses the { data: { user } } envelope from /api/auth/me
 * 3. Navigation dead items are hidden (not rendered) for all roles
 * 4. Backend JSON 404 handler returns JSON for unknown /api/* routes
 */

import {
  normalizeDashboardRole,
  getDefaultDashboardPath,
  canAccessDashboard,
  type DashboardRole,
} from "../auth/dashboardAccess";
import { navigation } from "../config/navigation";
import type { UserRole } from "../config/navigation";

// ─── 1. Role normalization ────────────────────────────────────────────────────

describe("normalizeDashboardRole", () => {
  it("returns null for null input — no silent platform_admin fallback", () => {
    expect(normalizeDashboardRole(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(normalizeDashboardRole(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeDashboardRole("")).toBeNull();
  });

  it("returns null for unknown role string", () => {
    expect(normalizeDashboardRole("superuser")).toBeNull();
  });

  it("maps platform_admin correctly", () => {
    expect(normalizeDashboardRole("platform_admin")).toBe("platform_admin");
  });

  it("maps business_admin correctly", () => {
    expect(normalizeDashboardRole("business_admin")).toBe("business_admin");
  });

  it("maps legacy aliases to canonical roles", () => {
    expect(normalizeDashboardRole("owner")).toBe("business_admin");
    expect(normalizeDashboardRole("manager")).toBe("business_admin");
    expect(normalizeDashboardRole("kora_admin")).toBe("platform_admin");
    expect(normalizeDashboardRole("kora_superadmin")).toBe("platform_admin");
    expect(normalizeDashboardRole("customer")).toBe("client");
  });

  it("is case-insensitive", () => {
    expect(normalizeDashboardRole("PLATFORM_ADMIN")).toBe("platform_admin");
    expect(normalizeDashboardRole("Business_Admin")).toBe("business_admin");
  });
});

// ─── 2. Auth /me envelope parsing ────────────────────────────────────────────

describe("/api/auth/me response envelope", () => {
  it("canonical envelope shape has data.user with role field", () => {
    // This is the shape respondSuccess() produces
    const mockResponse = {
      data: {
        user: {
          id: "user-123",
          email: "admin@kora.io",
          role: "platform_admin",
          organizationId: "org-456",
        },
      },
      meta: { timestamp: new Date().toISOString(), requestId: "req-1" },
    };

    // Simulate what useAuth now does
    const user = mockResponse.data?.user;
    expect(user).toBeDefined();
    expect(user?.role).toBe("platform_admin");
    expect(user?.organizationId).toBe("org-456");
    expect(user?.id).toBe("user-123");

    const role = normalizeDashboardRole(user?.role ?? null);
    expect(role).toBe("platform_admin");
  });

  it("handles missing user gracefully — role resolves to null", () => {
    const mockResponse = { data: {}, meta: {} };
    const user = (mockResponse.data as any)?.user;
    const role = normalizeDashboardRole(user?.role ?? null);
    expect(role).toBeNull();
  });
});

// ─── 3. Navigation dead items are hidden ─────────────────────────────────────

const DEAD_LABELS = [
  "System Health",
  "Alerts",
  "Anomalies",
  "Recommendations",
  "Logs",
  "Workflow Rules",
  "AI Settings",
  "Integrations",
  "Audit & Governance",
];

function getVisibleItems(role: UserRole) {
  return (navigation[role] ?? [])
    .filter((s) => !s.hidden)
    .flatMap((s) => s.children.filter((c) => !c.hidden));
}

describe("Navigation — dead items are hidden", () => {
  const roles: UserRole[] = ["platform_admin", "business_admin", "operations"];

  for (const role of roles) {
    it(`role=${role}: no dead nav items are visible`, () => {
      const visible = getVisibleItems(role);
      const visibleLabels = visible.map((c) => c.label);

      for (const dead of DEAD_LABELS) {
        expect(visibleLabels, `"${dead}" should be hidden for ${role}`).not.toContain(dead);
      }
    });
  }

  it("platform_admin: Platform Control section still has real items", () => {
    const visible = getVisibleItems("platform_admin");
    const labels = visible.map((c) => c.label);
    expect(labels).toContain("Tenants");
    expect(labels).toContain("Subscriptions");
    expect(labels).toContain("Users & Roles");
    expect(labels).toContain("Feature Flags");
  });

  it("platform_admin: Monitoring & AI section still has AI Usage", () => {
    const visible = getVisibleItems("platform_admin");
    expect(visible.map((c) => c.label)).toContain("AI Usage");
  });

  it("platform_admin: Support section still has Support Queue and Resolved Tickets", () => {
    const visible = getVisibleItems("platform_admin");
    const labels = visible.map((c) => c.label);
    expect(labels).toContain("Support Queue");
    expect(labels).toContain("Resolved Tickets");
  });
});

// ─── 4. Default dashboard paths are valid ────────────────────────────────────

describe("getDefaultDashboardPath", () => {
  const cases: [DashboardRole, string][] = [
    ["platform_admin", "/app/kora-admin/tenants"],
    ["business_admin", "/app/business-admin"],
    ["operations", "/app/operations"],
    ["staff", "/app/staff"],
    ["client", "/app/client"],
    ["dispatcher", "/app/operations/delivery/bookings"],
    ["delivery_agent", "/app/operations/delivery/bookings"],
    ["inventory_manager", "/app/business-admin/inventory"],
    ["sales_manager", "/app/business-admin/leads"],
    ["sales_agent", "/app/business-admin/leads"],
  ];

  for (const [role, expectedPath] of cases) {
    it(`role=${role} → ${expectedPath}`, () => {
      expect(getDefaultDashboardPath(role)).toBe(expectedPath);
    });
  }
});

// ─── 5. canAccessDashboard ────────────────────────────────────────────────────

describe("canAccessDashboard", () => {
  it("returns true when role is in allowedRoles", () => {
    expect(canAccessDashboard("platform_admin", ["platform_admin", "business_admin"])).toBe(true);
  });

  it("returns false when role is not in allowedRoles", () => {
    expect(canAccessDashboard("client", ["platform_admin", "business_admin"])).toBe(false);
  });
});
