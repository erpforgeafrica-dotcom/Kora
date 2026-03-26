import { type CSSProperties, useState } from "react";

export interface AIStreamPanelProps {
  isStreaming: boolean;
  content: string;
  model?: string;
  taskType?: string;
  latencyMs?: number;
  tokenCount?: number;
  onClose: () => void;
  error?: string | null;
}

function getModelBadge(model?: string) {
  const lower = (model ?? "").toLowerCase();
  if (lower.includes("claude")) {
    return { color: "var(--color-accent)", background: "var(--color-accent-dim)" };
  }
  if (lower.includes("gpt")) {
    return { color: "var(--color-success)", background: "color-mix(in srgb, var(--color-success) 12%, transparent)" };
  }
  if (lower.includes("gemini")) {
    return { color: "var(--color-warning)", background: "color-mix(in srgb, var(--color-warning) 12%, transparent)" };
  }
  if (lower.includes("mistral")) {
    return {
      color: "color-mix(in srgb, var(--color-accent) 45%, var(--color-text-secondary) 55%)",
      background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-text-secondary) 8%)"
    };
  }
  return { color: "var(--color-accent)", background: "var(--color-accent-dim)" };
}

export default function AIStreamPanel({
  isStreaming,
  content,
  model,
  taskType,
  latencyMs,
  tokenCount,
  onClose,
  error
}: AIStreamPanelProps) {
  const [copied, setCopied] = useState(false);
  const isThinking = isStreaming && !content;
  const isComplete = !isStreaming && !!content && !error;
  const badge = getModelBadge(model);

  return (
    <div
      style={{
        background: "var(--color-surface-2)",
        border: error ? "1px solid color-mix(in srgb, var(--color-danger) 40%, transparent)" : "1px solid var(--color-accent-strong)",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
        boxShadow: "0 20px 60px color-mix(in srgb, var(--color-bg) 65%, transparent)"
      }}
    >
      <div
        style={{
          background: "var(--color-surface-2)",
          padding: "14px 18px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 700, letterSpacing: "0.12em" }}>
          ◈ KÓRA INTELLIGENCE
        </div>
        {model ? (
          <div
            style={{
              fontSize: 10,
              padding: "3px 10px",
              borderRadius: 999,
              color: badge.color,
              background: badge.background,
              border: `1px solid ${badge.color}44`
            }}
          >
            {model}
          </div>
        ) : null}
      </div>

      <div
        style={{
          background: "var(--color-surface-2)",
          padding: "8px 18px",
          borderBottom: "1px solid var(--color-border)",
          fontSize: 11,
          color: "var(--color-text-muted)",
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}
      >
        <span>{taskType ?? "Natural Language Query"}</span>
        {typeof latencyMs === "number" ? <span>· {(latencyMs / 1000).toFixed(1)}s</span> : null}
        {typeof tokenCount === "number" ? <span>· {tokenCount} tokens</span> : null}
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          padding: "18px 20px",
          minHeight: 120,
          maxHeight: 420,
          overflowY: "auto",
          fontSize: 14,
          color: "var(--color-text-secondary)",
          lineHeight: 1.8
        }}
      >
        {isThinking ? (
          <div style={{ display: "grid", gap: 8 }}>
            {[75, 55, 65].map((width) => (
              <div
                key={width}
                style={{
                  width: `${width}%`,
                  height: 12,
                  borderRadius: 4,
                  background: "linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%)",
                  backgroundSize: "400% 100%",
                  animation: "shimmer-ai 1.5s infinite linear"
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div style={{ color: "var(--color-danger)", fontSize: 13 }}>
            <div style={{ marginBottom: 8 }}>Stream interrupted</div>
            {content ? <div style={{ color: "var(--color-text-secondary)" }}>{content}</div> : null}
          </div>
        ) : (
          <div>
            {content}
            {isStreaming ? (
              <span style={{ animation: "blink-cursor 0.8s infinite", color: "var(--color-accent)" }}>▊</span>
            ) : null}
          </div>
        )}
      </div>

      <div
        style={{
          background: "var(--color-surface-2)",
          padding: "10px 18px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          disabled={!content}
          style={footerButtonStyle}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>

        <div style={{ fontSize: 11, color: error ? "var(--color-danger)" : "var(--color-accent)" }}>
          {error ? "Stream interrupted" : isComplete ? "✓ Complete" : ""}
        </div>

        <button type="button" onClick={onClose} style={footerButtonStyle}>
          {error ? "Retry" : "Close"}
        </button>
      </div>

      <style>{`
        @keyframes shimmer-ai {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes blink-cursor {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function useStreamingResponse() {
  const [state, setState] = useState({
    content: "",
    isStreaming: false,
    model: "",
    latencyMs: 0,
    tokenCount: 0,
    error: null as string | null
  });

  async function stream(
    apiCall: () => Promise<{
      content?: string;
      answer?: string;
      modelUsed: string;
      latencyMs: number;
      tokens: { totalTokens: number };
    }>
  ) {
    setState((current) => ({ ...current, isStreaming: true, content: "", error: null }));
    try {
      const result = await apiCall();
      const text = result.content ?? result.answer ?? "";
      const words = text.split(" ");

      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 38));
        setState((current) => ({ ...current, content: `${current.content}${word} ` }));
      }

      setState((current) => ({
        ...current,
        isStreaming: false,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        tokenCount: result.tokens.totalTokens
      }));
    } catch (error) {
      setState((current) => ({ ...current, isStreaming: false, error: String(error) }));
    }
  }

  const reset = () =>
    setState({
      content: "",
      isStreaming: false,
      model: "",
      latencyMs: 0,
      tokenCount: 0,
      error: null
    });

  return { ...state, stream, reset };
}

const footerButtonStyle: CSSProperties = {
  background: "var(--color-accent-dim)",
  border: "1px solid var(--color-accent-strong)",
  color: "var(--color-accent)",
  padding: "5px 12px",
  borderRadius: 5,
  fontFamily: "'DM Mono', monospace",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 12
};
