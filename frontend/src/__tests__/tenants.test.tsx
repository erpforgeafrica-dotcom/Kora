// frontend/src/__tests__/tenants.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TenantsListPage from "@/pages/tenants/ListPage";
import TenantsCreatePage from "@/pages/tenants/CreatePage";
import TenantsEditPage from "@/pages/tenants/EditPage";
import * as platformAdmin from "@/services/platformAdmin";

const tenantsData = [
  {
    id: "tenant-1",
    name: "Acme Corp",
    industry: "Wellness",
    status: "active",
    created_at: "2026-03-12T00:00:00.000Z",
  },
];

vi.mock("@/services/platformAdmin", async () => {
  const actual = await vi.importActual<typeof import("@/services/platformAdmin")>("@/services/platformAdmin");
  return {
    ...actual,
    getTenants: vi.fn(),
    getTenant: vi.fn(),
    updateTenantStatus: vi.fn(),
    updateTenant: vi.fn(),
  };
});

describe("Tenants CRUD UI", () => {
  beforeEach(() => {
    vi.mocked(platformAdmin.getTenants).mockResolvedValue(tenantsData);
    vi.mocked(platformAdmin.getTenant).mockResolvedValue(tenantsData[0]);
    vi.mocked(platformAdmin.updateTenantStatus).mockResolvedValue(tenantsData[0]);
    vi.mocked(platformAdmin.updateTenant).mockResolvedValue(tenantsData[0]);
  });

  test("List page renders a tenant row", async () => {
    render(
      <MemoryRouter initialEntries={["/app/kora-admin/tenants"]}>
        <TenantsListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("Wellness")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });
  });

  test("Create button navigates to the create page", async () => {
    render(
      <MemoryRouter initialEntries={["/app/kora-admin/tenants"]}>
        <Routes>
          <Route path="/app/kora-admin/tenants" element={<TenantsListPage />} />
          <Route path="/app/kora-admin/tenants/create" element={<TenantsCreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Acme Corp")).toBeInTheDocument());
    const createBtn = screen.getByRole("button", { name: /new tenant/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    });
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
