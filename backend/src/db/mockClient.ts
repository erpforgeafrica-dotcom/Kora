// Enhanced mock database with all schema tables from migrations 012-022
const mockData: Record<string, any[]> = {
  // Existing core tables
  clients: [
    { id: "1", first_name: "John", last_name: "Doe", email: "john@example.com", phone: "+1234567890", membership_tier: "premium", address: "123 Main St", city: "New York", state: "NY", zip_code: "10001", loyalty_points: 1250 },
    { id: "2", first_name: "Jane", last_name: "Smith", email: "jane@example.com", phone: "+1234567891", membership_tier: "standard", address: "456 Oak Ave", city: "Los Angeles", state: "CA", zip_code: "90210", loyalty_points: 850 },
    { id: "3", first_name: "Mike", last_name: "Johnson", email: "mike@example.com", phone: "+1234567892", membership_tier: "vip", address: "789 Pine Rd", city: "Chicago", state: "IL", zip_code: "60601", loyalty_points: 2100 }
  ],
  
  bookings: [
    { id: "1", client_id: "1", service_id: "1", staff_id: "1", booking_date: "2024-03-15", booking_time: "10:00", status: "confirmed", duration: 60, notes: "Regular haircut", total_amount: 50 },
    { id: "2", client_id: "2", service_id: "2", staff_id: "2", booking_date: "2024-03-16", booking_time: "14:00", status: "pending", duration: 90, notes: "Deep tissue massage", total_amount: 80 },
    { id: "3", client_id: "3", service_id: "1", staff_id: "1", booking_date: "2024-03-17", booking_time: "09:00", status: "completed", duration: 60, notes: "Trim and style", total_amount: 50 }
  ],
  
  services: [
    { id: "1", name: "Haircut", description: "Professional haircut and styling", price: 50, duration: 60, category: "Hair", is_active: true, inventory_required: false },
    { id: "2", name: "Deep Tissue Massage", description: "Therapeutic deep tissue massage", price: 80, duration: 90, category: "Wellness", is_active: true, inventory_required: true },
    { id: "3", name: "Facial Treatment", description: "Rejuvenating facial treatment", price: 65, duration: 75, category: "Skincare", is_active: true, inventory_required: true },
    { id: "4", name: "Manicure", description: "Professional nail care", price: 35, duration: 45, category: "Nails", is_active: true, inventory_required: true }
  ],
  
  staff: [
    { id: "1", first_name: "Alice", last_name: "Johnson", email: "alice@kora.com", phone: "+1555000001", role: "stylist", status: "active", hire_date: "2023-01-15", hourly_rate: 25 },
    { id: "2", first_name: "Bob", last_name: "Wilson", email: "bob@kora.com", phone: "+1555000002", role: "therapist", status: "active", hire_date: "2023-03-20", hourly_rate: 30 },
    { id: "3", first_name: "Carol", last_name: "Davis", email: "carol@kora.com", phone: "+1555000003", role: "esthetician", status: "active", hire_date: "2023-06-10", hourly_rate: 28 }
  ],

  // Migration 012: Loyalty System
  loyalty_programs: [
    { id: "1", name: "VIP Rewards", description: "Premium loyalty program", points_per_dollar: 2, min_spend_threshold: 100, is_active: true },
    { id: "2", name: "Standard Rewards", description: "Basic loyalty program", points_per_dollar: 1, min_spend_threshold: 50, is_active: true }
  ],
  
  loyalty_transactions: [
    { id: "1", client_id: "1", booking_id: "1", points_earned: 100, points_redeemed: 0, transaction_type: "earned", description: "Haircut service" },
    { id: "2", client_id: "2", booking_id: "2", points_earned: 160, points_redeemed: 0, transaction_type: "earned", description: "Massage service" }
  ],

  // Migration 013: Inventory Management
  inventory_items: [
    { id: "1", name: "Hair Shampoo", sku: "HS001", category: "Hair Care", current_stock: 25, min_stock_level: 5, unit_cost: 12.50, supplier: "Beauty Supply Co" },
    { id: "2", name: "Massage Oil", sku: "MO001", category: "Wellness", current_stock: 15, min_stock_level: 3, unit_cost: 18.00, supplier: "Wellness Products Inc" },
    { id: "3", name: "Facial Cleanser", sku: "FC001", category: "Skincare", current_stock: 20, min_stock_level: 4, unit_cost: 22.00, supplier: "Skincare Solutions" }
  ],
  
  inventory_transactions: [
    { id: "1", item_id: "1", transaction_type: "purchase", quantity: 50, unit_cost: 12.50, total_cost: 625, notes: "Monthly restock" },
    { id: "2", item_id: "2", transaction_type: "usage", quantity: -2, unit_cost: 18.00, total_cost: -36, notes: "Used for massage services" }
  ],

  // Migration 014: Clinical Records
  clinical_records: [
    { id: "1", client_id: "1", staff_id: "2", record_type: "assessment", title: "Initial Wellness Assessment", content: "Client reports lower back tension", is_confidential: true },
    { id: "2", client_id: "2", staff_id: "3", record_type: "treatment", title: "Facial Treatment Notes", content: "Sensitive skin, used gentle products", is_confidential: true }
  ],
  
  medical_history: [
    { id: "1", client_id: "1", condition: "Lower back pain", severity: "mild", medications: "Ibuprofen as needed", allergies: "None known", notes: "Chronic condition from desk work" },
    { id: "2", client_id: "2", condition: "Sensitive skin", severity: "moderate", medications: "None", allergies: "Fragrances", notes: "Requires hypoallergenic products" }
  ],

  // Migration 015: Emergency System
  emergency_contacts: [
    { id: "1", client_id: "1", name: "Sarah Doe", relationship: "spouse", phone: "+1234567899", email: "sarah@example.com", is_primary: true },
    { id: "2", client_id: "2", name: "Tom Smith", relationship: "brother", phone: "+1234567898", email: "tom@example.com", is_primary: true }
  ],
  
  incident_reports: [
    { id: "1", client_id: "1", staff_id: "2", incident_type: "minor_injury", severity: "low", description: "Client slipped slightly getting off massage table", action_taken: "Assisted client, checked for injuries", follow_up_required: false }
  ],

  // Migration 016: Laundry Management
  laundry_items: [
    { id: "1", item_type: "towel", size: "large", color: "white", status: "clean", last_washed: "2024-03-10", wash_count: 15 },
    { id: "2", item_type: "sheet", size: "standard", color: "blue", status: "dirty", last_washed: "2024-03-09", wash_count: 8 },
    { id: "3", item_type: "robe", size: "medium", color: "gray", status: "clean", last_washed: "2024-03-11", wash_count: 12 }
  ],
  
  laundry_cycles: [
    { id: "1", cycle_date: "2024-03-10", items_washed: 25, cycle_type: "hot_wash", detergent_used: "Eco-Clean", notes: "Regular weekly wash" },
    { id: "2", cycle_date: "2024-03-11", items_washed: 15, cycle_type: "sanitize", detergent_used: "Hospital Grade", notes: "Deep clean cycle" }
  ],

  // Migration 017: Finance System
  invoices: [
    { id: "1", client_id: "1", booking_id: "1", invoice_number: "INV-001", subtotal: 50, tax_amount: 4, total_amount: 54, status: "paid", due_date: "2024-03-15" },
    { id: "2", client_id: "2", booking_id: "2", invoice_number: "INV-002", subtotal: 80, tax_amount: 6.4, total_amount: 86.4, status: "pending", due_date: "2024-03-16" }
  ],
  
  payments: [
    { id: "1", invoice_id: "1", amount: 54, payment_method: "credit_card", payment_date: "2024-03-15", transaction_id: "txn_123456", status: "completed" },
    { id: "2", invoice_id: "2", amount: 86.4, payment_method: "cash", payment_date: "2024-03-16", transaction_id: "cash_001", status: "completed" }
  ],
  
  expense_categories: [
    { id: "1", name: "Supplies", description: "Business supplies and materials", is_active: true },
    { id: "2", name: "Marketing", description: "Advertising and promotional expenses", is_active: true },
    { id: "3", name: "Utilities", description: "Electricity, water, internet", is_active: true }
  ],
  
  expenses: [
    { id: "1", category_id: "1", amount: 250, description: "Monthly inventory restock", expense_date: "2024-03-01", receipt_url: null, is_recurring: true },
    { id: "2", category_id: "2", amount: 150, description: "Social media advertising", expense_date: "2024-03-05", receipt_url: null, is_recurring: false }
  ],

  // Migration 018: Unified Services
  service_packages: [
    { id: "1", name: "Spa Day Package", description: "Massage + Facial combo", services: ["2", "3"], total_price: 130, discount_amount: 15, is_active: true },
    { id: "2", name: "Beauty Bundle", description: "Haircut + Manicure combo", services: ["1", "4"], total_price: 75, discount_amount: 10, is_active: true }
  ],
  
  service_addons: [
    { id: "1", service_id: "1", name: "Hair Wash", price: 10, duration: 15, is_required: false },
    { id: "2", service_id: "2", name: "Hot Stone Add-on", price: 20, duration: 30, is_required: false },
    { id: "3", service_id: "3", name: "Eye Treatment", price: 15, duration: 20, is_required: false }
  ],

  // Migration 019: AI Marketplace
  ai_recommendations: [
    { id: "1", client_id: "1", service_id: "2", confidence_score: 0.85, reason: "Based on previous wellness bookings", status: "pending" },
    { id: "2", client_id: "2", service_id: "3", confidence_score: 0.92, reason: "Skincare history and preferences", status: "accepted" }
  ],
  
  demand_forecasts: [
    { id: "1", service_id: "1", forecast_date: "2024-03-20", predicted_demand: 8, confidence_level: 0.78, factors: "Historical data, seasonal trends" },
    { id: "2", service_id: "2", forecast_date: "2024-03-20", predicted_demand: 5, confidence_level: 0.82, factors: "Wellness trend analysis" }
  ],

  // Migration 020: Projects & Planning
  projects: [
    { id: "1", name: "Spa Renovation", description: "Renovate wellness area", status: "in_progress", start_date: "2024-03-01", end_date: "2024-04-15", budget: 15000, spent: 8500 },
    { id: "2", name: "Staff Training Program", description: "Advanced techniques training", status: "planning", start_date: "2024-04-01", end_date: "2024-04-30", budget: 5000, spent: 0 }
  ],
  
  project_tasks: [
    { id: "1", project_id: "1", title: "Order new massage tables", description: "Research and purchase 3 new tables", status: "completed", assigned_to: "2", due_date: "2024-03-10" },
    { id: "2", project_id: "1", title: "Install new lighting", description: "LED lighting installation", status: "in_progress", assigned_to: "1", due_date: "2024-03-25" }
  ],

  // Migration 021: GPS & Location
  staff_locations: [
    { id: "1", staff_id: "1", latitude: 40.7128, longitude: -74.0060, accuracy: 5, timestamp: "2024-03-15T10:30:00Z", location_type: "work" },
    { id: "2", staff_id: "2", latitude: 40.7589, longitude: -73.9851, accuracy: 8, timestamp: "2024-03-15T14:15:00Z", location_type: "client_visit" }
  ],
  
  geofences: [
    { id: "1", name: "Main Salon", center_lat: 40.7128, center_lng: -74.0060, radius: 50, is_active: true, fence_type: "work_area" },
    { id: "2", name: "Downtown Service Area", center_lat: 40.7589, center_lng: -73.9851, radius: 1000, is_active: true, fence_type: "service_zone" }
  ],

  // Migration 022: Campaigns & Social
  marketing_campaigns: [
    { id: "1", name: "Spring Wellness Promotion", description: "20% off wellness services", start_date: "2024-03-15", end_date: "2024-04-15", budget: 1000, status: "active", target_audience: "existing_clients" },
    { id: "2", name: "New Client Special", description: "First visit 50% off", start_date: "2024-03-01", end_date: "2024-03-31", budget: 2000, status: "active", target_audience: "new_clients" }
  ],
  
  social_posts: [
    { id: "1", campaign_id: "1", platform: "instagram", content: "Spring into wellness! 20% off all massage services this month. Book now!", scheduled_at: "2024-03-15T09:00:00Z", status: "published", engagement_score: 85 },
    { id: "2", campaign_id: "2", platform: "facebook", content: "New to our salon? Get 50% off your first visit! Limited time offer.", scheduled_at: "2024-03-01T12:00:00Z", status: "published", engagement_score: 92 }
  ],
  
  social_analytics: [
    { id: "1", post_id: "1", platform: "instagram", likes: 45, comments: 8, shares: 12, reach: 1250, impressions: 2100, engagement_rate: 0.052 },
    { id: "2", post_id: "2", platform: "facebook", likes: 67, comments: 15, shares: 23, reach: 1800, impressions: 3200, engagement_rate: 0.058 }
  ]
};

export async function queryDb<T = any>(query: string, params: any[] = []): Promise<T[]> {
  console.log("Mock DB Query:", query, params);
  
  // Extract table name from query
  const tableMatch = query.match(/FROM\s+(\w+)/i) || query.match(/INTO\s+(\w+)/i) || query.match(/UPDATE\s+(\w+)/i);
  const tableName = tableMatch?.[1];
  
  if (!tableName || !mockData[tableName]) {
    return [] as T[];
  }
  
  // Handle SELECT queries
  if (query.toUpperCase().includes("SELECT")) {
    return mockData[tableName] as T[];
  }
  
  // Handle INSERT queries
  if (query.toUpperCase().includes("INSERT")) {
    const newId = (mockData[tableName].length + 1).toString();
    const newRecord = { id: newId, ...params.reduce((acc, param, idx) => {
      acc[`field_${idx}`] = param;
      return acc;
    }, {}) };
    mockData[tableName].push(newRecord);
    return [{ id: newId }] as T[];
  }
  
  // Handle UPDATE queries
  if (query.toUpperCase().includes("UPDATE")) {
    return [] as T[];
  }
  
  return mockData[tableName] as T[];
}