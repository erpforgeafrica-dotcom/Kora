import { ActionButton, AudienceSection } from "../../components/audience/AudiencePrimitives";

export function ForbiddenPage() {
  return (
    <div style={{ padding: 24 }}>
      <AudienceSection title="Access Restricted" meta="Role-based guard">
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
            This dashboard is not available to your current role.
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-muted)", maxWidth: 560 }}>
            Use the sidebar to return to the workspace assigned to your role.
          </div>
          <div>
            <ActionButton onClick={() => window.history.back()}>Go Back</ActionButton>
          </div>
        </div>
      </AudienceSection>
    </div>
  );
}
