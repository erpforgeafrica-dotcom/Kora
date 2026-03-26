import { TableSchema, ColumnSchema } from "./introspector.js";

function formatLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function getMockSchema(tableName: string): TableSchema {
  const schemas: Record<string, TableSchema> = {
    // Core entities
    clients: {
      name: "clients", label: "Clients", primaryKey: "id",
      columns: [
        { name: "first_name", type: "string", required: true, ui: { widget: "input", label: "First Name", placeholder: "Enter first name" } },
        { name: "last_name", type: "string", required: true, ui: { widget: "input", label: "Last Name", placeholder: "Enter last name" } },
        { name: "email", type: "string", required: true, ui: { widget: "input", label: "Email", placeholder: "Enter email address" } },
        { name: "phone", type: "string", required: false, ui: { widget: "input", label: "Phone", placeholder: "Enter phone number" } },
        { name: "membership_tier", type: "string", required: false, ui: { widget: "select", label: "Membership Tier", placeholder: "Select tier" } },
        { name: "address", type: "string", required: false, ui: { widget: "input", label: "Address", placeholder: "Enter address" } },
        { name: "city", type: "string", required: false, ui: { widget: "input", label: "City", placeholder: "Enter city" } },
        { name: "state", type: "string", required: false, ui: { widget: "input", label: "State", placeholder: "Enter state" } },
        { name: "zip_code", type: "string", required: false, ui: { widget: "input", label: "ZIP Code", placeholder: "Enter ZIP code" } },
        { name: "loyalty_points", type: "number", required: false, ui: { widget: "input", label: "Loyalty Points", placeholder: "Enter points" } }
      ]
    },
    
    bookings: {
      name: "bookings", label: "Bookings", primaryKey: "id",
      columns: [
        { name: "client_id", type: "string", required: true, ui: { widget: "input", label: "Client ID", placeholder: "Enter client ID" } },
        { name: "service_id", type: "string", required: true, ui: { widget: "input", label: "Service ID", placeholder: "Enter service ID" } },
        { name: "staff_id", type: "string", required: true, ui: { widget: "input", label: "Staff ID", placeholder: "Enter staff ID" } },
        { name: "booking_date", type: "date", required: true, ui: { widget: "date", label: "Booking Date", placeholder: "Select date" } },
        { name: "booking_time", type: "string", required: true, ui: { widget: "input", label: "Booking Time", placeholder: "Enter time" } },
        { name: "status", type: "string", required: true, ui: { widget: "select", label: "Status", placeholder: "Select status" } },
        { name: "duration", type: "number", required: false, ui: { widget: "input", label: "Duration (minutes)", placeholder: "Enter duration" } },
        { name: "notes", type: "string", required: false, ui: { widget: "textarea", label: "Notes", placeholder: "Enter notes" } },
        { name: "total_amount", type: "number", required: false, ui: { widget: "input", label: "Total Amount", placeholder: "Enter amount" } }
      ]
    },

    // Loyalty System (Migration 012)
    loyalty_programs: {
      name: "loyalty_programs", label: "Loyalty Programs", primaryKey: "id",
      columns: [
        { name: "name", type: "string", required: true, ui: { widget: "input", label: "Program Name", placeholder: "Enter program name" } },
        { name: "description", type: "string", required: false, ui: { widget: "textarea", label: "Description", placeholder: "Enter description" } },
        { name: "points_per_dollar", type: "number", required: true, ui: { widget: "input", label: "Points per Dollar", placeholder: "Enter points ratio" } },
        { name: "min_spend_threshold", type: "number", required: false, ui: { widget: "input", label: "Min Spend Threshold", placeholder: "Enter minimum spend" } },
        { name: "is_active", type: "boolean", required: false, ui: { widget: "checkbox", label: "Active", placeholder: "" } }
      ]
    },

    loyalty_transactions: {
      name: "loyalty_transactions", label: "Loyalty Transactions", primaryKey: "id",
      columns: [
        { name: "client_id", type: "string", required: true, ui: { widget: "input", label: "Client ID", placeholder: "Enter client ID" } },
        { name: "booking_id", type: "string", required: false, ui: { widget: "input", label: "Booking ID", placeholder: "Enter booking ID" } },
        { name: "points_earned", type: "number", required: false, ui: { widget: "input", label: "Points Earned", placeholder: "Enter points earned" } },
        { name: "points_redeemed", type: "number", required: false, ui: { widget: "input", label: "Points Redeemed", placeholder: "Enter points redeemed" } },
        { name: "transaction_type", type: "string", required: true, ui: { widget: "select", label: "Transaction Type", placeholder: "Select type" } },
        { name: "description", type: "string", required: false, ui: { widget: "textarea", label: "Description", placeholder: "Enter description" } }
      ]
    },

    // Inventory Management (Migration 013)
    inventory_items: {
      name: "inventory_items", label: "Inventory Items", primaryKey: "id",
      columns: [
        { name: "name", type: "string", required: true, ui: { widget: "input", label: "Item Name", placeholder: "Enter item name" } },
        { name: "sku", type: "string", required: true, ui: { widget: "input", label: "SKU", placeholder: "Enter SKU" } },
        { name: "category", type: "string", required: false, ui: { widget: "input", label: "Category", placeholder: "Enter category" } },
        { name: "current_stock", type: "number", required: true, ui: { widget: "input", label: "Current Stock", placeholder: "Enter current stock" } },
        { name: "min_stock_level", type: "number", required: false, ui: { widget: "input", label: "Min Stock Level", placeholder: "Enter minimum level" } },
        { name: "unit_cost", type: "number", required: false, ui: { widget: "input", label: "Unit Cost", placeholder: "Enter unit cost" } },
        { name: "supplier", type: "string", required: false, ui: { widget: "input", label: "Supplier", placeholder: "Enter supplier name" } }
      ]
    },

    // Clinical Records (Migration 014)
    clinical_records: {
      name: "clinical_records", label: "Clinical Records", primaryKey: "id",
      columns: [
        { name: "client_id", type: "string", required: true, ui: { widget: "input", label: "Client ID", placeholder: "Enter client ID" } },
        { name: "staff_id", type: "string", required: true, ui: { widget: "input", label: "Staff ID", placeholder: "Enter staff ID" } },
        { name: "record_type", type: "string", required: true, ui: { widget: "select", label: "Record Type", placeholder: "Select type" } },
        { name: "title", type: "string", required: true, ui: { widget: "input", label: "Title", placeholder: "Enter title" } },
        { name: "content", type: "string", required: true, ui: { widget: "textarea", label: "Content", placeholder: "Enter content" } },
        { name: "is_confidential", type: "boolean", required: false, ui: { widget: "checkbox", label: "Confidential", placeholder: "" } }
      ]
    },

    // Emergency System (Migration 015)
    emergency_contacts: {
      name: "emergency_contacts", label: "Emergency Contacts", primaryKey: "id",
      columns: [
        { name: "client_id", type: "string", required: true, ui: { widget: "input", label: "Client ID", placeholder: "Enter client ID" } },
        { name: "name", type: "string", required: true, ui: { widget: "input", label: "Contact Name", placeholder: "Enter contact name" } },
        { name: "relationship", type: "string", required: true, ui: { widget: "input", label: "Relationship", placeholder: "Enter relationship" } },
        { name: "phone", type: "string", required: true, ui: { widget: "input", label: "Phone", placeholder: "Enter phone number" } },
        { name: "email", type: "string", required: false, ui: { widget: "input", label: "Email", placeholder: "Enter email" } },
        { name: "is_primary", type: "boolean", required: false, ui: { widget: "checkbox", label: "Primary Contact", placeholder: "" } }
      ]
    },

    // Finance System (Migration 017)
    invoices: {
      name: "invoices", label: "Invoices", primaryKey: "id",
      columns: [
        { name: "client_id", type: "string", required: true, ui: { widget: "input", label: "Client ID", placeholder: "Enter client ID" } },
        { name: "booking_id", type: "string", required: false, ui: { widget: "input", label: "Booking ID", placeholder: "Enter booking ID" } },
        { name: "invoice_number", type: "string", required: true, ui: { widget: "input", label: "Invoice Number", placeholder: "Enter invoice number" } },
        { name: "subtotal", type: "number", required: true, ui: { widget: "input", label: "Subtotal", placeholder: "Enter subtotal" } },
        { name: "tax_amount", type: "number", required: false, ui: { widget: "input", label: "Tax Amount", placeholder: "Enter tax amount" } },
        { name: "total_amount", type: "number", required: true, ui: { widget: "input", label: "Total Amount", placeholder: "Enter total amount" } },
        { name: "status", type: "string", required: true, ui: { widget: "select", label: "Status", placeholder: "Select status" } },
        { name: "due_date", type: "date", required: true, ui: { widget: "date", label: "Due Date", placeholder: "Select due date" } }
      ]
    },

    // Marketing Campaigns (Migration 022)
    marketing_campaigns: {
      name: "marketing_campaigns", label: "Marketing Campaigns", primaryKey: "id",
      columns: [
        { name: "name", type: "string", required: true, ui: { widget: "input", label: "Campaign Name", placeholder: "Enter campaign name" } },
        { name: "description", type: "string", required: false, ui: { widget: "textarea", label: "Description", placeholder: "Enter description" } },
        { name: "start_date", type: "date", required: true, ui: { widget: "date", label: "Start Date", placeholder: "Select start date" } },
        { name: "end_date", type: "date", required: true, ui: { widget: "date", label: "End Date", placeholder: "Select end date" } },
        { name: "budget", type: "number", required: false, ui: { widget: "input", label: "Budget", placeholder: "Enter budget" } },
        { name: "status", type: "string", required: true, ui: { widget: "select", label: "Status", placeholder: "Select status" } },
        { name: "target_audience", type: "string", required: false, ui: { widget: "input", label: "Target Audience", placeholder: "Enter target audience" } }
      ]
    }
  };

  return schemas[tableName] || {
    name: tableName,
    label: formatLabel(tableName),
    primaryKey: "id",
    columns: []
  };
}