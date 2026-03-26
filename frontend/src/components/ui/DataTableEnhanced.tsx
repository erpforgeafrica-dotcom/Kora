import React, { useState } from "react";

interface Column {
  accessorKey?: string;
  header: string;
  id?: string;
  cell?: (props: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  pageSize?: number;
  showPagination?: boolean;
}

export default function DataTable({ 
  columns, 
  data, 
  onRowClick,
  pageSize = 25,
  showPagination = true
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (column: Column) => {
    if (!column.sortable) return;
    
    const key = column.accessorKey || column.id;
    if (!key) return;

    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = showPagination ? sortedData.slice(startIndex, endIndex) : sortedData;

  return (
    <div>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead
            style={{
              background: "var(--color-surface-2)",
              borderBottom: "1px solid var(--color-border)"
            }}
          >
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(col)}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {col.header}
                    {col.sortable && sortColumn === (col.accessorKey || col.id) && (
                      <span style={{ fontSize: 10 }}>
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: 14
                  }}
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowI) => (
                <tr
                  key={rowI}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background 100ms ease"
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      e.currentTarget.style.background = "var(--color-surface-2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {columns.map((col, colI) => (
                    <td
                      key={colI}
                      style={{
                        padding: "12px 16px",
                        color: "var(--color-text-primary)",
                        fontFamily: "'DM Mono', monospace"
                      }}
                    >
                      {col.cell ? (
                        col.cell({ row: { original: row } })
                      ) : col.accessorKey ? (
                        row[col.accessorKey]
                      ) : (
                        ""
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            padding: "0 4px"
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", fontFamily: "'DM Mono', monospace" }}>
            Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length}
          </div>
          
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--color-border)",
                background: currentPage === 1 ? "var(--color-surface-2)" : "var(--color-surface)",
                color: currentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                transition: "all 140ms ease"
              }}
            >
              Previous
            </button>
            
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: currentPage === pageNum ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                      background: currentPage === pageNum ? "var(--color-accent-dim)" : "var(--color-surface)",
                      color: currentPage === pageNum ? "var(--color-accent)" : "var(--color-text-primary)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "'DM Mono', monospace",
                      minWidth: 36,
                      transition: "all 140ms ease"
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--color-border)",
                background: currentPage === totalPages ? "var(--color-surface-2)" : "var(--color-surface)",
                color: currentPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                transition: "all 140ms ease"
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
