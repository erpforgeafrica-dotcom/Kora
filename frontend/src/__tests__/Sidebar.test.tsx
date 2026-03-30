import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "../components/layout/Sidebar";

let mockPathname = "/app/business-admin";
let mockSearch = "";
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname, search: mockSearch }),
    BrowserRouter: actual.BrowserRouter,
  };
});

import { BrowserRouter } from "react-router-dom";

vi.mock("../config/navigation", () => ({
  getNavigationForRole: () => [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "home",
      overviewPath: "/app/business-admin",
      description: "Dashboard section",
      children: [
        { label: "Overview", path: "/app/business-admin" },
        { label: "AI Insights", path: "/app/business-admin/ai-insights" },
      ],
    },
    {
      id: "customers",
      title: "Customers",
      icon: "users",
      overviewPath: "/app/business-admin/crm",
      description: "Customers section",
      children: [
        { label: "CRM", path: "/app/business-admin/crm" },
        { label: "Leads", path: "/app/business-admin/leads" },
      ],
    },
  ],
}));

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <Sidebar role="business_admin" />
    </BrowserRouter>
  );
};

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname = "/app/business-admin";
    mockSearch = "";
    mockNavigate.mockReset();
  });

  it("renders navigation sections", () => {
    renderSidebar();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("opens another section and navigates to its overview", () => {
    renderSidebar();

    const dashboardSection = screen.getByText("Dashboard");
    const customersSection = screen.getByText("Customers");

    expect(screen.getByText("Overview")).toBeInTheDocument();

    fireEvent.click(dashboardSection);
    expect(mockNavigate).toHaveBeenCalledWith("/app/business-admin");

    fireEvent.click(customersSection);
    expect(screen.getByText("CRM")).toBeInTheDocument();
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/app/business-admin/crm");
  });

  it("highlights active link based on current path", () => {
    mockPathname = "/app/business-admin/crm";
    renderSidebar();

    const crmButton = screen.getByText("CRM").closest("button");
    expect(crmButton).not.toBeNull();

    return waitFor(() => {
      const el = crmButton as HTMLButtonElement;
      expect(el.style.background).toBe("var(--color-accent-dim)");
      expect(el.style.color).toBe("var(--color-accent)");
    });
  });

  it("only shows one section expanded at a time", () => {
    renderSidebar();

    const dashboardSection = screen.getByText("Dashboard");
    const customersSection = screen.getByText("Customers");

    fireEvent.click(customersSection);
    expect(screen.getByText("CRM")).toBeInTheDocument();

    fireEvent.click(dashboardSection);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.queryByText("CRM")).not.toBeInTheDocument();
  });
});
