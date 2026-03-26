import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "./contexts/KoraToastContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/index.css";

declare global {
  interface Window {
    __koraBootReady?: boolean;
    __koraShowBootFallback?: () => void;
  }
}

if (typeof window !== "undefined") {
  window.__koraBootReady = true;
  const bootFallback = document.getElementById("boot-fallback");
  if (bootFallback) {
    bootFallback.setAttribute("hidden", "true");
  }
}

/**
 * Global QueryClient for TanStack React Query
 * 
 * Configuration:
 * - staleTime: 5 minutes (data is fresh for 5 min before refetching)
 * - gcTime: 10 minutes (cached data garbage collected after 10 min)
 * - retry: 1 attempt on failure
 * - refetchOnWindowFocus: disabled for better UX
 * 
 * Error handling is configured via useQueryErrorHandler hook in App.tsx
 * This ensures errors are shown via ToastContext and stored in useAppStore
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes (formerly cacheTime)
      retry: 1,                       // Retry failed queries once
      refetchOnWindowFocus: false,    // Don't refetch on window focus
    },
    mutations: {
      retry: 0,                       // Don't auto-retry mutations
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
