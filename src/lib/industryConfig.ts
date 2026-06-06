// =====================================================================================
// INDUSTRY CONFIGURATION - Plain Language Labels for Every Business Type
// =====================================================================================
// This file defines how module names, descriptions, and icons adapt based on industry

export type IndustryType =
  | 'healthcare'
  | 'beauty'
  | 'fitness'
  | 'education'
  | 'transportation'
  | 'retail'
  | 'restaurant'
  | 'hospitality'
  | 'real_estate'
  | 'professional_services'
  | 'other';

export interface ModuleLabels {
  home: string;
  bookings: string;
  bookingsDesc: string;
  money: string;
  moneyDesc: string;
  team: string;
  teamDesc: string;
  customers: string;
  customersDesc: string;
  stock: string;
  stockDesc: string;
  showStock: boolean; // Some industries don't need inventory
  branches: string;
  reports: string;
  rules: string;
  assistant: string;
}

export interface IndustryConfig {
  labels: ModuleLabels;
  quickActions: {
    primary: string;
    primaryIcon: string;
    secondary: string;
    secondaryIcon: string;
    tertiary: string;
    tertiaryIcon: string;
  };
  stats: {
    revenue: string;
    bookings: string;
    customers: string;
    growth: string;
  };
}

// =====================================================================================
// INDUSTRY CONFIGURATIONS
// =====================================================================================

export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  // ---------------------------------------------------------------------------
  // HEALTHCARE (Hospitals, Clinics, Telemedicine, Dental, Mental Health)
  // ---------------------------------------------------------------------------
  healthcare: {
    labels: {
      home: 'Home',
      bookings: 'Appointments',
      bookingsDesc: 'Schedule patient visits and consultations',
      money: 'Money',
      moneyDesc: 'Track payments, bills, and insurance claims',
      team: 'Medical Staff',
      teamDesc: 'Doctors, nurses, therapists, and support staff',
      customers: 'Patients',
      customersDesc: 'Patient records, visit history, and notes',
      stock: 'Medical Supplies',
      stockDesc: 'Track medicines, equipment, and disposables',
      showStock: true,
      branches: 'Locations',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Book Appointment',
      primaryIcon: '🗓️',
      secondary: 'Add Patient',
      secondaryIcon: '👤',
      tertiary: 'Record Payment',
      tertiaryIcon: '💰',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Appointments Today',
      customers: 'Patients Seen',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // BEAUTY & WELLNESS (Salons, Spas, Barbershops, Tattoo, Nails)
  // ---------------------------------------------------------------------------
  beauty: {
    labels: {
      home: 'Home',
      bookings: 'Bookings',
      bookingsDesc: 'Schedule hair, nails, massage, facials, and more',
      money: 'Money',
      moneyDesc: 'Track service payments and product sales',
      team: 'Stylists & Therapists',
      teamDesc: 'Your team of beauty professionals',
      customers: 'Clients',
      customersDesc: 'Client contacts, visit history, and preferences',
      stock: 'Products & Supplies',
      stockDesc: 'Hair products, oils, cosmetics, and tools',
      showStock: true,
      branches: 'Locations',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Book Service',
      primaryIcon: '💇',
      secondary: 'Add Client',
      secondaryIcon: '✨',
      tertiary: 'Sell Product',
      tertiaryIcon: '🛍️',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Bookings Today',
      customers: 'Clients Served',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // FITNESS (Gyms, Personal Training, Yoga, Martial Arts, CrossFit)
  // ---------------------------------------------------------------------------
  fitness: {
    labels: {
      home: 'Home',
      bookings: 'Classes & Sessions',
      bookingsDesc: 'Schedule workouts, classes, and training sessions',
      money: 'Money',
      moneyDesc: 'Track memberships, class fees, and payments',
      team: 'Trainers & Instructors',
      teamDesc: 'Your fitness professionals and coaches',
      customers: 'Members',
      customersDesc: 'Member contacts, goals, and progress tracking',
      stock: 'Equipment & Gear',
      stockDesc: 'Fitness equipment, supplements, and merchandise',
      showStock: true,
      branches: 'Gym Locations',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Book Session',
      primaryIcon: '💪',
      secondary: 'Add Member',
      secondaryIcon: '🏃',
      tertiary: 'Track Progress',
      tertiaryIcon: '📊',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Sessions Today',
      customers: 'Active Members',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // EDUCATION (Schools, Tutoring, Training Centers, Online Courses)
  // ---------------------------------------------------------------------------
  education: {
    labels: {
      home: 'Home',
      bookings: 'Classes',
      bookingsDesc: 'Schedule lessons, courses, and tutoring sessions',
      money: 'Money',
      moneyDesc: 'Track tuition, class fees, and payments',
      team: 'Teachers & Tutors',
      teamDesc: 'Your teaching staff and instructors',
      customers: 'Students',
      customersDesc: 'Student records, progress, and parent contacts',
      stock: 'Learning Materials',
      stockDesc: 'Books, supplies, and teaching resources',
      showStock: true,
      branches: 'Campuses',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Schedule Class',
      primaryIcon: '📚',
      secondary: 'Add Student',
      secondaryIcon: '🎓',
      tertiary: 'Record Grade',
      tertiaryIcon: '✏️',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Classes Today',
      customers: 'Students Enrolled',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // TRANSPORTATION (Taxi, Ride-hailing, Delivery, Logistics)
  // ---------------------------------------------------------------------------
  transportation: {
    labels: {
      home: 'Home',
      bookings: 'Trips',
      bookingsDesc: 'Manage rides, pickups, and deliveries',
      money: 'Money',
      moneyDesc: 'Track fares, earnings, and driver payments',
      team: 'Drivers',
      teamDesc: 'Your drivers and delivery personnel',
      customers: 'Passengers',
      customersDesc: 'Customer contacts and trip history',
      stock: 'Vehicles',
      stockDesc: 'Fleet management and maintenance',
      showStock: false, // No traditional inventory
      branches: 'Operating Areas',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Create Trip',
      primaryIcon: '🚗',
      secondary: 'Add Driver',
      secondaryIcon: '👨‍✈️',
      tertiary: 'Track Vehicle',
      tertiaryIcon: '📍',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Trips Today',
      customers: 'Passengers Served',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // RETAIL & E-COMMERCE (Stores, Online Shops, Boutiques)
  // ---------------------------------------------------------------------------
  retail: {
    labels: {
      home: 'Home',
      bookings: 'Orders',
      bookingsDesc: 'Manage customer orders and deliveries',
      money: 'Money',
      moneyDesc: 'Track sales, payments, and refunds',
      team: 'Staff',
      teamDesc: 'Your sales and support team',
      customers: 'Customers',
      customersDesc: 'Customer contacts and purchase history',
      stock: 'Inventory',
      stockDesc: 'Products, stock levels, and orders',
      showStock: true,
      branches: 'Store Locations',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Create Order',
      primaryIcon: '🛒',
      secondary: 'Add Product',
      secondaryIcon: '📦',
      tertiary: 'Check Stock',
      tertiaryIcon: '📊',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Orders Today',
      customers: 'Customers Served',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // RESTAURANT & FOOD (Restaurants, Cafes, Food Trucks, Catering)
  // ---------------------------------------------------------------------------
  restaurant: {
    labels: {
      home: 'Home',
      bookings: 'Orders & Reservations',
      bookingsDesc: 'Manage table bookings and food orders',
      money: 'Money',
      moneyDesc: 'Track sales, tips, and payments',
      team: 'Kitchen & Servers',
      teamDesc: 'Your chefs, cooks, and waitstaff',
      customers: 'Guests',
      customersDesc: 'Guest contacts and dining history',
      stock: 'Kitchen Supplies',
      stockDesc: 'Food ingredients and restaurant supplies',
      showStock: true,
      branches: 'Restaurant Locations',
      reports: 'Reports',
      rules: 'Health & Safety',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'New Order',
      primaryIcon: '🍽️',
      secondary: 'Book Table',
      secondaryIcon: '🪑',
      tertiary: 'Check Kitchen',
      tertiaryIcon: '👨‍🍳',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Orders Today',
      customers: 'Guests Served',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // HOSPITALITY (Hotels, Hostels, B&Bs, Vacation Rentals)
  // ---------------------------------------------------------------------------
  hospitality: {
    labels: {
      home: 'Home',
      bookings: 'Reservations',
      bookingsDesc: 'Manage room bookings and guest stays',
      money: 'Money',
      moneyDesc: 'Track room payments and services',
      team: 'Hotel Staff',
      teamDesc: 'Front desk, housekeeping, and service staff',
      customers: 'Guests',
      customersDesc: 'Guest contacts and stay history',
      stock: 'Hotel Supplies',
      stockDesc: 'Linens, amenities, and housekeeping items',
      showStock: true,
      branches: 'Hotel Properties',
      reports: 'Reports',
      rules: 'Safety & Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Book Room',
      primaryIcon: '🛏️',
      secondary: 'Check-In Guest',
      secondaryIcon: '🔑',
      tertiary: 'Housekeeping',
      tertiaryIcon: '🧹',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Bookings Today',
      customers: 'Guests Staying',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // REAL ESTATE (Agencies, Property Management, Brokers)
  // ---------------------------------------------------------------------------
  real_estate: {
    labels: {
      home: 'Home',
      bookings: 'Viewings',
      bookingsDesc: 'Schedule property tours and inspections',
      money: 'Money',
      moneyDesc: 'Track commissions, rents, and deals',
      team: 'Agents',
      teamDesc: 'Your real estate agents and staff',
      customers: 'Clients',
      customersDesc: 'Buyer and seller contacts',
      stock: 'Properties',
      stockDesc: 'Listings, rentals, and property inventory',
      showStock: true,
      branches: 'Office Locations',
      reports: 'Reports',
      rules: 'Legal & Compliance',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Schedule Viewing',
      primaryIcon: '🏠',
      secondary: 'Add Property',
      secondaryIcon: '🏘️',
      tertiary: 'New Lead',
      tertiaryIcon: '📞',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Viewings Today',
      customers: 'Active Clients',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // PROFESSIONAL SERVICES (Consultants, Lawyers, Accountants, Freelancers)
  // ---------------------------------------------------------------------------
  professional_services: {
    labels: {
      home: 'Home',
      bookings: 'Meetings',
      bookingsDesc: 'Schedule consultations and client meetings',
      money: 'Money',
      moneyDesc: 'Track invoices, payments, and project fees',
      team: 'Team',
      teamDesc: 'Your consultants and support staff',
      customers: 'Clients',
      customersDesc: 'Client contacts and project history',
      stock: 'Resources',
      stockDesc: 'Documents, templates, and materials',
      showStock: false, // Service-only
      branches: 'Office Locations',
      reports: 'Reports',
      rules: 'Professional Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'Schedule Meeting',
      primaryIcon: '📅',
      secondary: 'Add Client',
      secondaryIcon: '🤝',
      tertiary: 'Create Invoice',
      tertiaryIcon: '📄',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Meetings Today',
      customers: 'Active Clients',
      growth: 'This Week',
    },
  },

  // ---------------------------------------------------------------------------
  // OTHER / GENERAL (Default fallback)
  // ---------------------------------------------------------------------------
  other: {
    labels: {
      home: 'Home',
      bookings: 'Bookings',
      bookingsDesc: 'Schedule appointments and services',
      money: 'Money',
      moneyDesc: 'Track payments and earnings',
      team: 'Team',
      teamDesc: 'Your staff and employees',
      customers: 'Customers',
      customersDesc: 'Customer contacts and history',
      stock: 'Inventory',
      stockDesc: 'Products and supplies',
      showStock: true,
      branches: 'Locations',
      reports: 'Reports',
      rules: 'Standards',
      assistant: 'Helper',
    },
    quickActions: {
      primary: 'New Booking',
      primaryIcon: '📅',
      secondary: 'Add Customer',
      secondaryIcon: '👤',
      tertiary: 'Record Payment',
      tertiaryIcon: '💰',
    },
    stats: {
      revenue: 'Money Made Today',
      bookings: 'Bookings Today',
      customers: 'Customers Served',
      growth: 'This Week',
    },
  },
};

// =====================================================================================
// HELPER FUNCTION
// =====================================================================================

/**
 * Get industry-specific configuration based on tenant industry
 * @param industry - The industry string from tenant
 * @returns Industry configuration with plain language labels
 */
export function getIndustryConfig(industry: string | null): IndustryConfig {
  if (!industry) return INDUSTRY_CONFIGS.other;

  const normalized = industry.toLowerCase().replace(/[^a-z_]/g, '_');

  // Map common variations to our industry types
  if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('clinic') || normalized.includes('hospital')) {
    return INDUSTRY_CONFIGS.healthcare;
  }
  if (normalized.includes('beauty') || normalized.includes('salon') || normalized.includes('spa') || normalized.includes('barber')) {
    return INDUSTRY_CONFIGS.beauty;
  }
  if (normalized.includes('fitness') || normalized.includes('gym') || normalized.includes('yoga') || normalized.includes('training')) {
    return INDUSTRY_CONFIGS.fitness;
  }
  if (normalized.includes('education') || normalized.includes('school') || normalized.includes('tutor') || normalized.includes('learning')) {
    return INDUSTRY_CONFIGS.education;
  }
  if (normalized.includes('taxi') || normalized.includes('transport') || normalized.includes('delivery') || normalized.includes('logistics')) {
    return INDUSTRY_CONFIGS.transportation;
  }
  if (normalized.includes('retail') || normalized.includes('shop') || normalized.includes('store') || normalized.includes('ecommerce')) {
    return INDUSTRY_CONFIGS.retail;
  }
  if (normalized.includes('restaurant') || normalized.includes('food') || normalized.includes('cafe') || normalized.includes('catering')) {
    return INDUSTRY_CONFIGS.restaurant;
  }
  if (normalized.includes('hotel') || normalized.includes('hospitality') || normalized.includes('hostel') || normalized.includes('lodging')) {
    return INDUSTRY_CONFIGS.hospitality;
  }
  if (normalized.includes('real_estate') || normalized.includes('property') || normalized.includes('realtor')) {
    return INDUSTRY_CONFIGS.real_estate;
  }
  if (normalized.includes('consult') || normalized.includes('lawyer') || normalized.includes('account') || normalized.includes('professional')) {
    return INDUSTRY_CONFIGS.professional_services;
  }

  return INDUSTRY_CONFIGS.other;
}
