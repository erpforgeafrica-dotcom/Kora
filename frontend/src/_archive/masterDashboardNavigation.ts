import type { DashboardRole } from "../auth/dashboardAccess";

export type MasterNavItem = {
  label: string;
  path: string;
  key: string;
  apis: string[];
};

export type MasterNavGroup = {
  role: DashboardRole;
  label: string;
  items: MasterNavItem[];
};

function item(label: string, path: string, apis: string[] = []): MasterNavItem {
  return {
    label,
    path,
    key: path.split("/").filter(Boolean).join("-"),
    apis
  };
}

export const masterDashboardNavigation: Record<DashboardRole, MasterNavGroup> = {
  client: {
    role: "client",
    label: "Client Dashboard",
    items: [
      item("Dashboard", "/app/client", ["GET /api/clients/:id", "GET /api/bookings/upcoming"]),
      item("Search Services", "/app/client/search", ["GET /api/discovery/search", "GET /api/discovery/categories"]),
      item("Bookings", "/app/client/bookings", ["GET /api/bookings?clientId="]),
      item("Calendar", "/app/client/calendar", ["GET /api/bookings?clientId=&view=calendar"]),
      item("Emergency Services", "/app/client/emergency", ["GET /api/emergency/incidents", "POST /api/emergency/request"]),
      item("Telehealth", "/app/client/telehealth", ["GET /api/bookings?type=telehealth"]),
      item("Laundry Services", "/app/client/laundry", ["GET /api/services?category=laundry", "GET /api/platform/feature-flags"]),
      item("Home Services", "/app/client/home-services", ["GET /api/services?category=home", "GET /api/platform/feature-flags"]),
      item("Payments & Wallet", "/app/client/payments", ["GET /api/invoices", "GET /api/clients/:id/payments"]),
      item("Loyalty & Rewards", "/app/client/loyalty", ["GET /api/clients/:id/loyalty"]),
      item("Saved Providers", "/app/client/saved", ["GET /api/clients/:id/saved-providers"]),
      item("Service History", "/app/client/history", ["GET /api/bookings?clientId=&status=completed"]),
      item("Messages", "/app/client/messages", ["GET /api/notifications?channel=message"]),
      item("Notifications", "/app/client/notifications", ["GET /api/notifications?clientId="]),
      item("Profile", "/app/client/profile", ["GET /api/clients/:id", "PUT /api/clients/:id"]),
      item("Settings", "/app/client/settings"),
      item("Help & Support", "/app/client/support", ["POST /api/notifications/support-queue"])
    ]
  },
  business_admin: {
    role: "business_admin",
    label: "Business Admin",
    items: [
      item("Dashboard", "/app/business-admin", ["GET /api/analytics/business-summary"]),
      item("Bookings Manager", "/app/business-admin/bookings", ["GET /api/bookings", "GET /api/appointments"]),
      item("Calendar", "/app/business-admin/calendar", ["GET /api/bookings?view=calendar"]),
      item("Staff Management", "/app/business-admin/staff", ["GET /api/staff", "POST /api/staff"]),
      item("Customer CRM", "/app/business-admin/crm", ["GET /api/clients", "GET /api/analytics/churn-prediction"]),
      item("Services & Pricing", "/app/business-admin/services", ["GET /api/services", "POST /api/services"]),
      item("Inventory", "/app/business-admin/inventory", ["GET /api/inventory"]),
      item("Loyalty Program", "/app/business-admin/loyalty", ["GET /api/clients/loyalty-summary"]),
      item("Promotions", "/app/business-admin/promotions", ["GET /api/promotions", "POST /api/promotions"]),
      item("Payments & Billing", "/app/business-admin/payments", ["GET /api/payments/rcm", "GET /api/invoices"]),
      item("Reports & Analytics", "/app/business-admin/reports", ["GET /api/analytics/business-summary", "GET /api/reporting"]),
      item("AI Insights", "/app/business-admin/ai-insights", ["GET /api/ai/insights", "GET /api/ai/anomalies"]),
      item("Marketing Tools", "/app/business-admin/marketing", ["GET /api/campaigns", "POST /api/campaigns"]),
      item("Social Media Integrations", "/app/business-admin/social"),
      item("Locations", "/app/business-admin/locations", ["GET /api/tenant/branches"]),
      item("Emergency Dispatch", "/app/business-admin/emergency", ["GET /api/emergency/incidents"]),
      item("Laundry Operations", "/app/business-admin/laundry", ["GET /api/appointments?serviceType=laundry"]),
      item("Telehealth Setup", "/app/business-admin/telehealth", ["GET /api/services?type=telehealth"]),
      item("Integrations", "/app/business-admin/integrations"),
      item("Settings", "/app/business-admin/settings")
    ]
  },
  staff: {
    role: "staff",
    label: "Staff Dashboard",
    items: [
      item("My Schedule", "/app/staff", ["GET /api/staff/today-schedule"]),
      item("Today's Appointments", "/app/staff/appointments", ["GET /api/appointments?staffId=&date=today"]),
      item("Service Requests", "/app/staff/requests", ["GET /api/appointments?status=pending&staffId="]),
      item("Customer Profiles", "/app/staff/clients", ["GET /api/staff/client-brief/:appointmentId"]),
      item("Check-in / Check-out", "/app/staff/checkin", ["POST /api/staff/appointments/:id/status"]),
      item("GPS Navigation", "/app/staff/navigation", ["GET /api/staff/location"]),
      item("Service Notes", "/app/staff/notes", ["POST /api/bookings/:id/notes"]),
      item("Emergency Dispatch", "/app/staff/emergency", ["GET /api/emergency/incidents"]),
      item("Laundry Jobs", "/app/staff/laundry", ["GET /api/appointments?serviceType=laundry&staffId="]),
      item("Telehealth Sessions", "/app/staff/telehealth", ["GET /api/appointments?type=telehealth&staffId="]),
      item("Messages", "/app/staff/messages", ["GET /api/notifications?channel=message"]),
      item("Performance Metrics", "/app/staff/performance", ["GET /api/analytics/staff-performance/:id"]),
      item("Availability Settings", "/app/staff/availability", ["GET /api/availability/rules", "POST /api/availability/rules"]),
      item("Profile", "/app/staff/profile", ["GET /api/staff/:id", "PUT /api/staff/:id"])
    ]
  },
  operations: {
    role: "operations",
    label: "Operations Center",
    items: [
      item("Live Operations", "/app/operations", ["GET /api/appointments?status=in_progress", "GET /api/ai/anomalies"]),
      item("Dispatch Board", "/app/operations/dispatch", ["GET /api/appointments?status=pending", "POST /api/appointments/:id/assign"]),
      item("Emergency Coordination", "/app/operations/emergency", ["GET /api/emergency/incidents"]),
      item("Provider Map (GPS)", "/app/operations/map", ["GET /api/staff/locations"]),
      item("Active Jobs", "/app/operations/active-jobs", ["GET /api/appointments?status=in_progress"]),
      item("System Alerts", "/app/operations/alerts", ["GET /api/ai/anomalies", "GET /api/platform/system-health"]),
      item("Service Queue", "/app/operations/queue", ["GET /api/appointments?status=queued"]),
      item("Support Tickets", "/app/operations/support", ["GET /api/notifications/support-queue"]),
      item("Incident Reports", "/app/operations/incidents", ["GET /api/emergency/incidents"]),
      item("Provider Performance", "/app/operations/performance", ["GET /api/analytics/staff-performance"]),
      item("Network Status", "/app/operations/network", ["GET /api/platform/system-health"])
    ]
  },
  platform_admin: {
    role: "platform_admin",
    label: "KORA Admin",
    items: [
      item("Platform Overview", "/app/kora-admin", ["GET /api/platform/tenant-health", "GET /api/platform/ai-spend-summary"]),
      item("Tenant Management", "/app/kora-admin/tenants", ["GET /api/platform/businesses"]),
      item("Revenue & Subscriptions", "/app/kora-admin/revenue", ["GET /api/platform/revenue"]),
      item("Platform Analytics", "/app/kora-admin/analytics", ["GET /api/platform/analytics"]),
      item("System Health", "/app/kora-admin/system-health", ["GET /api/platform/system-health"]),
      item("AI Usage Metrics", "/app/kora-admin/ai-usage", ["GET /api/platform/ai-spend-summary"]),
      item("Fraud Monitoring", "/app/kora-admin/fraud", ["GET /api/platform/fraud-signals"]),
      item("User Management", "/app/kora-admin/users", ["GET /api/platform/users"]),
      item("Service Marketplace Moderation", "/app/kora-admin/marketplace", ["GET /api/discovery/venues"]),
      item("Payments Monitoring", "/app/kora-admin/payments", ["GET /api/platform/payment-health"]),
      item("Feature Flags", "/app/kora-admin/features", ["GET /api/platform/feature-flags"]),
      item("Security Logs", "/app/kora-admin/security", ["GET /api/audit-logs?type=security"]),
      item("Support Tools", "/app/kora-admin/support", ["GET /api/notifications/support-queue"]),
      item("Platform Settings", "/app/kora-admin/settings")
    ]
  }
};

export function getMasterNav(role: DashboardRole) {
  return masterDashboardNavigation[role];
}

export function findMasterNavItem(role: DashboardRole, pageKey: string) {
  return masterDashboardNavigation[role].items.find((item) => item.path.split("/").pop() === pageKey);
}
