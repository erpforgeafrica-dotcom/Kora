import React, { useState } from "react";

interface MenuItem {
  id: string;
  label: string;
  path?: string;
  children?: MenuItem[];
}

interface HierarchicalMenuProps {
  items?: MenuItem[];
  onNavigate: (path: string) => void;
}

const ChevronDown = () => <span className="text-gray-500">▾</span>;
const ChevronRight = () => <span className="text-gray-500">▸</span>;

const MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'platform-core',
    label: 'Platform Core',
    children: [
      { id: 'organizations', label: 'Organizations', path: '/organizations' },
      { id: 'organization-settings', label: 'Organization Settings', path: '/organization-settings' },
      { id: 'users', label: 'Users', path: '/users' },
      { id: 'roles', label: 'Roles', path: '/roles' },
      { id: 'permissions', label: 'Permissions', path: '/permissions' },
      { id: 'role-permissions', label: 'Role Permissions', path: '/role-permissions' },
      { id: 'audit-logs', label: 'Audit Logs', path: '/audit-logs' }
    ]
  },
  {
    id: 'crm',
    label: 'CRM',
    children: [
      { id: 'customers', label: 'Customers', path: '/crm/customers' },
      { id: 'customer-addresses', label: 'Customer Addresses', path: '/crm/customer-addresses' },
      { id: 'customer-preferences', label: 'Customer Preferences', path: '/crm/customer-preferences' },
      { id: 'customer-notes', label: 'Customer Notes', path: '/crm/customer-notes' }
    ]
  },
  {
    id: 'leads-opportunities',
    label: 'Leads & Opportunities',
    children: [
      { id: 'leads', label: 'Leads', path: '/crm/leads' },
      { id: 'lead-interactions', label: 'Lead Interactions', path: '/crm/lead-interactions' },
      { id: 'opportunities', label: 'Opportunities', path: '/crm/opportunities' },
      { id: 'opportunity-activities', label: 'Opportunity Activities', path: '/crm/opportunity-activities' }
    ]
  },
  {
    id: 'loyalty',
    label: 'Loyalty',
    children: [
      { id: 'loyalty-programs', label: 'Loyalty Programs', path: '/loyalty/programs' },
      { id: 'loyalty-tiers', label: 'Loyalty Tiers', path: '/loyalty/tiers' },
      { id: 'loyalty-transactions', label: 'Loyalty Transactions', path: '/loyalty/transactions' },
      { id: 'loyalty-rewards', label: 'Loyalty Rewards', path: '/loyalty/rewards' },
      { id: 'loyalty-redemptions', label: 'Loyalty Redemptions', path: '/loyalty/redemptions' },
      { id: 'referrals', label: 'Referrals', path: '/loyalty/referrals' }
    ]
  },
  {
    id: 'bookings-engine',
    label: 'Bookings Engine',
    children: [
      { id: 'services', label: 'Services', path: '/services' },
      { id: 'service-categories', label: 'Service Categories', path: '/service-categories' },
      { id: 'service-rooms', label: 'Service Rooms', path: '/service-rooms' },
      { id: 'service-vehicles', label: 'Service Vehicles', path: '/service-vehicles' },
      { id: 'service-equipment', label: 'Service Equipment', path: '/service-equipment' },
      { id: 'service-inventory-requirements', label: 'Service Inventory Requirements', path: '/service-inventory-requirements' },
      { id: 'bookings', label: 'Bookings', path: '/bookings' },
      { id: 'booking-notes', label: 'Booking Notes', path: '/booking-notes' },
      { id: 'booking-addons', label: 'Booking Addons', path: '/booking-addons' },
      { id: 'staff-availability', label: 'Staff Availability', path: '/staff-availability' },
      { id: 'room-availability', label: 'Room Availability', path: '/room-availability' },
      { id: 'vehicle-availability', label: 'Vehicle Availability', path: '/vehicle-availability' },
      { id: 'service-time-slots', label: 'Service Time Slots', path: '/service-time-slots' }
    ]
  },
  {
    id: 'clinical',
    label: 'Clinical',
    children: [
      { id: 'patients', label: 'Patients', path: '/clinical/patients' },
      { id: 'clinical-appointments', label: 'Clinical Appointments', path: '/clinical/appointments' },
      { id: 'lab-orders', label: 'Lab Orders', path: '/clinical/lab-orders' },
      { id: 'lab-results', label: 'Lab Results', path: '/clinical/lab-results' },
      { id: 'prescriptions', label: 'Prescriptions', path: '/clinical/prescriptions' },
      { id: 'diagnoses', label: 'Diagnoses', path: '/clinical/diagnoses' },
      { id: 'clinical-notes', label: 'Clinical Notes', path: '/clinical/notes' }
    ]
  },
  {
    id: 'emergency',
    label: 'Emergency',
    children: [
      { id: 'emergency-requests', label: 'Emergency Requests', path: '/emergency/requests' },
      { id: 'dispatch-units', label: 'Dispatch Units', path: '/emergency/dispatch-units' },
      { id: 'incident-reports', label: 'Incident Reports', path: '/emergency/incident-reports' },
      { id: 'response-times', label: 'Response Times', path: '/emergency/response-times' }
    ]
  },
  {
    id: 'laundry',
    label: 'Laundry',
    children: [
      { id: 'laundry-orders', label: 'Laundry Orders', path: '/laundry/orders' }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    children: [
      { id: 'products', label: 'Products', path: '/inventory/products' },
      { id: 'product-categories', label: 'Product Categories', path: '/inventory/product-categories' },
      { id: 'stock-levels', label: 'Stock Levels', path: '/inventory/stock-levels' },
      { id: 'stock-movements', label: 'Stock Movements', path: '/inventory/stock-movements' },
      { id: 'suppliers', label: 'Suppliers', path: '/inventory/suppliers' },
      { id: 'purchase-orders', label: 'Purchase Orders', path: '/inventory/purchase-orders' },
      { id: 'warehouses', label: 'Warehouses', path: '/inventory/warehouses' }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    children: [
      { id: 'payments', label: 'Payments', path: '/finance/payments' },
      { id: 'transactions', label: 'Transactions', path: '/finance/transactions' },
      { id: 'invoices', label: 'Invoices', path: '/finance/invoices' },
      { id: 'refunds', label: 'Refunds', path: '/finance/refunds' },
      { id: 'subscriptions', label: 'Subscriptions', path: '/finance/subscriptions' },
      { id: 'payouts', label: 'Payouts', path: '/finance/payouts' },
      { id: 'tax-records', label: 'Tax Records', path: '/finance/tax-records' }
    ]
  },
  {
    id: 'social-media',
    label: 'Social & Media',
    children: [
      { id: 'social-accounts', label: 'Social Accounts', path: '/social/accounts' },
      { id: 'social-leads', label: 'Social Leads', path: '/social/leads' },
      { id: 'social-messages', label: 'Social Messages', path: '/social/messages' },
      { id: 'social-campaigns', label: 'Social Campaigns', path: '/social/campaigns' },
      { id: 'reviews', label: 'Reviews', path: '/social/reviews' },
      { id: 'media-assets', label: 'Media Assets', path: '/social/media-assets' }
    ]
  },
  {
    id: 'messaging',
    label: 'Messaging',
    children: [
      { id: 'conversations', label: 'Conversations', path: '/messaging/conversations' },
      { id: 'messages', label: 'Messages', path: '/messaging/messages' }
    ]
  },
  {
    id: 'content',
    label: 'Content',
    children: [
      { id: 'content-posts', label: 'Content Posts', path: '/content/posts' }
    ]
  },
  {
    id: 'gps-location',
    label: 'GPS/Location',
    children: [
      { id: 'locations', label: 'Locations', path: '/location/locations' },
      { id: 'service-zones', label: 'Service Zones', path: '/location/service-zones' },
      { id: 'staff-locations', label: 'Staff Locations', path: '/location/staff-locations' },
      { id: 'emergency-units', label: 'Emergency Units', path: '/location/emergency-units' },
      { id: 'customer-coordinates', label: 'Customer Coordinates', path: '/location/customer-coordinates' }
    ]
  },
  {
    id: 'ai-intelligence',
    label: 'AI Intelligence',
    children: [
      { id: 'ai-crm-scores', label: 'AI CRM Scores', path: '/ai/crm-scores' },
      { id: 'ai-demand-forecasts', label: 'AI Demand Forecasts', path: '/ai/demand-forecasts' },
      { id: 'ai-staff-recommendations', label: 'AI Staff Recommendations', path: '/ai/staff-recommendations' },
      { id: 'ai-lead-scores', label: 'AI Lead Scores', path: '/ai/lead-scores' },
      { id: 'ai-pricing-signals', label: 'AI Pricing Signals', path: '/ai/pricing-signals' }
    ]
  },
  {
    id: 'projects-planning',
    label: 'Projects/Planning',
    children: [
      { id: 'projects', label: 'Projects', path: '/projects' },
      { id: 'tasks', label: 'Tasks', path: '/projects/tasks' },
      { id: 'task-dependencies', label: 'Task Dependencies', path: '/projects/task-dependencies' },
      { id: 'milestones', label: 'Milestones', path: '/projects/milestones' },
      { id: 'documents', label: 'Documents', path: '/projects/documents' },
      { id: 'comments', label: 'Comments', path: '/projects/comments' },
      { id: 'activity-logs', label: 'Activity Logs', path: '/projects/activity-logs' }
    ]
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    children: [
      { id: 'campaigns', label: 'Campaigns', path: '/campaigns' },
      { id: 'campaign-messages', label: 'Campaign Messages', path: '/campaigns/messages' },
      { id: 'campaign-targets', label: 'Campaign Targets', path: '/campaigns/targets' },
      { id: 'campaign-results', label: 'Campaign Results', path: '/campaigns/results' }
    ]
  }
];

export const HierarchicalMenu: React.FC<HierarchicalMenuProps> = ({ items = MENU_STRUCTURE, onNavigate }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center justify-between px-4 py-2 text-left
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
            ${level > 0 ? 'pl-8' : ''}
          `}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {item.label}
          </span>
          {hasChildren && (isExpanded ? <ChevronDown /> : <ChevronRight />)}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200 dark:border-gray-700 ml-4">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          KÓRA Platform
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          250+ Tables • 16 Domains
        </p>
      </div>
      <div className="overflow-y-auto max-h-screen">
        {items.map(item => renderMenuItem(item))}
      </div>
    </div>
  );
};

export default HierarchicalMenu;
