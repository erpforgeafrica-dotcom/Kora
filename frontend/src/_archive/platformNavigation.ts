import type { DashboardRole } from "../auth/dashboardAccess";

export type PlatformNavLeaf = {
  label: string;
  key: string;
  path?: string;
};

export type PlatformNavSection = {
  label: string;
  key: string;
  children: PlatformNavLeaf[];
};

export type PlatformDashboardSchema = {
  role: DashboardRole;
  label: string;
  route: string;
  icon: string;
  sections: PlatformNavSection[];
};

export const platformDashboardSchemas: PlatformDashboardSchema[] = [
  {
    role: "client",
    label: "Client Dashboard",
    route: "/app/client",
    icon: "◊",
    sections: [
      { label: "Dashboard", key: "dashboard", children: [{ label: "Overview", key: "overview" }, { label: "Upcoming Bookings", key: "upcoming-bookings" }, { label: "Alerts & Reminders", key: "alerts-reminders" }] },
      { label: "Bookings", key: "bookings", children: [{ label: "Book Service", key: "book-service", path: "/app/client/book" }, { label: "My Bookings", key: "my-bookings" }, { label: "Reschedule", key: "reschedule" }, { label: "Cancel Booking", key: "cancel-booking" }, { label: "Emergency Request", key: "emergency-request" }, { label: "Telehealth Appointment", key: "telehealth-appointment" }] },
      { label: "Services", key: "services", children: [{ label: "Browse Services", key: "browse-services" }, { label: "Clinics", key: "clinics" }, { label: "Home Services", key: "home-services" }, { label: "Laundry", key: "laundry" }, { label: "Wellness", key: "wellness" }, { label: "Emergency", key: "emergency" }] },
      { label: "Providers", key: "providers", children: [{ label: "Favorite Providers", key: "favorite-providers" }, { label: "Nearby Providers Map", key: "nearby-providers-map" }, { label: "Recently Visited Providers", key: "recently-visited-providers" }] },
      { label: "Loyalty & Rewards", key: "loyalty-rewards", children: [{ label: "Loyalty Points", key: "loyalty-points" }, { label: "Membership Level", key: "membership-level" }, { label: "Referral Rewards", key: "referral-rewards" }, { label: "Promotions", key: "promotions" }] },
      { label: "Payments", key: "payments", children: [{ label: "Wallet", key: "wallet" }, { label: "Payment Methods", key: "payment-methods" }, { label: "Billing History", key: "billing-history" }, { label: "Invoices", key: "invoices" }, { label: "Subscriptions", key: "subscriptions" }] },
      { label: "Documents", key: "documents", children: [{ label: "Upload Documents", key: "upload-documents" }, { label: "Medical Records", key: "medical-records" }, { label: "Insurance Files", key: "insurance-files" }] },
      { label: "Messages", key: "messages", children: [{ label: "Provider Chat", key: "provider-chat" }, { label: "Support Chat", key: "support-chat" }, { label: "Notifications", key: "notifications" }] },
      { label: "Community", key: "community", children: [{ label: "Reviews", key: "reviews" }, { label: "Ratings", key: "ratings" }, { label: "Recommendations", key: "recommendations" }] },
      { label: "Settings", key: "settings", children: [{ label: "Profile Settings", key: "profile-settings" }, { label: "Security", key: "security" }, { label: "Notification Preferences", key: "notification-preferences" }, { label: "Language", key: "language" }] }
    ]
  },
  {
    role: "business_admin",
    label: "Business Dashboard",
    route: "/app/business-admin",
    icon: "◨",
    sections: [
      { label: "Dashboard", key: "dashboard", children: [{ label: "Revenue Overview", key: "revenue-overview" }, { label: "Booking Summary", key: "booking-summary" }, { label: "AI Insights", key: "ai-insights" }, { label: "Customer Growth", key: "customer-growth" }] },
      { label: "Bookings", key: "bookings", children: [{ label: "Booking Calendar", key: "booking-calendar", path: "/app/bookings" }, { label: "Appointment Queue", key: "appointment-queue" }, { label: "Emergency Requests", key: "emergency-requests" }, { label: "Telehealth Bookings", key: "telehealth-bookings" }] },
      { label: "CRM", key: "crm", children: [{ label: "Customers", key: "customers" }, { label: "Leads", key: "leads" }, { label: "Opportunities", key: "opportunities" }, { label: "Customer Ranks", key: "customer-ranks" }, { label: "Loyalty Programs", key: "loyalty-programs" }, { label: "Customer Feedback", key: "customer-feedback" }] },
      { label: "Services", key: "services", children: [{ label: "Service Catalog", key: "service-catalog" }, { label: "Pricing", key: "pricing" }, { label: "Service Packages", key: "service-packages" }, { label: "Service Availability", key: "service-availability" }, { label: "Promotions", key: "promotions" }] },
      { label: "Company", key: "company", children: [{ label: "Branches", key: "branches" }, { label: "Locations", key: "locations" }, { label: "Business Profile", key: "business-profile" }, { label: "Operating Hours", key: "operating-hours" }] },
      { label: "Staff Management", key: "staff-management", children: [{ label: "Staff Directory", key: "staff-directory" }, { label: "Roles & Permissions", key: "roles-permissions" }, { label: "Staff Schedules", key: "staff-schedules" }, { label: "Staff Performance", key: "staff-performance" }] },
      { label: "Operations", key: "operations", children: [{ label: "Dispatch Queue", key: "dispatch-queue" }, { label: "Field Assignments", key: "field-assignments" }, { label: "GPS Staff Tracking", key: "gps-staff-tracking" }, { label: "Route Planning", key: "route-planning" }] },
      { label: "Inventory", key: "inventory", children: [{ label: "Stock", key: "stock" }, { label: "Warehouses", key: "warehouses" }, { label: "Suppliers", key: "suppliers" }, { label: "Purchase Orders", key: "purchase-orders" }, { label: "Maintenance", key: "maintenance" }, { label: "Asset Tracking", key: "asset-tracking" }] },
      { label: "Payments", key: "payments", children: [{ label: "Transactions", key: "transactions" }, { label: "Payment Gateways", key: "payment-gateways" }, { label: "Refunds", key: "refunds" }, { label: "Payout Reports", key: "payout-reports" }, { label: "Financial Reconciliation", key: "financial-reconciliation" }] },
      { label: "Marketing", key: "marketing", children: [{ label: "Campaigns", key: "campaigns" }, { label: "Social Media Integration", key: "social-media-integration" }, { label: "Promotions", key: "marketing-promotions" }, { label: "Email/SMS Campaigns", key: "email-sms-campaigns" }] },
      { label: "AI Engine", key: "ai-engine", children: [{ label: "Demand Forecasting", key: "demand-forecasting" }, { label: "Booking Predictions", key: "booking-predictions" }, { label: "Customer Churn Detection", key: "customer-churn-detection" }, { label: "Pricing Optimization", key: "pricing-optimization" }, { label: "Fraud Detection", key: "fraud-detection" }] },
      { label: "Reports & Analytics", key: "reports-analytics", children: [{ label: "Revenue Reports", key: "revenue-reports" }, { label: "Staff Productivity", key: "staff-productivity" }, { label: "Customer Analytics", key: "customer-analytics" }, { label: "Service Profitability", key: "service-profitability" }] },
      { label: "Documents", key: "documents", children: [{ label: "Business Documents", key: "business-documents" }, { label: "Licenses", key: "licenses" }, { label: "Contracts", key: "contracts" }, { label: "Compliance Files", key: "compliance-files" }] },
      { label: "Integrations", key: "integrations", children: [{ label: "Payment Gateways", key: "integration-payment-gateways" }, { label: "Maps / GPS", key: "maps-gps" }, { label: "Telehealth Systems", key: "telehealth-systems" }, { label: "Social Media", key: "integration-social-media" }] },
      { label: "Settings", key: "settings", children: [{ label: "Business Settings", key: "business-settings" }, { label: "Subscription Plan", key: "subscription-plan" }, { label: "Notifications", key: "settings-notifications" }] }
    ]
  },
  {
    role: "staff",
    label: "Staff Workspace",
    route: "/app/staff",
    icon: "◈",
    sections: [
      { label: "My Dashboard", key: "my-dashboard", children: [{ label: "My Schedule", key: "my-schedule" }, { label: "Assigned Tasks", key: "assigned-tasks" }, { label: "Notifications", key: "staff-notifications" }, { label: "Performance Summary", key: "performance-summary" }] },
      { label: "Appointments", key: "appointments", children: [{ label: "Today's Bookings", key: "todays-bookings" }, { label: "Upcoming Bookings", key: "upcoming-bookings" }, { label: "Completed Jobs", key: "completed-jobs" }, { label: "Cancelled Jobs", key: "cancelled-jobs" }] },
      { label: "Tasks", key: "tasks", children: [{ label: "Assigned Tasks", key: "task-assigned-tasks" }, { label: "Task Completion", key: "task-completion" }, { label: "Job Notes", key: "job-notes" }] },
      { label: "Field Operations", key: "field-operations", children: [{ label: "Navigation Map", key: "navigation-map" }, { label: "Route Assignments", key: "route-assignments" }, { label: "GPS Tracking", key: "gps-tracking" }, { label: "Emergency Dispatch", key: "staff-emergency-dispatch" }] },
      { label: "Customer Info", key: "customer-info", children: [{ label: "Customer Profile", key: "customer-profile" }, { label: "Visit History", key: "visit-history" }, { label: "Notes", key: "customer-notes" }] },
      { label: "Telehealth", key: "telehealth", children: [{ label: "Video Consultations", key: "video-consultations" }, { label: "Consultation Records", key: "consultation-records" }] },
      { label: "Inventory Usage", key: "inventory-usage", children: [{ label: "Supplies Used", key: "supplies-used" }, { label: "Request Supplies", key: "request-supplies" }] },
      { label: "Messages", key: "messages", children: [{ label: "Team Chat", key: "team-chat" }, { label: "Customer Chat", key: "customer-chat" }, { label: "Support", key: "staff-support" }] },
      { label: "Performance", key: "performance", children: [{ label: "Ratings", key: "ratings" }, { label: "Reviews", key: "reviews" }, { label: "Productivity Metrics", key: "productivity-metrics" }] },
      { label: "Documents", key: "documents", children: [{ label: "Upload Documents", key: "staff-upload-documents" }, { label: "Certifications", key: "certifications" }, { label: "Work Files", key: "work-files" }] },
      { label: "Settings", key: "settings", children: [{ label: "Profile", key: "staff-profile" }, { label: "Availability", key: "availability" }, { label: "Notification Settings", key: "staff-notification-settings" }] }
    ]
  },
  {
    role: "operations",
    label: "Operations Command Center",
    route: "/app/operations",
    icon: "⌘",
    sections: [
      { label: "Operations Dashboard", key: "operations-dashboard", children: [{ label: "Live Booking Feed", key: "live-booking-feed" }, { label: "Active Staff", key: "active-staff" }, { label: "System Alerts", key: "system-alerts" }, { label: "SLA Monitoring", key: "sla-monitoring" }] },
      { label: "Dispatch", key: "dispatch", children: [{ label: "Job Assignment", key: "job-assignment" }, { label: "Route Optimization", key: "route-optimization" }, { label: "Field Team Tracking", key: "field-team-tracking" }, { label: "Emergency Dispatch", key: "operations-emergency-dispatch" }] },
      { label: "Bookings Monitor", key: "bookings-monitor", children: [{ label: "All Bookings", key: "all-bookings" }, { label: "Pending Requests", key: "pending-requests" }, { label: "Delayed Services", key: "delayed-services" }, { label: "Escalations", key: "escalations" }] },
      { label: "Customers", key: "customers", children: [{ label: "Customer Incidents", key: "customer-incidents" }, { label: "Complaints", key: "complaints" }, { label: "Support Tickets", key: "support-tickets" }] },
      { label: "Staff Monitoring", key: "staff-monitoring", children: [{ label: "Staff Location Map", key: "staff-location-map" }, { label: "Performance Alerts", key: "performance-alerts" }, { label: "Availability", key: "staff-availability" }] },
      { label: "Service Operations", key: "service-operations", children: [{ label: "Service Capacity", key: "service-capacity" }, { label: "Demand Spikes", key: "demand-spikes" }, { label: "Service Outages", key: "service-outages" }] },
      { label: "Payments Watch", key: "payments-watch", children: [{ label: "Payment Failures", key: "payment-failures" }, { label: "Fraud Alerts", key: "fraud-alerts" }, { label: "Refund Queue", key: "refund-queue" }] },
      { label: "AI Alerts", key: "ai-alerts", children: [{ label: "Demand Surge Prediction", key: "demand-surge-prediction" }, { label: "Staff Shortage Alerts", key: "staff-shortage-alerts" }, { label: "Operational Anomalies", key: "operational-anomalies" }] },
      { label: "Support Desk", key: "support-desk", children: [{ label: "Live Chat Support", key: "live-chat-support" }, { label: "Ticket Management", key: "ticket-management" }, { label: "Issue Escalation", key: "issue-escalation" }] }
    ]
  },
  {
    role: "platform_admin",
    label: "KÓRA Admin",
    route: "/app/kora-admin",
    icon: "▲",
    sections: [
      { label: "Platform Overview", key: "platform-overview", children: [{ label: "Tenant Health", key: "tenant-health" }, { label: "Global Revenue", key: "global-revenue" }, { label: "System Uptime", key: "system-uptime" }, { label: "Platform Alerts", key: "platform-alerts" }] },
      { label: "Tenants", key: "tenants", children: [{ label: "Businesses", key: "businesses" }, { label: "Clinics", key: "clinics" }, { label: "Service Companies", key: "service-companies" }, { label: "Tenant Onboarding", key: "tenant-onboarding" }] },
      { label: "Users", key: "users", children: [{ label: "All Users", key: "all-users" }, { label: "Role Management", key: "role-management" }, { label: "Access Control", key: "access-control" }] },
      { label: "Marketplace", key: "marketplace", children: [{ label: "Service Templates", key: "service-templates" }, { label: "Categories", key: "categories" }, { label: "Listings", key: "listings" }] },
      { label: "Subscriptions & Billing", key: "subscriptions-billing", children: [{ label: "Plans", key: "plans" }, { label: "Billing Cycles", key: "billing-cycles" }, { label: "Revenue Analytics", key: "revenue-analytics" }, { label: "Payment Providers", key: "payment-providers" }] },
      { label: "AI Engine", key: "ai-engine", children: [{ label: "Model Monitoring", key: "model-monitoring" }, { label: "Training Data", key: "training-data" }, { label: "AI Usage Costs", key: "ai-usage-costs" }, { label: "Automation Rules", key: "automation-rules" }] },
      { label: "Operations Oversight", key: "operations-oversight", children: [{ label: "Global Bookings", key: "global-bookings" }, { label: "Incident Management", key: "incident-management" }, { label: "Escalations", key: "oversight-escalations" }] },
      { label: "Integrations", key: "integrations", children: [{ label: "Payment Gateways", key: "platform-payment-gateways" }, { label: "Maps", key: "maps" }, { label: "Telehealth", key: "telehealth" }, { label: "Social Media", key: "social-media" }] },
      { label: "Security", key: "security", children: [{ label: "Audit Logs", key: "audit-logs" }, { label: "Access Monitoring", key: "access-monitoring" }, { label: "Threat Detection", key: "threat-detection" }] },
      { label: "Platform Settings", key: "platform-settings", children: [{ label: "Global Configuration", key: "global-configuration" }, { label: "Feature Flags", key: "feature-flags" }, { label: "Notifications", key: "platform-notifications" }, { label: "Support Queue", key: "platform-support", path: "/app/kora-admin/support" }] }
    ]
  }
];

export const shellDashboardNav = platformDashboardSchemas.map((schema) => ({
  icon: schema.icon,
  label: schema.label,
  path: schema.route,
  key: schema.role,
  roles: [schema.role] as DashboardRole[]
}));

export function getPlatformDashboardSchema(role: DashboardRole) {
  return platformDashboardSchemas.find((schema) => schema.role === role) ?? platformDashboardSchemas[0];
}

export function getDashboardSchemaFromPath(pathname: string) {
  return platformDashboardSchemas.find((schema) => pathname === schema.route || pathname.startsWith(`${schema.route}/`));
}

export function getPlatformModulePath(role: DashboardRole, sectionKey: string, pageKey: string) {
  const schema = getPlatformDashboardSchema(role);
  return `${schema.route}/${sectionKey}/${pageKey}`;
}

export function getPlatformLeafPath(schema: PlatformDashboardSchema, section: PlatformNavSection, leaf: PlatformNavLeaf) {
  return leaf.path ?? getPlatformModulePath(schema.role, section.key, leaf.key);
}

export function findPlatformLeaf(role: DashboardRole, sectionKey: string, pageKey: string) {
  const schema = getPlatformDashboardSchema(role);
  const section = schema.sections.find((item) => item.key === sectionKey);
  const leaf = section?.children.find((item) => item.key === pageKey);
  return {
    schema,
    section,
    leaf
  };
}
