import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/LoginPage";

const navigateMock = vi.fn();
const setTokenMock = vi.fn().mockResolvedValue(undefined);

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    setToken: setTokenMock,
    isLoading: false,
    userRole: null,
    isAuthenticated: false,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    setTokenMock.mockClear();
    vi.restoreAllMocks();
  });

  it("renders canonical API error messages without crashing", async () => {
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

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    expect(setTokenMock).not.toHaveBeenCalled();
  });
});
