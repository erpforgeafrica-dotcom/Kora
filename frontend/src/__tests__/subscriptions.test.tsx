// frontend/src/__tests__/subscriptions.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SubscriptionsListPage from "@/pages/subscriptions/ListPage";
import SubscriptionsCreatePage from "@/pages/subscriptions/CreatePage";
import SubscriptionsEditPage from "@/pages/subscriptions/EditPage";

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

const createMock = vi.fn();
const updateMock = vi.fn();
const deleteItemMock = vi.fn();
const refetchMock = vi.fn();

vi.mock("@/hooks/useCrud", () => ({
  useCrud: () => ({
    data: subscriptionsData,
    loading: false,
    error: null,
    create: createMock,
    update: updateMock,
    deleteItem: deleteItemMock,
    refetch: refetchMock,
  }),
}));

const WithRouter = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/app/kora-admin/subscriptions"]}>{children}</MemoryRouter>
);

describe("Subscriptions CRUD UI", () => {
  test("renders a subscription row", async () => {
    render(<SubscriptionsListPage />, { wrapper: WithRouter });
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("monthly")).toBeInTheDocument();
    expect(screen.getByText("199")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  test('clicking "New Subscription" shows the create form', async () => {
    render(<SubscriptionsListPage />, { wrapper: WithRouter });
    fireEvent.click(screen.getByRole("button", { name: /new subscription/i }));
    render(<SubscriptionsCreatePage />, { wrapper: WithRouter });
    expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/billing cycle/i)).toBeInTheDocument();
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
      expect(screen.getByDisplayValue("199")).toBeInTheDocument();
    });
  });
});
