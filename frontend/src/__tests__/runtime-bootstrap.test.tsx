import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/KoraToastContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ErrorBoundary from "@/components/ErrorBoundary";

function renderApp(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <ErrorBoundary>
      <MemoryRouter initialEntries={[initialEntry]}>
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
      </MemoryRouter>
    </ErrorBoundary>
  );
}

describe("runtime bootstrap", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the login page without the global runtime error", async () => {
    renderApp("/login");

    await screen.findByRole("heading", { name: /sign in/i });
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cannot read properties of null/i)).not.toBeInTheDocument();
  });

  it("redirects unauthenticated business-admin visits back to login cleanly", async () => {
    renderApp("/app/business-admin");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cannot read properties of null/i)).not.toBeInTheDocument();
  });

  it("renders failed login errors without tripping the global error boundary", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        },
      }),
    } as Response);

    renderApp("/login");

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: "admin@pharmacy.com" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});
