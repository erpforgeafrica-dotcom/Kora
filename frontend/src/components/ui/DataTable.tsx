// src/components/ui/DataTable.tsx
import React, { useMemo, useState, type ReactNode } from "react";
import { Button } from "./button";

export type ColumnDef<T> = {
  key?: string;
  accessorKey?: string;
  id?: string;
  header: string;
  cell?: (row: T) => ReactNode;
};

export type TableRowAction<T> = {
  label: string;
  onClick: (row: T) => void;
  variant?: "primary" | "ghost" | "outline";
};

export type BulkAction = {
  label: string;
  onClick: () => void;
  variant?: "ghost" | "outline" | "primary";
};

export type TableField = {
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "email" | "datetime";
  default?: string | number;
  placeholder?: string;
};

export interface DataTableProps<T = unknown> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  onCreate?: (...args: any[]) => void;
  onUpdate?: (...args: any[]) => void;
  onDelete?: (...args: any[]) => void;
  customActions?: TableRowAction<T>[];
  bulkActions?: BulkAction[];
  entityName?: string;
  fields?: TableField[];
  pageSize?: number;
  searchable?: boolean;
  filterable?: boolean;
}

function buildInitialValues(fields: TableField[]) {
  return fields.reduce<Record<string, string>>((accumulator, field) => {
    const value = field.default;
    accumulator[field.name] = value === undefined || value === null ? "" : String(value);
    return accumulator;
  }, {});
}

function parseFieldValue(field: TableField, value: string) {
  if (value === "") {
    return undefined;
  }

  if (field.type === "number") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return value;
}

export default function DataTable<T = unknown>({
  columns,
  data,
  loading,
  error,
  onRowClick,
  onCreate,
  onDelete,
  customActions,
  bulkActions,
  entityName,
  fields = [],
  searchable = false,
}: DataTableProps<T>) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>(() => buildInitialValues(fields));

  const rowActions = useMemo(() => {
    const actions = customActions ? [...customActions] : [];
    if (onDelete) {
      actions.push({
        label: "Delete",
        variant: "outline",
        onClick: (row: T) => {
          const rowId = (row as { id?: string }).id;
          if (rowId) {
            void onDelete(rowId);
          }
        },
      });
    }
    return actions;
  }, [customActions, onDelete]);

  const hasRowActions = rowActions.length > 0;
  const totalColumns = columns.length + (hasRowActions ? 1 : 0);
  const filteredData = !searchable || !query.trim()
    ? data
    : data.filter((row) =>
        Object.values(row as Record<string, unknown>).some((value) =>
          typeof value === "string" || typeof value === "number"
            ? String(value).toLowerCase().includes(query.trim().toLowerCase())
            : false
        )
      );

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onCreate) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = fields.reduce<Record<string, unknown>>((accumulator, field) => {
        const parsedValue = parseFieldValue(field, formValues[field.name] ?? "");
        if (parsedValue !== undefined) {
          accumulator[field.name] = parsedValue;
        }
        return accumulator;
      }, {});

      await onCreate(payload);
      setFormValues(buildInitialValues(fields));
      setShowCreateForm(false);
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : `Failed to create ${entityName ?? "record"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {(bulkActions && bulkActions.length > 0) || searchable || (onCreate && fields.length > 0) ? (
        <div className="flex flex-col gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={entityName ? `Search ${entityName.toLowerCase()}s` : "Search table"}
                className="min-w-[220px] flex-1 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
              />
            )}
            {onCreate && fields.length > 0 && (
              <Button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setShowCreateForm((previous) => !previous);
                }}
              >
                {showCreateForm ? "Close Form" : `New ${entityName ?? "Record"}`}
              </Button>
            )}
          </div>
          {bulkActions && bulkActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bulkActions.map((action) => (
                <Button key={action.label} variant={action.variant ?? "outline"} onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showCreateForm && onCreate && fields.length > 0 && (
        <form onSubmit={handleCreateSubmit} className="grid gap-3 border-b border-slate-700 bg-slate-900/30 px-4 py-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm text-slate-200">
              <span className="font-medium">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <input
                type={field.type === "datetime" ? "datetime-local" : field.type ?? "text"}
                required={field.required}
                value={formValues[field.name] ?? ""}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    [field.name]: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-teal-400"
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : `Create ${entityName ?? "Record"}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
          </div>
          {formError && (
            <div className="text-sm text-red-400 md:col-span-2">
              {formError}
            </div>
          )}
        </form>
      )}

      {error && (
        <div className="px-4 py-2 text-sm text-red-400 border-b border-slate-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700 bg-slate-700">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-gray-300">
                  {col.header}
                </th>
              ))}
              {hasRowActions && (
                <th className="px-4 py-3 text-right font-semibold text-gray-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && filteredData.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="px-4 py-6 text-center text-gray-400">
                  {query.trim() ? "No matching data" : "No data"}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowI) => (
                <tr
                  key={rowI}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-700 hover:bg-slate-700/50 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col, colI) => {
                    const fieldKey = col.accessorKey ?? col.key ?? col.id;
                    const cellKey = fieldKey ?? `${col.header}-${colI}`;
                    const rawValue = fieldKey ? (row as Record<string, unknown>)[fieldKey] : "";
                    const displayValue = rawValue ?? "";
                    return (
                      <td key={cellKey} className="px-4 py-3 text-gray-300">
                        {col.cell ? col.cell(row) : String(displayValue)}
                      </td>
                    );
                  })}
                  {hasRowActions && (
                    <td className="px-4 py-3 space-x-2">
                      {rowActions.map((action) => (
                        <Button
                          key={action.label}
                          type="button"
                          variant={action.variant ?? "ghost"}
                          onClick={(event) => {
                            event.stopPropagation();
                            action.onClick(row);
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
