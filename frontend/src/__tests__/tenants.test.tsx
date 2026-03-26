// frontend/src/__tests__/tenants.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TenantsListPage from "@/pages/tenants/ListPage";
import TenantsCreatePage from "@/pages/tenants/CreatePage";
import TenantsEditPage from "@/pages/tenants/EditPage";

const tenantsData = [
  {
    id: "tenant-1",
    name: "Acme Corp",
    industry: "Wellness",
    status: "active",
    created_at: "2026-03-12T00:00:00.000Z",
  },
];

const createMock = vi.fn();
const updateMock = vi.fn();
const deleteItemMock = vi.fn();
const refetchMock = vi.fn();

// Mock the useCrud hook so we don't hit the network
vi.mock("@/hooks/useCrud", () => ({
  useCrud: () => ({
    data: tenantsData,
    loading: false,
    error: null,
    create: createMock,
    update: updateMock,
    deleteItem: deleteItemMock,
    refetch: refetchMock,
  }),
}));

const WithRouter = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/app/kora-admin/tenants"]}>{children}</MemoryRouter>
);

describe("Tenants CRUD UI", () => {
  test("List page renders a tenant row", async () => {
    render(<TenantsListPage />, { wrapper: WithRouter });
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Wellness")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  test("Create button navigates to the create page", async () => {
    render(<TenantsListPage />, { wrapper: WithRouter });
    const createBtn = screen.getByRole("button", { name: /new tenant/i });
    fireEvent.click(createBtn);
    render(<TenantsCreatePage />, { wrapper: WithRouter });
    expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
  });

  test("Edit button opens the edit form with pre-filled data", async () => {
    render(
      <MemoryRouter initialEntries={["/app/kora-admin/tenants/tenant-1/edit"]}>
        <Routes>
          <Route path="/app/kora-admin/tenants/:id/edit" element={<TenantsEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Wellness")).toBeInTheDocument();
    });
  });
});
