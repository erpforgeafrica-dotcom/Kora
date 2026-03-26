import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AIStreamPanel, { useStreamingResponse } from "../components/AIStreamPanel";
import NaturalLanguageInput from "../components/NaturalLanguageInput";
import AnomalyFeed from "../components/AnomalyFeed";
import { AICommandCenter } from "../components/AICommandCenter";
import { useAIInsights } from "../hooks/useAIInsights";
import {
  bodyTextStyle,
  chartFillStyle,
  chartShellStyle,
  DashboardList,
  DashboardPanel,
  KpiCard
} from "../components/dashboard/DashboardPrimitives";

function useLastUpdated() {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSec((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const reset = () => setSec(0);
  const label = sec < 60 ? `Updated ${sec}s ago` : `Updated ${Math.floor(sec / 60)}m ago`;
  return { label, reset };
}

const KPI_CARDS = [
  { label: "Live Actions", value: "08", tone: "var(--color-accent)" },
  { label: "Automation Rate", value: "67%", tone: "var(--color-success)" },
  { label: "Response Health", value: "98.2", tone: "var(--color-warning)" },
  { label: "Risk Flags", value: "03", tone: "var(--color-danger)" }
];

export function Dashboard() {
  const navigate = useNavigate();
  const { orchestrationResult, loading: aiLoading, error: aiError, fetchInsights } = useAIInsights();
  const [lastRefreshedTime, setLastRefreshedTime] = useState(Date.now());
  const streamPanel = useStreamingResponse();
  const [showStream, setShowStream] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const reportingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const aiRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const reportingUpdated = useLastUpdated();
  const aiUpdated = useLastUpdated();
  const isMedium = viewportWidth < 1200;
  const isNarrow = viewportWidth < 900;

  const handleNLResult = (result: {
    answer: string;
    modelUsed: string;
    latencyMs: number;
    tokenCount: number;
  }) => {
    streamPanel.reset();
    setShowStream(true);
    void streamPanel.stream(() =>
      Promise.resolve({
        answer: result.answer,
        modelUsed: result.modelUsed,
        latencyMs: result.latencyMs,
        tokens: { totalTokens: result.tokenCount }
      })
    );
  };

  const closeStream = () => {
    setShowStream(false);
    streamPanel.reset();
  };

  const handleAccept = async (actionId: string) => {
    console.log("Action accepted:", actionId);
  };

  const handleReject = async (actionId: string) => {
    console.log("Action rejected:", actionId);
  };

  const handleSimulate = (actionId: string) => {
    console.log("Simulating action:", actionId);
  };

  const fetchAI = () => {
    void fetchInsights();
    setLastRefreshedTime(Date.now());
    aiUpdated.reset();
  };

  const fetchMetrics = () => {
    setLastRefreshedTime(Date.now());
    reportingUpdated.reset();
  };

  const stopPolling = () => {
    clearInterval(reportingRef.current);
    clearInterval(aiRef.current);
  };

  const startPolling = () => {
    stopPolling();
    reportingRef.current = setInterval(fetchMetrics, 15000);
    aiRef.current = setInterval(fetchAI, 30000);
  };

  useEffect(() => {
    fetchMetrics();
    fetchAI();
    startPolling();

    const onVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchMetrics();
        fetchAI();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeStream();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      className="dashboard-root"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 16,
        padding: isNarrow ? 16 : 24,
        containerType: "inline-size"
      }}
    >
      <div
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: isNarrow ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 16
        }}
      >
        {KPI_CARDS.map((card) => (
          <KpiCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
        ))}
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <NaturalLanguageInput onResult={handleNLResult} onStreamStart={() => setShowStream(true)} />
      </div>

      <div style={{ gridColumn: isMedium ? "1 / -1" : "1 / 8" }}>
        <DashboardPanel title="AI Command Center" meta={aiUpdated.label}>
          <AICommandCenter
            result={orchestrationResult}
            loading={aiLoading}
            error={aiError}
            onAccept={handleAccept}
            onReject={handleReject}
            onSimulate={handleSimulate}
            lastRefreshed={lastRefreshedTime}
            autoRefreshInterval={30000}
          />
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isMedium ? "1 / -1" : "8 / -1" }}>
        <DashboardPanel title="Anomaly Feed" meta={reportingUpdated.label}>
          <AnomalyFeed />
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isNarrow ? "1 / -1" : "1 / 5" }}>
        <DashboardPanel title="Schedule" meta="Today">
          <DashboardList
            items={[
              "08:30  Staff briefing",
              "10:00  High-priority patient wave",
              "13:00  Clinical review block",
              "16:45  Incident readiness drill"
            ]}
          />
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isNarrow ? "1 / -1" : "5 / 9" }}>
        <DashboardPanel title="Staff" meta="Utilization">
          <DashboardList
            items={[
              "N. Adebayo  91% booked",
              "A. Martins  Surge backup",
              "K. Duru  Compliance lead",
              "T. Bello  Dispatch standby"
            ]}
          />
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isNarrow ? "1 / -1" : "9 / -1" }}>
        <DashboardPanel title="Alerts" meta="Queue">
          <DashboardList
            items={[
              "2 invoices nearing SLA breach",
              "1 emergency playbook awaiting approval",
              "Booking confirmations delayed in batch queue"
            ]}
          />
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isNarrow ? "1 / -1" : "1 / 5" }}>
        <DashboardPanel title="Planning Center" meta="Roadmap">
          <p style={bodyTextStyle}>
            Review the Phase 5 to Phase 10 implementation brief, innovation moments, and agent-ready prompt from the
            live planning workspace.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/planning")}
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--color-accent)",
              background: "var(--color-accent-dim)",
              color: "var(--color-accent)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              fontFamily: "'DM Mono', monospace",
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            Open Planning Center
          </button>
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isMedium ? "1 / -1" : "1 / 8" }}>
        <DashboardPanel title="Revenue" meta="Forecast">
          <div style={chartShellStyle}>
            <div style={chartFillStyle} />
          </div>
          <p style={bodyTextStyle}>
            Forecast confidence is stable. The next upgrade should be predictive prefetching so KORA warms the
            orchestration context before an operator opens the dashboard.
          </p>
        </DashboardPanel>
      </div>

      <div style={{ gridColumn: isMedium ? "1 / -1" : "8 / -1" }}>
        <DashboardPanel title="Business Metrics" meta="Composite">
          <DashboardList
            items={[
              "Client satisfaction signal: stable",
              "Cashflow risk: moderate",
              "Clinical throughput: above baseline",
              "AI latency: pending backend runtime"
            ]}
          />
        </DashboardPanel>
      </div>

      {showStream ? (
        <>
          <div
            onClick={closeStream}
            style={{
              position: "fixed",
              inset: 0,
              background: "color-mix(in srgb, var(--color-bg) 72%, transparent)",
              backdropFilter: "blur(4px)",
              zIndex: 999
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(680px, 90vw)",
              zIndex: 1000
            }}
          >
            <AIStreamPanel
              isStreaming={streamPanel.isStreaming}
              content={streamPanel.content}
              model={streamPanel.model}
              taskType="Natural Language Query"
              latencyMs={streamPanel.latencyMs}
              tokenCount={streamPanel.tokenCount}
              error={streamPanel.error}
              onClose={closeStream}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
