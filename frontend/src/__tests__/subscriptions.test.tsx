// frontend/src/__tests__/subscriptions.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SubscriptionsListPage from "@/pages/subscriptions/ListPage";
import SubscriptionsCreatePage from "@/pages/subscriptions/CreatePage";
import SubscriptionsEditPage from "@/pages/subscriptions/EditPage";
import * as platformAdmin from "@/services/platformAdmin";

const subscriptionsData = [
  {
    id: "sub-1",
    organization_id: "org-1",
    plan_name: "Gold",
    billing_cycle: "monthly",
    price_usd: 199,
    status: "active",
    start_date: "2024-01-01T00:00:00.000Z",
    end_date: "2024-12-31T00:00:00.000Z",
  },
];

vi.mock("@/services/platformAdmin", async () => {
  const actual = await vi.importActual<typeof import("@/services/platformAdmin")>("@/services/platformAdmin");
  return {
    ...actual,
    getSubscriptions: vi.fn(),
    getSubscription: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
  };
});

describe("Subscriptions CRUD UI", () => {
  beforeEach(() => {
    vi.mocked(platformAdmin.getSubscriptions).mockResolvedValue([
      {
        id: "sub-1",
        organization_id: "org-1",
        plan: "Gold",
        status: "active",
        current_period_start: "2024-01-01T00:00:00.000Z",
        current_period_end: "2024-12-31T00:00:00.000Z",
        created_at: "2024-01-01T00:00:00.000Z",
        provider_subscription_id: null,
      },
    ]);
    vi.mocked(platformAdmin.getSubscription).mockResolvedValue({
      id: "sub-1",
      organization_id: "org-1",
      plan: "Gold",
      status: "active",
      current_period_start: "2024-01-01T00:00:00.000Z",
      current_period_end: "2024-12-31T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      provider_subscription_id: null,
    });
    vi.mocked(platformAdmin.updateSubscription).mockResolvedValue({
      id: "sub-1",
      organization_id: "org-1",
      plan: "Gold",
      status: "active",
      current_period_start: "2024-01-01T00:00:00.000Z",
      current_period_end: "2024-12-31T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      provider_subscription_id: null,
    });
  });

  test("renders a subscription row", async () => {
    render(
      <MemoryRouter initialEntries={["/app/kora-admin/subscriptions"]}>
        <SubscriptionsListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Gold")).toBeInTheDocument();
      expect(screen.getByText("org-1")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });
  });

  test('clicking "New Subscription" shows the create form', async () => {
    render(
      <MemoryRouter initialEntries={["/app/kora-admin/subscriptions"]}>
        <Routes>
          <Route path="/app/kora-admin/subscriptions" element={<SubscriptionsListPage />} />
          <Route path="/app/kora-admin/subscriptions/create" element={<SubscriptionsCreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Gold")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /new subscription/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/plan/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });
  });

  test("edit form is pre-filled", async () => {
    render(
      <MemoryRouter initialEntries={["/app/kora-admin/subscriptions/sub-1/edit"]}>
        <Routes>
          <Route path="/app/kora-admin/subscriptions/:id/edit" element={<SubscriptionsEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Gold")).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toHaveValue("active");
    });
  });
});
