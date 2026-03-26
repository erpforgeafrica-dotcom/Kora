import { useState } from "react";

// ─── DATA ──────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    id: 0, label: "Phase 0 — Foundations", effort: "½ day",
    color: "#00e5c8",
    tasks: [
      "Install TanStack Table, React-Hook-Form, Yup, Axios",
      "Create src/services/api.ts — Axios instance with JWT interceptor + org_id header",
      "Create src/hooks/useCrud.ts — fetchAll, create, update, deleteItem",
      "Create src/components/ui/PageLayout.tsx",
      "Create src/components/ui/Toolbar.tsx",
      "Create src/components/ui/DataTable.tsx",
      "Create src/components/ui/ActionButtons.tsx",
      "Create src/config/modules.json — all modules declared",
      "Create scripts/generate-module.ts — CLI scaffolder",
    ],
    files: [
      "src/services/api.ts",
      "src/hooks/useCrud.ts",
      "src/components/ui/PageLayout.tsx",
      "src/components/ui/Toolbar.tsx",
      "src/components/ui/DataTable.tsx",
      "src/components/ui/ActionButtons.tsx",
      "src/config/modules.json",
      "scripts/generate-module.ts",
    ]
  },
  {
    id: 1, label: "Phase 1 — Core CRUD Modules", effort: "2 days",
    color: "#ff8a65",
    tasks: [
      "Run: npx ts-node scripts/generate-module.ts",
      "Verify clients → ListPage shows real rows from GET /api/clients",
      "Verify bookings → ListPage shows real rows from GET /api/bookings",
      "Verify services → ListPage shows real rows from GET /api/services",
      "Verify staff → ListPage shows real rows from GET /api/staff/members",
      "Verify payments → ListPage shows real rows from GET /api/payments/transactions",
      "Wire Create forms → POST endpoints for each module",
      "Wire Edit forms → PATCH endpoints for each module",
      "Wire Delete buttons → DELETE endpoints for each module",
      "Empty state: 'No [entity] yet — add your first one'",
      "Loading state: skeleton rows while fetching",
      "Error state: amber banner on API failure",
    ],
    files: [
      "src/pages/clients/ListPage.tsx",
      "src/pages/clients/CreatePage.tsx",
      "src/pages/clients/EditPage.tsx",
      "src/pages/clients/DetailsPage.tsx",
      "src/pages/bookings/ListPage.tsx",
      "src/pages/bookings/CreatePage.tsx",
      "src/pages/bookings/EditPage.tsx",
      "src/pages/services/ListPage.tsx",
      "src/pages/services/CreatePage.tsx",
      "src/pages/staff/ListPage.tsx",
      "src/pages/payments/ListPage.tsx",
    ]
  },
  {
    id: 2, label: "Phase 2 — Sidebar & Role Guards", effort: "1 day",
    color: "#a78bfa",
    tasks: [
      "Create src/config/navigation.ts — canonical nav per role (5 roles)",
      "Update Sidebar.tsx — accordion behavior (one section open at a time)",
      "Accordion: openSectionId state, clicking same closes it",
      "Active link detection via useLocation()",
      "Add route guard HOC: withAuth(role) → redirects if wrong role",
      "Wrap all /app/client/* routes with withAuth('client')",
      "Wrap all /app/business-admin/* routes with withAuth('business_admin')",
      "Wrap all /app/staff/* routes with withAuth('staff')",
      "Wrap all /app/operations/* routes with withAuth('operations')",
      "Wrap all /app/kora-admin/* routes with withAuth('kora_admin')",
      "Test: business_admin cannot navigate to /app/kora-admin",
    ],
    files: [
      "src/config/navigation.ts",
      "src/components/layout/Sidebar.tsx",
      "src/components/layout/AppShell.tsx",
      "src/hocs/withAuth.tsx",
    ]
  },
  {
    id: 3, label: "Phase 3 — Staff Dashboard", effort: "1 day",
    color: "#4a9eff",
    tasks: [
      "src/pages/staff/MySchedule.tsx → GET /api/appointments?staffId=me&view=week",
      "src/pages/staff/TodayJobs.tsx → GET /api/appointments?staffId=me&date=today",
      "src/pages/staff/CustomerProfiles.tsx → GET /api/clients/:id (linked from job)",
      "src/pages/staff/CheckInOut.tsx → POST /api/appointments/:id/checkin|checkout",
      "src/pages/staff/ServiceNotes.tsx → POST /api/appointments/:id/notes",
      "src/pages/staff/Messages.tsx → GET /api/messages/conversations",
      "src/pages/staff/PerformanceMetrics.tsx → GET /api/staff/performance",
      "src/pages/staff/AvailabilitySettings.tsx → GET/PUT /api/staff/:id/availability",
      "All pages: use same DataTable/PageLayout primitives",
      "No mock data anywhere — skeleton → empty state → real data",
    ],
    files: [
      "src/pages/staff/MySchedule.tsx",
      "src/pages/staff/TodayJobs.tsx",
      "src/pages/staff/CustomerProfiles.tsx",
      "src/pages/staff/CheckInOut.tsx",
      "src/pages/staff/ServiceNotes.tsx",
      "src/pages/staff/Messages.tsx",
      "src/pages/staff/PerformanceMetrics.tsx",
      "src/pages/staff/AvailabilitySettings.tsx",
    ]
  },
  {
    id: 4, label: "Phase 4 — Media Management", effort: "1 day",
    color: "#f59e0b",
    tasks: [
      "Add 'media' to modules.json with presigned S3 upload endpoint",
      "src/pages/media/GalleryPage.tsx → GET /api/media → grid of thumbnails",
      "Drag-and-drop upload zone → POST /api/media/upload → fetch(presignedUrl)",
      "Category filter chips: general | gallery | promotional | before_after | training | logo",
      "Lightbox preview on thumbnail click",
      "Delete confirmation modal → DELETE /api/media/:id",
      "MediaPicker component (reused in social post composer, campaign creator)",
      "Support: images (jpg/png/webp) + videos (mp4) + documents (pdf)",
      "Max file size validation client-side: 50MB images, 500MB videos",
      "Progress bar during upload",
    ],
    files: [
      "src/pages/media/GalleryPage.tsx",
      "src/components/media/UploadZone.tsx",
      "src/components/media/MediaPicker.tsx",
      "src/components/media/Lightbox.tsx",
    ]
  },
  {
    id: 5, label: "Phase 5 — Reviews & Social Links", effort: "1 day",
    color: "#00e5c8",
    tasks: [
      "src/pages/reviews/ReviewsPage.tsx → GET /api/reviews?orgId=",
      "ReviewCard: star rating, client name, content, AI sentiment badge, date",
      "Negative reviews: amber border, 'Respond' expandable textarea",
      "Submit response → POST /api/reviews/:id/respond",
      "Rule shown: 'Negative reviews shown at max 1:10 ratio on public profile'",
      "Business cannot edit/delete — only respond",
      "Social link bar in global top bar: WhatsApp, Instagram, Facebook, TikTok, Pinterest, Snapchat, X",
      "Links use deep-link protocol: wa.me/{phone}, instagram.com/{handle} etc",
      "Settings page: connect social accounts → /api/social/connect/:platform",
      "Social icons appear greyed if not connected, teal if connected",
    ],
    files: [
      "src/pages/reviews/ReviewsPage.tsx",
      "src/components/reviews/ReviewCard.tsx",
      "src/components/reviews/RespondForm.tsx",
      "src/components/global/SocialBar.tsx",
    ]
  },
  {
    id: 6, label: "Phase 6 — AI Insight Panels", effort: "½ day",
    color: "#a78bfa",
    tasks: [
      "AIInsightCard component: teal border, brain icon, compact (not full page)",
      "Business Admin dashboard: GET /api/ai/crm-scores → top 5 at-risk clients",
      "Business Admin dashboard: GET /api/ai/demand-forecast → 'Peak: tomorrow 2-4pm'",
      "Staff dashboard: GET /api/ai/staff-recommendations → 'You have 3 gaps today'",
      "Operations dashboard: GET /api/ai/anomalies → live anomaly feed",
      "KÓRA Admin: GET /api/ai/automation-log → recent AI actions taken",
      "Each panel: loading skeleton → empty 'No insights yet' → real data",
      "Error: dim amber dot 'AI unavailable' — never crash the page",
      "All panels are non-blocking — main page renders even if AI call fails",
    ],
    files: [
      "src/components/ai/AIInsightCard.tsx",
      "src/components/ai/AnomalyFeed.tsx",
      "src/components/ai/DemandForecast.tsx",
      "src/components/ai/CrmScorePanel.tsx",
    ]
  },
  {
    id: 7, label: "Phase 7 — Tests & CI", effort: "1 day",
    color: "#ff8a65",
    tasks: [
      "Install: cypress, @testing-library/react, msw",
      "cypress/e2e/clients.cy.ts: create → edit → delete flow",
      "cypress/e2e/bookings.cy.ts: create booking, confirm, cancel",
      "cypress/e2e/auth.cy.ts: login as each role, verify redirect",
      "cypress/e2e/sidebar.cy.ts: each menu item navigates correctly",
      "src/__tests__/useCrud.test.ts: unit test all 4 CRUD operations with msw mocks",
      "src/__tests__/DataTable.test.tsx: renders rows, triggers onRowClick",
      "src/__tests__/Sidebar.test.tsx: accordion opens/closes, active link highlighted",
      "Add .github/workflows/ci.yml: npm test + cypress run on PR",
      "Coverage target: 60% line coverage on hooks + components",
    ],
    files: [
      "cypress/e2e/clients.cy.ts",
      "cypress/e2e/bookings.cy.ts",
      "cypress/e2e/auth.cy.ts",
      "cypress/e2e/sidebar.cy.ts",
      "src/__tests__/useCrud.test.ts",
      "src/__tests__/DataTable.test.tsx",
      "src/__tests__/Sidebar.test.tsx",
      ".github/workflows/ci.yml",
    ]
  },
  {
    id: 8, label: "Phase 8 — Polish", effort: "1 day",
    color: "#4a9eff",
    tasks: [
      "Loading skeletons: all list pages show pulsing rows while fetching",
      "Toast notifications: success (teal), error (red), warning (amber) — 3 second auto-dismiss",
      "Delete confirmation modal: all delete buttons require confirm dialog",
      "Empty states: illustration + message + primary CTA for every list page",
      "Responsive: all pages usable at 768px (tablet) — sidebar collapses to icon-only",
      "Keyboard nav: Tab through form fields, Enter submits, Escape closes modals",
      "ARIA: all buttons have aria-label, tables have aria-describedby, modals trap focus",
      "Dark mode consistency: verify all new components match existing colour tokens",
      "Error boundary: wrap all route components — catches React errors, shows recovery UI",
      "Performance: lazy-load all page components (already done via React.lazy)",
    ],
    files: [
      "src/components/ui/Skeleton.tsx",
      "src/components/ui/Toast.tsx",
      "src/components/ui/ConfirmModal.tsx",
      "src/components/ui/EmptyState.tsx",
      "src/components/ui/ErrorBoundary.tsx",
    ]
  },
];

const MODULES_JSON = `{
  "clients": {
    "title": "Customers",
    "entity": "Client",
    "api": "/api/clients",
    "listColumns": ["first_name","last_name","email","phone","loyalty_points","status"],
    "fields": [
      { "name": "first_name",     "type": "text",   "label": "First name",  "required": true },
      { "name": "last_name",      "type": "text",   "label": "Last name",   "required": true },
      { "name": "email",          "type": "email",  "label": "Email",       "required": true },
      { "name": "phone",          "type": "text",   "label": "Phone" },
      { "name": "gender",         "type": "select", "label": "Gender",
        "options": ["male","female","other","prefer_not_to_say"] },
      { "name": "dob",            "type": "date",   "label": "Date of birth" },
      { "name": "loyalty_points", "type": "number", "label": "Loyalty points" }
    ],
    "permissions": {
      "list":   "client:read",
      "create": "client:create",
      "edit":   "client:update",
      "delete": "client:delete"
    }
  },

  "bookings": {
    "title": "Bookings",
    "entity": "Booking",
    "api": "/api/bookings",
    "listColumns": ["id","client_name","service_name","staff_name","start_time","status"],
    "fields": [
      { "name": "client_id",  "type": "select",   "label": "Customer",  "source": "clients",  "required": true },
      { "name": "service_id", "type": "select",   "label": "Service",   "source": "services", "required": true },
      { "name": "staff_id",   "type": "select",   "label": "Staff",     "source": "staff" },
      { "name": "start_time", "type": "datetime", "label": "Start time","required": true },
      { "name": "end_time",   "type": "datetime", "label": "End time",  "required": true },
      { "name": "status",     "type": "select",   "label": "Status",
        "options": ["pending","confirmed","in_progress","completed","cancelled","no_show"] },
      { "name": "notes",      "type": "textarea", "label": "Notes" }
    ],
    "permissions": {
      "list":   "booking:read",
      "create": "booking:create",
      "edit":   "booking:update",
      "delete": "booking:delete"
    }
  },

  "services": {
    "title": "Services",
    "entity": "Service",
    "api": "/api/services",
    "listColumns": ["name","category","service_type","duration_minutes","price_cents","active"],
    "fields": [
      { "name": "name",             "type": "text",    "label": "Service name",  "required": true },
      { "name": "category_id",      "type": "select",  "label": "Category",      "source": "service_categories" },
      { "name": "service_type",     "type": "select",  "label": "Type",
        "options": ["wellness","beauty","fitness","clinical","laboratory","emergency","laundry","home_service","consultation"] },
      { "name": "description",      "type": "textarea","label": "Description" },
      { "name": "duration_minutes", "type": "number",  "label": "Duration (min)","required": true },
      { "name": "price_cents",      "type": "number",  "label": "Price (cents)", "required": true },
      { "name": "requires_staff",   "type": "boolean", "label": "Requires staff" },
      { "name": "requires_room",    "type": "boolean", "label": "Requires room" },
      { "name": "active",           "type": "boolean", "label": "Active",        "default": true }
    ],
    "permissions": {
      "list":   "service:read",
      "create": "service:create",
      "edit":   "service:update",
      "delete": "service:delete"
    }
  }
}`;

const CRUD_HOOK = `// src/hooks/useCrud.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

export function useCrud<T extends { id: string }>(baseUrl: string) {
  const [data, setData]       = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T[]>(baseUrl);
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error ?? e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const create = async (payload: Omit<T, "id">) => {
    const res = await api.post<T>(baseUrl, payload);
    await fetchAll();
    return res.data;
  };

  const update = async (id: string, payload: Partial<T>) => {
    const res = await api.patch<T>(\`\${baseUrl}/\${id}\`, payload);
    await fetchAll();
    return res.data;
  };

  const deleteItem = async (id: string) => {
    await api.delete(\`\${baseUrl}/\${id}\`);
    await fetchAll();
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll, create, update, deleteItem };
}`;

const API_SERVICE = `// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from Clerk on every request
api.interceptors.request.use((config) => {
  const token = window.__clerk_session?.getToken?.();  // or from localStorage
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) window.location.href = "/login";
    if (err.response?.status === 403) console.warn("Forbidden:", err.config.url);
    return Promise.reject(err);
  }
);

export default api;`;

const NAVIGATION_TS = `// src/config/navigation.ts
export type NavChild  = { label: string; path: string };
export type NavSection = { title: string; icon: string; children: NavChild[] };

export const navigation: Record<string, NavSection[]> = {
  client: [
    { title: "Dashboard",      icon: "home",   children: [
        { label: "Overview",           path: "/app/client" },
        { label: "Upcoming Bookings",  path: "/app/client/bookings" },
        { label: "Alerts",             path: "/app/client/notifications" },
    ]},
    { title: "Services",       icon: "grid",   children: [
        { label: "Browse Services",    path: "/app/client/search" },
        { label: "Clinics",            path: "/app/client/services/clinical" },
        { label: "Home Services",      path: "/app/client/home-services" },
        { label: "Laundry",            path: "/app/client/laundry" },
        { label: "Wellness",           path: "/app/client/services/wellness" },
        { label: "Emergency",          path: "/app/client/emergency" },
        { label: "Telehealth",         path: "/app/client/telehealth" },
    ]},
  ],

  business_admin: [
    { title: "Dashboard",      icon: "home",   children: [
        { label: "Overview",           path: "/app/business-admin" },
        { label: "AI Insights",        path: "/app/business-admin/ai-insights" },
        { label: "Revenue",            path: "/app/business-admin/payments" },
    ]},
    { title: "Customers",      icon: "users",  children: [
        { label: "CRM",                path: "/app/business-admin/crm" },
        { label: "Leads",              path: "/app/business-admin/leads" },
        { label: "Reviews",            path: "/app/business-admin/reviews" },
    ]},
  ],

  staff: [
    { title: "My Work",        icon: "clock",  children: [
        { label: "My Schedule",        path: "/app/staff/schedule" },
        { label: "Today's Jobs",       path: "/app/staff/jobs/today" },
        { label: "Check-in / Out",     path: "/app/staff/checkin" },
    ]},
  ],

  operations: [
    { title: "Live Operations", icon: "activity", children: [
        { label: "Live Feed",          path: "/app/operations" },
        { label: "Dispatch Board",     path: "/app/operations/dispatch" },
        { label: "Active Jobs",        path: "/app/operations/jobs" },
    ]},
  ],

  kora_admin: [
    { title: "Platform",       icon: "globe",  children: [
        { label: "Platform Overview",  path: "/app/kora-admin" },
        { label: "System Health",      path: "/app/kora-admin/health" },
        { label: "AI Usage Metrics",   path: "/app/kora-admin/ai" },
    ]},
  ],
};`;

const TABS = [
  { id: "phases",   label: "9 Phases" },
  { id: "modules",  label: "modules.json" },
  { id: "hook",     label: "useCrud Hook" },
  { id: "api",      label: "api.ts" },
  { id: "nav",      label: "navigation.ts" },
];

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ExecutionPlaybook() {
  const [tab, setTab] = useState("phases");
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  const C = {
    bg:"#080a10", border:"rgba(255,255,255,0.07)", surface:"rgba(255,255,255,0.025)",
    muted:"#475569", teal:"#00e5c8", amber:"#f59e0b", red:"#ef4444", purple:"#a78bfa"
  };

  const doCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 2200);
  };

  const toggleTask = (phaseId: number, taskIdx: number) => {
    const k = `${phaseId}-${taskIdx}`;
    setCheckedTasks(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const phaseProgress = (phase: typeof PHASES[0]) => {
    const total = phase.tasks.length;
    const done = phase.tasks.filter((_, i) => checkedTasks[`${phase.id}-${i}`]).length;
    return { done, total, pct: Math.round(done / total * 100) };
  };

  const totalDone = Object.values(checkedTasks).filter(Boolean).length;
  const totalTasks = PHASES.reduce((n, p) => n + p.tasks.length, 0);

  const CODE_TABS: Record<string, string> = { hook: CRUD_HOOK, api: API_SERVICE, nav: NAVIGATION_TS, modules: MODULES_JSON };

  return (
    <div style={{ fontFamily:"'JetBrains Mono','Courier New',monospace", background:C.bg, minHeight:"100vh", color:"#dde4ef" }}>

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, background:"rgba(0,0,0,0.5)" }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.2em", color:C.teal, fontWeight:800 }}>KÓRA · EXECUTION PLAYBOOK</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9", marginTop:2 }}>UI Wiring → Production Code</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
            9 phases · {totalTasks} tasks · {totalDone}/{totalTasks} complete
          </div>
        </div>

        {/* Global progress */}
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:160 }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>OVERALL PROGRESS</div>
            <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.round(totalDone/totalTasks*100)}%`, background:C.teal, transition:"width 0.3s", borderRadius:3 }} />
            </div>
            <div style={{ fontSize:10, color:C.teal, marginTop:3 }}>{Math.round(totalDone/totalTasks*100)}%</div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding:"6px 12px", borderRadius:7,
                border: tab===t.id ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                background: tab===t.id ? `${C.teal}14` : C.surface,
                color: tab===t.id ? C.teal : C.muted,
                fontSize:10, fontWeight:700, fontFamily:"inherit", cursor:"pointer"
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* PHASES TAB */}
      {tab === "phases" && (
        <div style={{ padding:24, maxWidth:1000 }}>
          {PHASES.map((phase) => {
            const { done, total, pct } = phaseProgress(phase);
            const open = expandedPhase === phase.id;
            return (
              <div key={phase.id} style={{ marginBottom:12, background:C.surface, border:`1px solid ${open ? phase.color + "40" : C.border}`, borderRadius:14, overflow:"hidden" }}>
                {/* Phase header */}
                <div
                  onClick={() => setExpandedPhase(open ? -1 : phase.id)}
                  style={{ padding:"14px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, background: open ? `${phase.color}07` : "transparent" }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:`${phase.color}14`, border:`1px solid ${phase.color}28`, display:"flex", alignItems:"center", justifyContent:"center", color:phase.color, fontSize:13, fontWeight:800, flexShrink:0 }}>
                    {String(phase.id).padStart(2,"0")}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{phase.label}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                      {phase.effort} · {done}/{total} tasks done
                    </div>
                  </div>
                  {/* Phase progress bar */}
                  <div style={{ width:100, flexShrink:0 }}>
                    <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:phase.color, borderRadius:2, transition:"width 0.3s" }} />
                    </div>
                    <div style={{ fontSize:10, color:phase.color, marginTop:2, textAlign:"right" }}>{pct}%</div>
                  </div>
                  <span style={{ color:C.muted, fontSize:14, transition:"transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
                </div>

                {/* Expanded tasks */}
                {open && (
                  <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:16 }}>
                      {/* Tasks */}
                      <div>
                        <div style={{ fontSize:10, letterSpacing:"0.12em", color:phase.color, fontWeight:700, marginBottom:10 }}>TASKS</div>
                        {phase.tasks.map((task, i) => {
                          const done = checkedTasks[`${phase.id}-${i}`];
                          return (
                            <div key={i} onClick={() => toggleTask(phase.id, i)} style={{ display:"flex", gap:10, padding:"7px 0", cursor:"pointer", borderBottom:`1px solid rgba(255,255,255,0.03)` }}>
                              <div style={{ width:18, height:18, borderRadius:4, border:`1px solid ${done ? phase.color : C.muted}`, background: done ? `${phase.color}20` : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                                {done && <span style={{ fontSize:10, color:phase.color }}>✓</span>}
                              </div>
                              <span style={{ fontSize:11, color: done ? "#64748b" : "#94a3b8", lineHeight:1.5, textDecoration: done ? "line-through" : "none" }}>{task}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Files */}
                      <div>
                        <div style={{ fontSize:10, letterSpacing:"0.12em", color:C.muted, fontWeight:700, marginBottom:10 }}>FILES CREATED/MODIFIED</div>
                        {phase.files.map((f, i) => (
                          <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:`1px solid rgba(255,255,255,0.03)` }}>
                            <span style={{ color:`${phase.color}70`, fontSize:11 }}>+</span>
                            <code style={{ fontSize:10, color:C.muted, lineHeight:1.5 }}>{f}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CODE TABS */}
      {Object.keys(CODE_TABS).includes(tab) && (
        <div style={{ padding:24 }}>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <button onClick={() => doCopy(CODE_TABS[tab], tab)} style={{
              padding:"8px 18px", borderRadius:9,
              border:`1px solid ${copied===tab ? C.teal : C.border}`,
              background: copied===tab ? `${C.teal}14` : C.surface,
              color: copied===tab ? C.teal : C.muted,
              fontSize:11, fontWeight:800, fontFamily:"inherit", cursor:"pointer"
            }}>
              {copied===tab ? "✓ COPIED" : "COPY FILE"}
            </button>
          </div>
          <pre style={{
            background:"rgba(0,0,0,0.55)", border:`1px solid ${C.border}`, borderRadius:14,
            padding:"20px 22px", fontSize:11, lineHeight:1.9, color:"#64748b",
            whiteSpace:"pre-wrap", fontFamily:"inherit", maxHeight:"78vh", overflowY:"auto"
          }}>
            {CODE_TABS[tab]}
          </pre>
        </div>
      )}
    </div>
  );
}