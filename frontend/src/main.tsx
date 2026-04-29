import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as ClerkReact from "@clerk/clerk-react";
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

const { ClerkProvider } = ClerkReact as unknown as {
  ClerkProvider: React.ComponentType<{ publishableKey: string; afterSignOutUrl?: string; children?: React.ReactNode }>;
};

if (typeof window !== "undefined") {
  window.__koraBootReady = true;
  const bootFallback = document.getElementById("boot-fallback");
  if (bootFallback) bootFallback.setAttribute("hidden", "true");
}

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
if (!CLERK_KEY) throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set in frontend/.env");

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
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
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
