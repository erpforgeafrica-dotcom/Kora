import { create } from "zustand";
import { getReportingSummary } from "../services/api";
import type { ReportingSummary } from "../types";
import type { DashboardRole } from "../auth/dashboardAccess";

interface AppState {
  // Server state
  loading: boolean;
  error: string | null;
  summary: ReportingSummary | null;
  refresh: () => Promise<void>;
  
  // Error management (for TanStack Query global error handler)
  setAppError: (error: string) => void;
  clearAppError: () => void;
  lastError: string | null;
  errorTimestamp: number | null;

  // UI state shared across modules
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Role override (dev/demo: URL ?role= param persisted here)
  activeRoleOverride: DashboardRole | null;
  setActiveRoleOverride: (role: DashboardRole | null) => void;

  // Notification badge count (incremented by NotificationContext, read by AppShell)
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  loading: false,
  error: null,
  summary: null,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await getReportingSummary();
      set({ summary, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "unknown_error" });
    }
  },
  
  // Error management for TanStack Query global handler
  lastError: null,
  errorTimestamp: null,
  setAppError: (error: string) => {
    set({ 
      lastError: error,
      errorTimestamp: Date.now(),
      error: error
    });
  },
  clearAppError: () => {
    set({ 
      lastError: null,
      errorTimestamp: null,
      error: null 
    });
  },

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeRoleOverride: null,
  setActiveRoleOverride: (role) => set({ activeRoleOverride: role }),

  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}));
