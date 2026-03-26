import { queryDb } from "../../db/index.js";

export interface ColumnSchema {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "enum" | "json" | "uuid";
  required: boolean;
  default?: any;
  maxLength?: number;
  ui: {
    widget: "input" | "textarea" | "select" | "date" | "datetime" | "checkbox" | "file" | "hidden";
    label: string;
    placeholder?: string;
    helpText?: string;
    hidden?: boolean;
    readonly?: boolean;
  };
}

export interface TableSchema {
  name: string;
  label: string;
  columns: ColumnSchema[];
  primaryKey: string;
}

const TYPE_MAP: Record<string, ColumnSchema["type"]> = {
  "character varying": "string",
  "varchar": "string",
  "text": "string",
  "integer": "number",
  "bigint": "number",
  "numeric": "number",
  "boolean": "boolean",
  "timestamp": "date",
  "date": "date",
  "uuid": "uuid",
  "jsonb": "json",
  "json": "json"
};

const WIDGET_MAP: Record<ColumnSchema["type"], ColumnSchema["ui"]["widget"]> = {
  "string": "input",
  "number": "input",
  "boolean": "checkbox",
  "date": "datetime",
  "enum": "select",
  "json": "textarea",
  "uuid": "hidden"
};

export async function introspectTable(tableName: string): Promise<TableSchema> {
  // In demo mode, return mock schema based on table name
  if (process.env.DEMO_MODE === "true") {
    return getMockSchema(tableName);
  }

  const columns = await queryDb<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
  }>(`
    SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  const skipColumns = ["id", "org_id", "created_at", "updated_at", "deleted_at"];

  return {
    name: tableName,
    label: formatLabel(tableName),
    primaryKey: "id",
    columns: columns
      .filter(col => !skipColumns.includes(col.column_name))
      .map(col => {
        const type = TYPE_MAP[col.data_type] || "string";
        const widget = col.column_name.includes("_at") ? "datetime" : 
                      col.data_type === "text" ? "textarea" :
                      WIDGET_MAP[type];

        return {
          name: col.column_name,
          type,
          required: col.is_nullable === "NO" && !col.column_default,
          default: col.column_default,
          maxLength: col.character_maximum_length || undefined,
          ui: {
            widget,
            label: formatLabel(col.column_name),
            placeholder: `Enter ${formatLabel(col.column_name).toLowerCase()}`,
            hidden: col.column_name.endsWith("_id") && col.column_name !== "client_id" && col.column_name !== "staff_id"
          }
        };
      })
  };
}

function getMockSchema(tableName: string): TableSchema {
  const schemas: Record<string, TableSchema> = {
    clients: {
      name: "clients",
      label: "Clients",
      primaryKey: "id",
      columns: [
        { name: "first_name", type: "string", required: true, ui: { widget: "input", label: "First Name", placeholder: "Enter first name" } },
        { name: "last_name", type: "string", required: true, ui: { widget: "input", label: "Last Name", placeholder: "Enter last name" } },
        { name: "email", type: "string", required: true, ui: { widget: "input", label: "Email", placeholder: "Enter email address" } },
        { name: "phone", type: "string", required: false, ui: { widget: "input", label: "Phone", placeholder: "Enter phone number" } },
        { name: "membership_tier", type: "string", required: false, ui: { widget: "select", label: "Membership Tier", placeholder: "Select tier" } },
        { name: "address", type: "string", required: false, ui: { widget: "input", label: "Address", placeholder: "Enter address" } },
        { name: "city", type: "string", required: false, ui: { widget: "input", label: "City", placeholder: "Enter city" } },
        { name: "state", type: "string", required: false, ui: { widget: "input", label: "State", placeholder: "Enter state" } },
        { name: "zip_code", type: "string", required: false, ui: { widget: "input", label: "ZIP Code", placeholder: "Enter ZIP code" } }
      ]
    },
    bookings: {
      name: "bookings",
      label: "Bookings",
      primaryKey: "id",
      columns: [
        { name: "client_id", type: "string", required: true, ui: { widget: "input", label: "Client ID", placeholder: "Enter client ID" } },
        { name: "service_id", type: "string", required: true, ui: { widget: "input", label: "Service ID", placeholder: "Enter service ID" } },
        { name: "staff_id", type: "string", required: true, ui: { widget: "input", label: "Staff ID", placeholder: "Enter staff ID" } },
        { name: "booking_date", type: "date", required: true, ui: { widget: "date", label: "Booking Date", placeholder: "Select date" } },
        { name: "booking_time", type: "string", required: true, ui: { widget: "input", label: "Booking Time", placeholder: "Enter time" } },
        { name: "status", type: "string", required: true, ui: { widget: "select", label: "Status", placeholder: "Select status" } },
        { name: "duration", type: "number", required: false, ui: { widget: "input", label: "Duration (minutes)", placeholder: "Enter duration" } },
        { name: "notes", type: "string", required: false, ui: { widget: "textarea", label: "Notes", placeholder: "Enter notes" } }
      ]
    },
    services: {
      name: "services",
      label: "Services",
      primaryKey: "id",
      columns: [
        { name: "name", type: "string", required: true, ui: { widget: "input", label: "Service Name", placeholder: "Enter service name" } },
        { name: "description", type: "string", required: false, ui: { widget: "textarea", label: "Description", placeholder: "Enter description" } },
        { name: "price", type: "number", required: true, ui: { widget: "input", label: "Price ($)", placeholder: "Enter price" } },
        { name: "duration", type: "number", required: true, ui: { widget: "input", label: "Duration (minutes)", placeholder: "Enter duration" } },
        { name: "category", type: "string", required: false, ui: { widget: "input", label: "Category", placeholder: "Enter category" } },
        { name: "is_active", type: "boolean", required: false, ui: { widget: "checkbox", label: "Active", placeholder: "" } }
      ]
    },
    staff: {
      name: "staff",
      label: "Staff",
      primaryKey: "id",
      columns: [
        { name: "first_name", type: "string", required: true, ui: { widget: "input", label: "First Name", placeholder: "Enter first name" } },
        { name: "last_name", type: "string", required: true, ui: { widget: "input", label: "Last Name", placeholder: "Enter last name" } },
        { name: "email", type: "string", required: true, ui: { widget: "input", label: "Email", placeholder: "Enter email address" } },
        { name: "phone", type: "string", required: false, ui: { widget: "input", label: "Phone", placeholder: "Enter phone number" } },
        { name: "role", type: "string", required: true, ui: { widget: "input", label: "Role", placeholder: "Enter role" } },
        { name: "status", type: "string", required: true, ui: { widget: "select", label: "Status", placeholder: "Select status" } },
        { name: "hire_date", type: "date", required: false, ui: { widget: "date", label: "Hire Date", placeholder: "Select hire date" } }
      ]
    },
    service_categories: {
      name: "service_categories",
      label: "Service Categories",
      primaryKey: "id",
      columns: [
        { name: "name", type: "string", required: true, ui: { widget: "input", label: "Category Name", placeholder: "Enter category name" } },
        { name: "description", type: "string", required: false, ui: { widget: "textarea", label: "Description", placeholder: "Enter description" } },
        { name: "slug", type: "string", required: true, ui: { widget: "input", label: "Slug", placeholder: "Enter URL slug" } },
        { name: "is_active", type: "boolean", required: false, ui: { widget: "checkbox", label: "Active", placeholder: "" } }
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

function formatLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}
