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
  list?: {
    columns: string[];
    searchable?: string[];
    sortable?: string[];
  };
  actions?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}
