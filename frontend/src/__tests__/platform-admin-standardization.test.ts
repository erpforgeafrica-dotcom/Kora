import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("platform admin API standardization", () => {
  it("does not use raw fetch in platform admin pages", () => {
    const platformFiles = [
      "frontend/src/pages/platform-admin/RevenuePage.tsx",
      "frontend/src/pages/platform-admin/FeatureFlagsPage.tsx",
      "frontend/src/pages/platform-admin/AIUsagePage.tsx",
      "frontend/src/pages/platform-admin/UsersPage.tsx",
      "frontend/src/pages/tenants/ListPage.tsx",
      "frontend/src/pages/tenants/CreatePage.tsx",
      "frontend/src/pages/tenants/EditPage.tsx",
      "frontend/src/pages/tenants/DetailPage.tsx",
      "frontend/src/pages/subscriptions/ListPage.tsx",
      "frontend/src/pages/subscriptions/CreatePage.tsx",
      "frontend/src/pages/subscriptions/EditPage.tsx"
    ];

    for (const file of platformFiles) {
      expect(read(file), `${file} should use shared API access`).not.toMatch(/\bfetch\s*\(/);
    }
  });

  it("removes the deprecated CRM v2 namespace", () => {
    expect(read("frontend/src/services/api.ts")).not.toContain("/api/crm/v2");
  });

  it("routes platform admins into the live tenants workspace instead of a fake overview", () => {
    const appRoutes = read("frontend/src/App.tsx");
    const roleRouting = read("frontend/src/auth/dashboardAccess.ts");

    expect(appRoutes).toContain('path="kora-admin"');
    expect(appRoutes).toContain('Navigate to="/app/kora-admin/tenants"');
    expect(roleRouting).toContain('return "/app/kora-admin/tenants"');
  });

  it("keeps canonical platform, tenant, and subscription backend routes in source", () => {
    const platformRoutes = read("backend/src/modules/platform/routes.ts");
    const tenantRoutes = read("backend/src/modules/tenants/routes.ts");
    const subscriptionRoutes = read("backend/src/modules/subscriptions/routes.ts");

    expect(platformRoutes).toContain('platformRoutes.get("/overview"');
    expect(platformRoutes).toContain('platformRoutes.get("/revenue"');
    expect(platformRoutes).toContain('platformRoutes.get("/ai-usage"');
    expect(platformRoutes).toContain('platformRoutes.patch("/users/:id/status"');
    expect(platformRoutes).toContain('platformRoutes.patch("/users/:id/role"');

    expect(tenantRoutes).toContain('tenantsRoutes.get("/:id"');
    expect(tenantRoutes).toContain('tenantsRoutes.patch("/:id/status"');
    expect(tenantRoutes).toContain('tenantsRoutes.get("/:id/subscription"');

    expect(subscriptionRoutes).toContain('subscriptionsRoutes.get("/:id"');
    expect(subscriptionRoutes).toContain('subscriptionsRoutes.post("/"');
    expect(subscriptionRoutes).toContain('subscriptionsRoutes.patch("/:id"');
  });
});
