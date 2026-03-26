import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme, type ThemeId } from "@/contexts/ThemeContext";
import { useAppStore } from "@/stores/useAppStore";

type SettingsSectionId =
  | "overview"
  | "organization"
  | "users-roles"
  | "security"
  | "billing"
  | "notifications"
  | "workflow-rules"
  | "feature-flags"
  | "ai-settings"
  | "integrations"
  | "preferences"
  | "audit-governance";

interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  note: string;
}

const sections: SettingsSection[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Settings Domain",
    title: "Enterprise control center",
    description: "Configuration surfaces for organization controls, security posture, billing, workflows, AI policy, and governance.",
    note: "Use the overview cards to jump into a settings domain. Child pages keep permissions and auditability visible."
  },
  {
    id: "organization",
    label: "Organization",
    eyebrow: "Organization",
    title: "Organization",
    description: "Primary organization profile, tenant context, and workspace identity.",
    note: "Changes here affect how the current organization is represented across the workspace."
  },
  {
    id: "users-roles",
    label: "Users & Roles",
    eyebrow: "Access",
    title: "Users and roles",
    description: "Role boundaries, access ownership, and permission review.",
    note: "Access changes should be auditable and limited to administrators with authority for role governance."
  },
  {
    id: "security",
    label: "Security",
    eyebrow: "Security",
    title: "Security posture",
    description: "Session protections, MFA expectations, credential policy, and trusted access controls.",
    note: "Security updates should be reviewed for impact across all authenticated actors."
  },
  {
    id: "billing",
    label: "Billing & Subscription",
    eyebrow: "Billing",
    title: "Billing & Subscription",
    description: "Plan posture, invoice routing, and spend awareness for the current organization.",
    note: "Billing controls affect entitlements and must align with the platform subscription contract."
  },
  {
    id: "notifications",
    label: "Notifications",
    eyebrow: "Notifications",
    title: "Notification policy",
    description: "Delivery channels, escalation rules, and operator alert behavior.",
    note: "Use notification controls to tune signal quality without creating dead-end inbox noise."
  },
  {
    id: "workflow-rules",
    label: "Workflow Rules",
    eyebrow: "Workflow",
    title: "Workflow rules",
    description: "Automation thresholds, approvals, and operator intervention triggers.",
    note: "Workflow rules must match real backend processes rather than decorative UI toggles."
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    eyebrow: "Release Governance",
    title: "Feature flag governance",
    description: "Controlled rollout settings, visibility boundaries, and flag ownership.",
    note: "Feature rollout changes should have a clear owner and a rollback expectation."
  },
  {
    id: "ai-settings",
    label: "AI Settings",
    eyebrow: "AI",
    title: "AI settings",
    description: "Assistant behavior, automation guardrails, and human review policy.",
    note: "AI settings should stay embedded in workflow instead of behaving like a disconnected chatbot control panel."
  },
  {
    id: "integrations",
    label: "Integrations",
    eyebrow: "Integrations",
    title: "Integration controls",
    description: "External systems, API connectivity posture, and connected product boundaries.",
    note: "Integration states should make ownership and dependency risk clear."
  },
  {
    id: "preferences",
    label: "Preferences",
    eyebrow: "Preferences",
    title: "Preferences",
    description: "Workspace appearance, density, local operator preferences, and saved defaults.",
    note: "Preferences are user-facing, but they should still fit the enterprise shell consistently."
  },
  {
    id: "audit-governance",
    label: "Audit & Governance",
    eyebrow: "Governance",
    title: "Audit and governance",
    description: "Change visibility, policy ownership, and review checkpoints.",
    note: "Governance is where configuration becomes operational truth."
  }
];

function getActiveSection(search: string): SettingsSectionId {
  const section = new URLSearchParams(search).get("section") as SettingsSectionId | null;
  if (section && sections.some((item) => item.id === section)) {
    return section;
  }
  return "overview";
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, orgId } = useAuthContext();
  const { themeId, setTheme, themes } = useTheme();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Demo Organization");
  const [workspaceEmail, setWorkspaceEmail] = useState("ops@demo.kora");
  const [defaultRole, setDefaultRole] = useState("business_admin");
  const [requireMfa, setRequireMfa] = useState(true);
  const [assistantMode, setAssistantMode] = useState("guided");
  const [dailyBudget, setDailyBudget] = useState("250");

  const activeSectionId = useMemo(() => getActiveSection(location.search), [location.search]);
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  const handleSaveSettings = () => {
    setSaveMessage("Settings staged locally for the current workspace shell.");
    window.setTimeout(() => setSaveMessage(null), 2400);
  };

  const formPanel = (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>{activeSection.eyebrow}</div>
          <h2 style={panelTitleStyle}>{activeSection.title}</h2>
          <p style={panelDescriptionStyle}>{activeSection.description}</p>
        </div>
        <div style={permissionsCardStyle}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent)", fontFamily: "'DM Mono', monospace" }}>
            Permissions
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-text-primary)", fontWeight: 600 }}>
            {userRole?.replace("_", " ")}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>{activeSection.note}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <div style={fieldGroupStyle}>
          <div style={fieldHeaderStyle}>
            <div style={fieldTitleStyle}>Primary form section</div>
            <div style={fieldHelpStyle}>Clear labels, help text, and validation-aware controls.</div>
          </div>

          <div style={fieldGridStyle}>
            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Organization name</span>
              <span style={fieldHintStyle}>Displayed across the workspace shell and account surfaces.</span>
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} style={inputStyle} />
            </label>

            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Workspace email</span>
              <span style={fieldHintStyle}>Used for workflow delivery, alerts, and admin contact routing.</span>
              <input value={workspaceEmail} onChange={(event) => setWorkspaceEmail(event.target.value)} style={inputStyle} />
            </label>

            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Default role</span>
              <span style={fieldHintStyle}>Recommended default for newly invited internal users.</span>
              <select value={defaultRole} onChange={(event) => setDefaultRole(event.target.value)} style={inputStyle}>
                <option value="platform_admin">Platform admin</option>
                <option value="business_admin">Business admin</option>
                <option value="operations">Operations</option>
                <option value="staff">Staff</option>
              </select>
            </label>

            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Theme</span>
              <span style={fieldHintStyle}>Appearance preference for the current operator workspace.</span>
              <select value={themeId} onChange={(event) => setTheme(event.target.value as ThemeId)} style={inputStyle}>
                {themes.map((themeOption) => (
                  <option key={themeOption.id} value={themeOption.id}>
                    {themeOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <div style={fieldHeaderStyle}>
            <div style={fieldTitleStyle}>Policy switches</div>
            <div style={fieldHelpStyle}>Settings are grouped by operational impact, not visual convenience.</div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <ToggleRow
              title="Require multifactor authentication"
              description="Recommended for all administrators and privileged operators."
              checked={requireMfa}
              onChange={setRequireMfa}
            />
            <ToggleRow
              title="Enable support notifications"
              description="Push urgent queue events into the operator workflow."
              checked={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
            <ToggleRow
              title="Email notifications"
              description="Send email delivery for escalations and daily summaries."
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <ToggleRow
              title="Auto-save draft changes"
              description="Useful for configuration pages with long forms and rule builders."
              checked={autoSave}
              onChange={setAutoSave}
            />
            <ToggleRow
              title="Collapse sidebar by default"
              description="Applies to this workspace shell for the current user session."
              checked={sidebarCollapsed}
              onChange={setSidebarCollapsed}
            />
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <div style={fieldHeaderStyle}>
            <div style={fieldTitleStyle}>AI and review policy</div>
            <div style={fieldHelpStyle}>AI remains embedded in workflow and bounded by review controls.</div>
          </div>

          <div style={fieldGridStyle}>
            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Assistant mode</span>
              <span style={fieldHintStyle}>Choose how proactive KORA AI should be inside admin flows.</span>
              <select value={assistantMode} onChange={(event) => setAssistantMode(event.target.value)} style={inputStyle}>
                <option value="guided">Guided assistance</option>
                <option value="embedded">Embedded copilot</option>
                <option value="restricted">Restricted review mode</option>
              </select>
            </label>

            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Daily AI budget limit</span>
              <span style={fieldHintStyle}>Set a visible threshold for automated AI usage governance.</span>
              <input value={dailyBudget} onChange={(event) => setDailyBudget(event.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>
      </div>

      <div style={footerActionBarStyle}>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          Org ID: <span style={{ color: "var(--color-text-secondary)" }}>{orgId}</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={secondaryButtonStyle}>
            Reset
          </button>
          <button type="button" style={secondaryButtonStyle}>
            Cancel
          </button>
          <button type="button" style={primaryButtonStyle} onClick={handleSaveSettings}>
            Save changes
          </button>
        </div>
      </div>
      {saveMessage ? <div style={saveMessageStyle}>{saveMessage}</div> : null}
    </section>
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        style={{
          borderRadius: 28,
          border: "1px solid color-mix(in srgb, var(--color-border) 70%, var(--color-accent) 30%)",
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 14%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 98%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
          padding: 24,
          boxShadow: "var(--shadow-shell)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={eyebrowStyle}>Settings Domain</span>
              <span style={breadcrumbStyle}>Settings</span>
              <span style={breadcrumbStyle}>{activeSection.label}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, color: "var(--color-text-primary)" }}>Settings</h1>
            <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
              A serious enterprise control center, organized around configuration domains instead of one long generic
              settings page. Each child page keeps permissions, validation awareness, and audit posture visible.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={secondaryButtonStyle}>
              Export config
            </button>
            <button type="button" style={secondaryButtonStyle}>
              View audit trail
            </button>
            <button type="button" style={primaryButtonStyle} onClick={handleSaveSettings}>
              Save control set
            </button>
          </div>
        </div>
      </section>

      {activeSectionId === "overview" ? (
        <div style={{ display: "grid", gap: 20 }}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>Settings Overview</div>
                <h2 style={panelTitleStyle}>Domain map</h2>
                <p style={panelDescriptionStyle}>Each card opens a settings workspace with forms, policy switches, and audit-aware actions.</p>
              </div>
            </div>

            <div style={cardGridStyle}>
              {sections
                .filter((section) => section.id !== "overview")
                .map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => navigate(`/app/settings?section=${section.id}`)}
                    style={overviewCardStyle}
                  >
                    <div style={{ fontSize: 11, color: "var(--color-accent)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                      {section.eyebrow}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{section.label}</div>
                    <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: "var(--color-text-muted)" }}>{section.description}</div>
                    <div style={{ marginTop: 14, fontSize: 12, color: "var(--color-text-secondary)" }}>Open workspace</div>
                  </button>
                ))}
            </div>
          </section>

          {formPanel}
        </div>
      ) : (
        formPanel
      )}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "center",
        padding: "14px 16px",
        borderRadius: 18,
        border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
        background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)"
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 58,
          height: 32,
          borderRadius: 999,
          border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
          background: checked ? "var(--color-accent-dim)" : "color-mix(in srgb, var(--color-surface) 78%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: checked ? "flex-end" : "flex-start",
          padding: 4,
          cursor: "pointer"
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: checked ? "var(--color-accent)" : "var(--color-text-muted)",
            boxShadow: checked ? "var(--glow-accent)" : "none"
          }}
        />
      </button>
    </div>
  );
}

const panelStyle = {
  borderRadius: 24,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
  padding: 20,
  boxShadow: "var(--shadow-shell)"
} as const;

const panelHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20
} as const;

const panelTitleStyle = {
  margin: "8px 0 0",
  fontSize: 28,
  color: "var(--color-text-primary)"
} as const;

const panelDescriptionStyle = {
  margin: "10px 0 0",
  maxWidth: 720,
  fontSize: 14,
  lineHeight: 1.7,
  color: "var(--color-text-secondary)"
} as const;

const eyebrowStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "var(--color-accent-dim)",
  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
  color: "var(--color-accent)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace"
} as const;

const breadcrumbStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  color: "var(--color-text-muted)",
  fontSize: 11,
  fontFamily: "'DM Mono', monospace"
} as const;

const permissionsCardStyle = {
  maxWidth: 300,
  padding: "14px 16px",
  borderRadius: 18,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)"
} as const;

const fieldGroupStyle = {
  display: "grid",
  gap: 16,
  padding: 18,
  borderRadius: 22,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)"
} as const;

const fieldHeaderStyle = {
  display: "grid",
  gap: 6
} as const;

const fieldTitleStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: "var(--color-text-primary)"
} as const;

const fieldHelpStyle = {
  fontSize: 12,
  color: "var(--color-text-muted)"
} as const;

const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16
} as const;

const fieldLabelWrapStyle = {
  display: "grid",
  gap: 7
} as const;

const fieldLabelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-primary)"
} as const;

const fieldHintStyle = {
  fontSize: 12,
  lineHeight: 1.6,
  color: "var(--color-text-muted)"
} as const;

const inputStyle = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
  color: "var(--color-text-primary)"
} as const;

const primaryButtonStyle = {
  padding: "11px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-accent) 36%, transparent)",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-surface) 82%), color-mix(in srgb, var(--color-surface-2) 92%, transparent))",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  cursor: "pointer"
} as const;

const secondaryButtonStyle = {
  padding: "11px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
  color: "var(--color-text-secondary)",
  fontWeight: 600,
  cursor: "pointer"
} as const;

const footerActionBarStyle = {
  marginTop: 18,
  paddingTop: 18,
  borderTop: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center"
} as const;

const saveMessageStyle = {
  marginTop: 14,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
  background: "var(--color-accent-dim)",
  color: "var(--color-accent)"
} as const;

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14
} as const;

const overviewCardStyle = {
  borderRadius: 20,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
  padding: 18,
  textAlign: "left",
  cursor: "pointer"
} as const;
