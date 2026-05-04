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
if (!CLERK_KEY) {
  const errorMsg = "VITE_CLERK_PUBLISHABLE_KEY is not configured. Please check deployment environment variables.";
  console.error(errorMsg);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;font-family:system-ui">
      <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <h1 style="color:#d32f2f;margin:0 0 20px 0">Configuration Error</h1>
        <p style="color:#666;margin:0">${errorMsg}</p>
        <p style="color:#999;font-size:12px;margin:20px 0 0 0">Please set VITE_CLERK_PUBLISHABLE_KEY in your deployment environment.</p>
      </div>
    </div>
  `;
  throw new Error(errorMsg);
}

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
