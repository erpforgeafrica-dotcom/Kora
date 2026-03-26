import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "../components/layout/Sidebar";

let mockPathname = "/app/business-admin";
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
    BrowserRouter: actual.BrowserRouter,
  };
});

import { BrowserRouter } from "react-router-dom";

// Mock the navigation config consumed by Sidebar
vi.mock("../config/navigation", () => ({
  navigation: {
    business_admin: [
      {
        title: "Dashboard",
        icon: "home",
        children: [
          { label: "Overview", path: "/app/business-admin" },
          { label: "AI Insights", path: "/app/business-admin/ai-insights" },
        ],
      },
      {
        title: "Customers",
        icon: "users",
        children: [
          { label: "CRM", path: "/app/business-admin/crm" },
          { label: "Leads", path: "/app/business-admin/leads" },
        ],
      },
    ],
  },
}));

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <Sidebar role="business_admin" />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    mockPathname = "/app/business-admin";
    mockNavigate.mockReset();
  });

  it('renders navigation sections', () => {
    renderSidebar();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('expands and collapses sections on click', () => {
    renderSidebar();
    
    const dashboardSection = screen.getByText('Dashboard');
    const customersSection = screen.getByText('Customers');
    
    // Initially first section should be expanded
    expect(screen.getByText('Overview')).toBeInTheDocument();
    
    // Click to collapse dashboard
    fireEvent.click(dashboardSection);
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    
    // Click to expand customers
    fireEvent.click(customersSection);
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
  });

  it('highlights active link based on current path', () => {
    mockPathname = '/app/business-admin/crm';
    renderSidebar();
    
    const crmButton = screen.getByText("CRM").closest("button");
    expect(crmButton).not.toBeNull();
    // `toHaveStyle()` uses computed styles; CSS variables don't resolve in JSDOM.
    // Assert inline style values instead.
    return waitFor(() => {
      const el = crmButton as HTMLButtonElement;
      expect(el.style.background).toBe("var(--color-accent-dim)");
      expect(el.style.border).toBe("1px solid var(--color-accent)");
      expect(el.style.color).toBe("var(--color-accent)");
    });
  });

  it('only shows one section expanded at a time', () => {
    renderSidebar();
    
    const dashboardSection = screen.getByText('Dashboard');
    const customersSection = screen.getByText('Customers');
    
    // Expand customers
    fireEvent.click(customersSection);
    expect(screen.getByText('CRM')).toBeInTheDocument();
    
    // Expand dashboard - should close customers
    fireEvent.click(dashboardSection);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });
});
