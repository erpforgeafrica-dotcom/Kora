import { useState } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "range";
  options?: FilterOption[];
}

interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, values, onChange, onReset }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.values(values).some(v => v !== "" && v !== null && v !== undefined);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 text-sm rounded border ${
          hasActiveFilters 
            ? "bg-teal-500 text-white border-teal-500" 
            : "bg-slate-700 text-gray-300 border-slate-600"
        } hover:opacity-90`}
      >
        🔍 Filters {hasActiveFilters && `(${Object.values(values).filter(v => v).length})`}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    onReset();
                    setIsOpen(false);
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300"
                >
                  Reset All
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-xs text-gray-400 mb-1">{filter.label}</label>
                  {filter.type === "select" && (
                    <select
                      value={values[filter.key] || ""}
                      onChange={(e) => onChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded border border-slate-600"
                    >
                      <option value="">All</option>
                      {filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {filter.type === "date" && (
                    <input
                      type="date"
                      value={values[filter.key] || ""}
                      onChange={(e) => onChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded border border-slate-600"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 px-3 py-2 text-sm bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Apply Filters
            </button>
          </div>
        </>
      )}
    </div>
  );
}
