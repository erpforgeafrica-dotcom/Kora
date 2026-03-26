import { ClientWorkspacePage } from "./audience/ClientWorkspacePage";
import { BusinessAdminDashboardPage } from "./audience/BusinessAdminDashboardPage";
import { StaffWorkspacePage } from "./audience/StaffWorkspacePage";
import TenantsListPage from "./tenants/ListPage";

type WorkspaceKey = "client" | "business-admin" | "staff" | "kora-admin";

export function AudienceWorkspacePage({ workspace }: { workspace: WorkspaceKey }) {
  if (workspace === "client") return <ClientWorkspacePage />;
  if (workspace === "business-admin") return <BusinessAdminDashboardPage />;
  if (workspace === "staff") return <StaffWorkspacePage />;
  return <TenantsListPage />;
}
