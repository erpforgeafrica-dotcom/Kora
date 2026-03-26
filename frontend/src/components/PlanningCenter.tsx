import { useEffect, useMemo, useState } from "react";
import { PHASES, INNOVATION_MOMENTS, MASTER_PROMPT } from "../data/koraGapClosure";
import {
  PlanningActionButton,
  PlanningHeader,
  PlanningPageShell,
  PlanningSectionCard,
  PlanningTabButton
} from "./planning/PlanningPrimitives";

export default function PlanningCenter() {
  const [activePhase, setActivePhase] = useState("phase5");
  const [tab, setTab] = useState("phases");
  const [copied, setCopied] = useState(false);
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 960 : false
  );

  const phase = PHASES.find(p => p.id === activePhase);
  const promptLines = useMemo(() => MASTER_PROMPT.split("\n"), []);

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 960);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(MASTER_PROMPT);
      } else {
        const ta = document.createElement("textarea");
        ta.value = MASTER_PROMPT;
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PlanningPageShell>
      {/* ── Header ── */}
      <PlanningHeader compact={isCompact}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--color-accent)",
              boxShadow: "var(--glow-accent)",
              animation: "pulse 2s infinite"
            }}
          />
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--color-accent)", fontWeight: 700 }}>
              KÓRA · GAP CLOSURE MASTER BRIEF
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
              Phases 5–10 · 47 features · 32 weeks · ServiceTitan + Epic parity + beyond
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["phases", "moments", "prompt"].map(t => (
            <PlanningTabButton key={t} onClick={() => setTab(t)} active={tab === t}>
              {t}
            </PlanningTabButton>
          ))}
          <PlanningActionButton onClick={copy} active={copied}>
            {copied ? "✓ COPIED" : "COPY PROMPT"}
          </PlanningActionButton>
        </div>
      </PlanningHeader>

      {/* ── Phases tab ── */}
      {tab === "phases" && (
        <div style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: isCompact ? "column" : "row", overflow: "hidden" }}>
          {/* Phase list */}
          <div
            style={{
              width: isCompact ? "100%" : 220,
              flexShrink: 0,
              overflowY: "auto",
              background: "var(--color-surface-2)",
              borderRight: isCompact ? "none" : "1px solid var(--color-border)",
              borderBottom: isCompact ? "1px solid var(--color-border)" : "none",
            }}
          >
            {PHASES.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePhase(p.id)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderLeft: `2px solid ${activePhase === p.id ? p.color : "transparent"}`,
                  background: activePhase === p.id ? `color-mix(in srgb, ${p.color} 12%, transparent)` : "transparent",
                  transition: "all 140ms",
                  marginBottom: 2,
                  border: `none`,
                  textAlign: "left"
                }}
              >
                <div style={{ fontSize: 10, color: activePhase === p.id ? p.color : "var(--color-text-muted)", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 2 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 13, color: activePhase === p.id ? p.color : "var(--color-text-secondary)", fontWeight: 700, marginBottom: 3 }}>
                  {p.subtitle}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{p.weeks}</div>
              </button>
            ))}
          </div>

          {/* Phase detail */}
          {phase && (
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isCompact ? "20px 16px" : "24px 28px" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 24, color: phase.color }}>{phase.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: phase.color, letterSpacing: "0.15em", fontWeight: 700 }}>
                      {phase.label} · {phase.weeks}
                    </div>
                    <div style={{ fontSize: 22, color: "var(--color-text-primary)", fontWeight: 700 }}>
                      {phase.subtitle}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "14px 16px",
                    background: `color-mix(in srgb, ${phase.color} 10%, var(--color-surface))`,
                    border: `1px solid color-mix(in srgb, ${phase.color} 25%, var(--color-border))`,
                    borderRadius: 10,
                    fontSize: 14,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                    fontStyle: "italic"
                  }}
                >
                  "{phase.why}"
                </div>
              </div>

              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--color-text-muted)", fontWeight: 700, marginBottom: 12 }}>
                DELIVERABLES IN THIS PHASE
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr", gap: 10 }}>
                {phase.domains.map((d, i) => (
                  <PlanningSectionCard
                    key={i}
                    style={{ padding: "14px 16px", border: `1px solid color-mix(in srgb, ${phase.color} 20%, var(--color-border))`, display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 16, color: phase.color, opacity: 0.6 }}>{phase.icon}</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{d}</span>
                  </PlanningSectionCard>
                ))}
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: "14px 18px",
                  background: "var(--color-accent-dim)",
                  border: "1px solid var(--color-accent-strong)",
                  borderRadius: 10
                }}
              >
                <div style={{ fontSize: 11, color: "var(--color-accent)", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 8 }}>
                  ◈ BUILD ORDER WITHIN THIS PHASE
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                  1. Backend: Run migration SQL → verify tables<br />
                  2. Backend: Build API routes + service layer<br />
                  3. Backend: AI integration + worker jobs<br />
                  4. Frontend: Build module components<br />
                  5. Frontend: Wire into AppShell navigation<br />
                  6. Both: Integration tests + cross-check reports<br />
                  7. Both: Signal aggregator update — new module signals
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Moments tab ── */}
      {tab === "moments" && (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isCompact ? "20px 16px" : "28px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--color-text-muted)", fontWeight: 700, marginBottom: 6 }}>
            5 MOMENTS THAT EARN LOYALTY
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24, lineHeight: 1.7 }}>
            These are not features. These are the moments operators will tell others about.
            Build toward these moments — not toward a checklist.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {INNOVATION_MOMENTS.map((m, i) => (
              <PlanningSectionCard
                key={i}
                style={{
                  border: `1px solid color-mix(in srgb, ${m.color} 25%, var(--color-border))`,
                  padding: isCompact ? "18px 16px" : "20px 24px",
                  display: "flex",
                  gap: 20,
                  alignItems: "start",
                  flexDirection: isCompact ? "column" : "row"
                }}
              >
                <div style={{ fontSize: 28, color: m.color, opacity: 0.7, minWidth: 40, textAlign: "center", marginTop: 2 }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, color: m.color, fontWeight: 700, marginBottom: 8 }}>{m.title}</div>
                  <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.75 }}>{m.desc}</div>
                </div>
              </PlanningSectionCard>
            ))}
          </div>
          <div
            style={{
              marginTop: 20,
              padding: "16px 20px",
              background: "color-mix(in srgb, #a78bfa 8%, var(--color-surface))",
              border: "1px solid color-mix(in srgb, #a78bfa 22%, var(--color-border))",
              borderRadius: 10,
              fontSize: 14,
              color: "var(--color-text-secondary)",
              lineHeight: 1.8
            }}
          >
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>Why this framing matters: </span>
            ServiceTitan became a $10B company not because it had the most features —
            but because plumbers called their friends and said "you have to see this thing."
            KÓRA needs 5 of those moments. The brief above builds all 5.
          </div>
        </div>
      )}

      {/* ── Prompt tab ── */}
      {tab === "prompt" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              padding: isCompact ? "12px 16px" : "12px 28px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: isCompact ? "flex-start" : "center",
              gap: 12,
              flexWrap: "wrap",
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {promptLines.length} lines · Phases 5–10 · All migrations, routes, components, AI integrations
            </div>
            <PlanningActionButton onClick={copy} active={copied}>
              {copied ? "✓ COPIED" : "COPY PROMPT"}
            </PlanningActionButton>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isCompact ? "20px 16px" : "24px 28px" }}>
            <pre
              style={{
                fontSize: 12.5,
                lineHeight: 1.78,
                color: "var(--color-text-secondary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontFamily: "'DM Mono','Fira Code','Courier New',monospace"
              }}
            >
              {promptLines.map((line, i) => {
                if (line.startsWith("━━━") || line.startsWith("═══"))
                  return <span key={i} style={{ color: "var(--color-accent)", opacity: 0.18 }}>{line}{"\n"}</span>;
                if (line.match(/^(KÓRA —|READ THIS|COMPETING|EMPATHY NOTE)/))
                  return <span key={i} style={{ color: "var(--color-accent)", fontWeight: 700 }}>{line}{"\n"}</span>;
                if (line.match(/^(PHASE [0-9]|═══)/))
                  return <span key={i} style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13 }}>{line}{"\n"}</span>;
                if (line.match(/^(BACKEND|FRONTEND) (AGENT|—)/))
                  return <span key={i} style={{ color: "#f59e0b", fontWeight: 700 }}>{line}{"\n"}</span>;
                if (line.match(/^  (POST|GET|PATCH|DELETE|PUT) /))
                  return <span key={i} style={{ color: "#4a9eff" }}>{line}{"\n"}</span>;
                if (line.match(/^  create table|^  create index|^  alter table/i))
                  return <span key={i} style={{ color: "#22c55e" }}>{line}{"\n"}</span>;
                if (line.startsWith("  //") || line.startsWith("    //"))
                  return <span key={i} style={{ color: "var(--color-text-faint)" }}>{line}{"\n"}</span>;
                if (line.match(/^[0-9]\. THE [A-Z]/))
                  return <span key={i} style={{ color: "var(--color-accent)", fontWeight: 700 }}>{line}{"\n"}</span>;
                return <span key={i}>{line}{"\n"}</span>;
              })}
            </pre>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
      `}</style>
    </PlanningPageShell>
  );
}
