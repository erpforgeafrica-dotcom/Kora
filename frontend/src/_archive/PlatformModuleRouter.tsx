import type { DashboardRole } from "../../auth/dashboardAccess";
import { BusinessAdminModuleRouter } from "./BusinessAdminModuleRouter";
import { OperationsModuleRouter } from "./OperationsModuleRouter";
import { PlatformAdminModuleRouter } from "./PlatformAdminModuleRouter";
import { GeneratedModulePage } from "./GeneratedModulePage";

type PlatformModuleRouterProps = {
  role: DashboardRole;
};

export function PlatformModuleRouter({ role }: PlatformModuleRouterProps) {
  switch (role) {
    case "business_admin":
      return <BusinessAdminModuleRouter />;
    case "operations":
      return <OperationsModuleRouter />;
    case "platform_admin":
      return <PlatformAdminModuleRouter />;
    default:
      // Fallback for client/staff or unknown roles
      return <GeneratedModulePage role={role} />;
  }
}


