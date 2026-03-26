import { useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import type { DashboardRole } from "../../auth/dashboardAccess";
import { findPlatformLeaf, getPlatformLeafPath } from "../../data/platformNavigation";
import { NotFoundPage } from "../NotFoundPage";

type GeneratedModulePageProps = {
  role: DashboardRole;
};

const MODULE_COLUMNS = ["Name", "Status", "Owner", "Updated", "Actions"];
const STATUS_OPTIONS = ["All", "Active", "Pending", "Needs Review", "Archived"];

export function GeneratedModulePage({ role }: GeneratedModulePageProps) {
  const { sectionKey = "", pageKey = "" } = useParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRow, setSelectedRow] = useState(0);
  const [mode, setMode] = useState<"list" | "detail" | "edit" | "analytics">("list");
  const { schema, section, leaf } = findPlatformLeaf(role, sectionKey, pageKey);

  const rows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        id: `${pageKey}-${index + 1}`,
        name: `${leaf?.label ?? "Module"} ${index + 1}`,
        status: ["Active", "Pending", "Needs Review"][index % 3],
        owner: schema.label,
        updated: `${index + 1}h ago`
      })),
    [leaf?.label, pageKey, schema.label]
  );

  if (!section || !leaf) {
    return <NotFoundPage />;
  }

  const selected = rows[selectedRow] ?? rows[0];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8
            }}
          >
            <Link to={schema.route} style={{ color: "var(--color-accent)", textDecoration: "none" }}>
              {schema.label}
            </Link>
            {" / "}
            {section.label}
            {" / "}
            {leaf.label}
          </div>
          <h1 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 30 }}>{leaf.label}</h1>
          <p style={{ margin: "10px 0 0", color: "var(--color-text-muted)", maxWidth: 780, lineHeight: 1.7 }}>
            Generated workspace scaffold for {leaf.label.toLowerCase()}. This view is wired from the canonical KÓRA navigation
            schema and includes list, create, detail, edit, and analytics surfaces without breaking the live API layer.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <button onClick={() => setMode("analytics")} type="button" style={secondaryButtonStyle}>
            Analytics
          </button>
          <button onClick={() => setShowCreate((value) => !value)} type="button" style={primaryButtonStyle}>
            {showCreate ? "Close Create" : "Create"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(320px, 0.9fr)", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1 }}>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${leaf.label.toLowerCase()}...`}
                  style={inputStyle}
                />
                <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["List", "Detail", "Edit", "Analytics"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option.toLowerCase() as "list" | "detail" | "edit" | "analytics")}
                    style={option.toLowerCase() === mode ? primaryButtonStyle : secondaryButtonStyle}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
              {[
                { label: "Records", value: rows.length.toString(), accent: "var(--color-accent)" },
                { label: "Live API", value: "Ready", accent: "var(--color-success)" },
                { label: "States", value: "Loading / Error", accent: "var(--color-warning)" },
                { label: "Mode", value: mode.toUpperCase(), accent: "var(--color-text-secondary)" }
              ].map((item) => (
                <div key={item.label} style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 22, color: item.accent, fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={tableWrapperStyle}>
              <div style={tableHeaderStyle}>
                {MODULE_COLUMNS.map((column) => (
                  <div key={column}>{column}</div>
                ))}
              </div>
              {rows
                .filter((row) => row.name.toLowerCase().includes(query.toLowerCase()))
                .filter((row) => status === "All" || row.status === status)
                .map((row, index) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedRow(index);
                      setMode("detail");
                    }}
                    style={{
                      ...tableRowStyle,
                      background: selected.id === row.id ? "var(--color-accent-dim)" : "transparent"
                    }}
                  >
                    <span>{row.name}</span>
                    <span>{row.status}</span>
                    <span>{row.owner}</span>
                    <span>{row.updated}</span>
                    <span style={{ color: "var(--color-accent)" }}>Open</span>
                  </button>
                ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                API scaffolds: `GET /api/{section.key}/{leaf.key}` · `POST /api/{section.key}/{leaf.key}`
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={secondaryButtonStyle}>
                  Previous
                </button>
                <button type="button" style={secondaryButtonStyle}>
                  Next
                </button>
              </div>
            </div>
          </div>

          {showCreate ? (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>Create {leaf.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                {["Name", "Status", "Owner", "Notes"].map((field) => (
                  <label key={field} style={fieldStyle}>
                    <span>{field}</span>
                    {field === "Notes" ? <textarea style={{ ...inputStyle, minHeight: 110 }} /> : <input style={inputStyle} />}
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                  Loading, validation, and error states are scaffolded here for the eventual backend form contract.
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="button" style={primaryButtonStyle}>
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>{mode === "analytics" ? `${leaf.label} Analytics` : `${leaf.label} Detail`}</div>
            {mode === "analytics" ? (
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  `Conversion for ${leaf.label.toLowerCase()}`,
                  "Throughput trend",
                  "Operational anomaly watch"
                ].map((label, index) => (
                  <div key={label} style={metricCardStyle}>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 88 }}>
                      {Array.from({ length: 10 }, (_, barIndex) => (
                        <div
                          key={`${label}-${barIndex}`}
                          style={{
                            flex: 1,
                            borderRadius: 8,
                            background: index === 0 ? "var(--color-accent)" : index === 1 ? "var(--color-warning)" : "var(--color-secondary)",
                            opacity: 0.2 + ((barIndex + 2) % 5) * 0.15,
                            height: `${28 + ((barIndex * 17) % 54)}px`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <DetailRow label="Record" value={selected.name} />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow label="Workspace" value={schema.label} />
                <DetailRow label="API Route" value={`/api/${section.key}/${leaf.key}`} mono />
                <DetailRow label="UI Route" value={getPlatformLeafPath(schema, section, leaf)} mono />
                <label style={fieldStyle}>
                  <span>Edit Summary</span>
                  <textarea
                    defaultValue={`${leaf.label} detail state is scaffolded here so create, read, update, and analytics can be developed behind the same route contract.`}
                    style={{ ...inputStyle, minHeight: 140 }}
                  />
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => setMode("edit")}>
                    Edit
                  </button>
                  <button type="button" style={primaryButtonStyle}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>States</div>
            <div style={{ display: "grid", gap: 10 }}>
              <StateCard title="Loading skeleton" text={`Use this module while ${leaf.label.toLowerCase()} data is loading.`} />
              <StateCard title="Empty state" text={`No ${leaf.label.toLowerCase()} records found. Create your first entry from this workspace.`} />
              <StateCard title="Error boundary" text="Backend unavailable. Keep the UI calm, preserve filters, and allow retry without losing context." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
      <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{label}</div>
      <div style={{ color: "var(--color-text-primary)", fontSize: 13, fontFamily: mono ? "'DM Mono', monospace" : "inherit" }}>{value}</div>
    </div>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        borderRadius: 14,
        padding: 14
      }}
    >
      <div style={{ color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: 12, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

const panelStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 20,
  padding: 20
} satisfies CSSProperties;

const panelHeaderStyle = {
  color: "var(--color-text-primary)",
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 14
} satisfies CSSProperties;

const metricCardStyle = {
  borderRadius: 16,
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  padding: 14
} satisfies CSSProperties;

const tableWrapperStyle = {
  border: "1px solid var(--color-border)",
  borderRadius: 16,
  overflow: "hidden"
} satisfies CSSProperties;

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 1fr 1fr 0.7fr",
  gap: 12,
  padding: "12px 16px",
  background: "var(--color-surface-2)",
  color: "var(--color-text-muted)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontFamily: "'DM Mono', monospace"
} satisfies CSSProperties;

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 1fr 1fr 0.7fr",
  gap: 12,
  width: "100%",
  padding: "14px 16px",
  border: "none",
  borderTop: "1px solid var(--color-border)",
  textAlign: "left",
  color: "var(--color-text-secondary)",
  cursor: "pointer"
} satisfies CSSProperties;

const inputStyle = {
  width: "100%",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 13
} satisfies CSSProperties;

const fieldStyle = {
  display: "grid",
  gap: 8,
  color: "var(--color-text-secondary)",
  fontSize: 12
} satisfies CSSProperties;

const primaryButtonStyle = {
  border: "1px solid var(--color-accent-strong)",
  background: "var(--color-accent-dim)",
  color: "var(--color-accent)",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600
} satisfies React.CSSProperties;

const secondaryButtonStyle = {
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text-secondary)",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600
} satisfies React.CSSProperties;
