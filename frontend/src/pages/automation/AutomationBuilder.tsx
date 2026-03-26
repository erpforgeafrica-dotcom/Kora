import { useEffect, useMemo, useState } from "react";
import {
  createAutomationWorkflow,
  getAutomationAnalyticsSummary,
  getAutomationSuggestions,
  getAutomationTemplates,
  getAutomationWorkflows,
  testAutomationWorkflow,
  type AutomationTemplateRecord,
  type AutomationWorkflowRecord
} from "../../services/api";

export default function AutomationBuilder() {
  const [templates, setTemplates] = useState<AutomationTemplateRecord[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflowRecord[]>([]);
  const [analytics, setAnalytics] = useState<{ total_workflows: number; active_workflows: number; total_runs: number; average_latency_ms: number; templates_available: number } | null>(null);
  const [prompt, setPrompt] = useState("Recover no-shows and request reviews after service completion.");
  const [suggestions, setSuggestions] = useState<Array<{ title: string; trigger_key: string; rationale: string; recommended_actions: string[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [templateRes, workflowRes, analyticsRes] = await Promise.all([
        getAutomationTemplates(),
        getAutomationWorkflows(),
        getAutomationAnalyticsSummary()
      ]);
      setTemplates(templateRes.templates);
      setWorkflows(workflowRes.workflows);
      setAnalytics(analyticsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automation builder");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeTemplates = useMemo(() => templates.slice(0, 4), [templates]);

  async function handleSuggest() {
    try {
      const result = await getAutomationSuggestions(prompt);
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
    }
  }

  async function handleCreateFromTemplate(template: AutomationTemplateRecord) {
    await createAutomationWorkflow({
      name: template.name,
      trigger_key: template.trigger_key,
      action_json: template.actions.map((action) => ({ type: action.type, label: action.label })),
      test_mode: testMode
    });
    await load();
  }

  async function handleTest(workflowId: string) {
    await testAutomationWorkflow(workflowId, { booking_status: "completed", sentiment: "negative" });
    await load();
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          ["Workflows", analytics?.total_workflows ?? 0],
          ["Active", analytics?.active_workflows ?? 0],
          ["Runs", analytics?.total_runs ?? 0],
          ["Avg latency", `${Math.round(analytics?.average_latency_ms ?? 0)} ms`]
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, color: "var(--color-text-primary)" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, color: "var(--color-text-primary)" }}>Automation Templates</h2>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: 13 }}>
              <input type="checkbox" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} />
              Test mode
            </label>
          </div>
          {loading ? <div style={{ color: "var(--color-text-muted)" }}>Loading templates…</div> : null}
          {error ? <div style={{ color: "var(--color-danger)" }}>{error}</div> : null}
          <div style={{ display: "grid", gap: 12 }}>
            {activeTemplates.map((template) => (
              <div key={template.key} style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 16, color: "var(--color-text-primary)", marginBottom: 6 }}>{template.name}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 10 }}>{template.description}</div>
                <button onClick={() => void handleCreateFromTemplate(template)} style={{ background: "var(--color-accent)", border: "none", color: "#041114", padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
                  Add workflow
                </button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 20 }}>
          <h2 style={{ marginTop: 0, color: "var(--color-text-primary)" }}>AI Suggestions</h2>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} style={{ width: "100%", background: "var(--color-background)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 12, resize: "vertical" }} />
          <button onClick={() => void handleSuggest()} style={{ marginTop: 12, background: "var(--color-accent-secondary)", border: "none", color: "#120b02", padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
            Generate suggestions
          </button>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {suggestions.map((suggestion) => (
              <div key={suggestion.title} style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 14 }}>
                <div style={{ color: "var(--color-text-primary)", marginBottom: 4 }}>{suggestion.title}</div>
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{suggestion.rationale}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 20 }}>
        <h2 style={{ marginTop: 0, color: "var(--color-text-primary)" }}>Workflow Runs</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {workflows.map((workflow) => (
            <div key={workflow.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid var(--color-border)", borderRadius: 14, padding: 14 }}>
              <div>
                <div style={{ color: "var(--color-text-primary)" }}>{workflow.name}</div>
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{workflow.trigger_key} · next run {workflow.next_run_at ?? "manual"}</div>
              </div>
              <button onClick={() => void handleTest(workflow.id)} style={{ background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}>
                Test
              </button>
            </div>
          ))}
          {!loading && workflows.length === 0 ? <div style={{ color: "var(--color-text-muted)" }}>No workflows yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
