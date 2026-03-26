import { useRef, useState } from "react";
import * as api from "../services/api";

export interface NaturalLanguageInputProps {
  onResult?: (result: {
    answer: string;
    modelUsed: string;
    latencyMs: number;
    tokenCount: number;
  }) => void;
  onStreamStart?: () => void;
  className?: string;
}

const QUERIES = [
  "Show me this week's revenue trend",
  "Which staff member has the most bookings today?",
  "Any compliance risks this week?",
  "Summarize today's incidents",
  "What's causing the booking backlog?",
  "Forecast tomorrow's revenue"
];

export default function NaturalLanguageInput({ onResult, onStreamStart, className }: NaturalLanguageInputProps) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");
  const [error, setError] = useState("");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const addToHistory = (query: string) => {
    if (!query.trim()) {
      return;
    }
    historyRef.current = [query, ...historyRef.current.filter((item) => item !== query)].slice(0, 10);
    historyIndexRef.current = -1;
  };

  const runQuery = async (query: string) => {
    if (!query.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setRateLimitMsg("");
    onStreamStart?.();

    try {
      const result = await api.naturalLanguageQuery({
        question: query,
        context: "dashboard",
        topN: 3
      });
      addToHistory(query);
      onResult?.(result);
      setValue("");
    } catch (caughtError: any) {
      if (caughtError.status === 404) {
        onResult?.({
          answer:
            "KÓRA Intelligence is processing your request. The natural language engine is activating - please ensure the backend /api/ai/query endpoint is deployed.",
          modelUsed: "pending",
          latencyMs: 0,
          tokenCount: 0
        });
      } else if (caughtError.status === 429) {
        setRateLimitMsg("Query limit reached - please wait 60s");
        setTimeout(() => setRateLimitMsg(""), 60000);
      } else {
        setError("Query failed - please try again");
        setTimeout(() => setError(""), 4000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative", width: "100%" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-accent)",
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            pointerEvents: "none",
            zIndex: 1,
            userSelect: "none",
            animation: isLoading ? "pulse 0.6s infinite" : undefined
          }}
        >
          {isLoading ? "···" : ">"}
        </span>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void runQuery(value);
              return;
            }

            if (event.key === "ArrowUp" && !event.shiftKey) {
              event.preventDefault();
              historyIndexRef.current = Math.min(historyIndexRef.current + 1, historyRef.current.length - 1);
              setValue(historyRef.current[historyIndexRef.current] ?? value);
              return;
            }

            if (event.key === "ArrowDown" && !event.shiftKey) {
              event.preventDefault();
              historyIndexRef.current = Math.max(historyIndexRef.current - 1, -1);
              setValue(historyIndexRef.current >= 0 ? historyRef.current[historyIndexRef.current] ?? "" : "");
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setValue("");
              historyIndexRef.current = -1;
            }
          }}
          disabled={isLoading}
          placeholder="Ask KÓRA anything about your operations..."
          style={{
            width: "100%",
            minHeight: 52,
            maxHeight: 140,
            resize: "vertical",
            paddingLeft: 30,
            paddingRight: 88,
            paddingTop: 12,
            paddingBottom: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text-primary)",
            fontSize: 15,
            lineHeight: 1.6,
            fontFamily: "'DM Mono', monospace",
            outline: "none"
          }}
        />

        <button
          type="button"
          onClick={() => void runQuery(value)}
          disabled={isLoading || !value.trim()}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent-strong)",
            borderRadius: 5,
            color: "var(--color-accent)",
            padding: "5px 12px",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: isLoading || !value.trim() ? "not-allowed" : "pointer",
            opacity: isLoading || !value.trim() ? 0.4 : 1
          }}
        >
          {isLoading ? "···" : "Ask →"}
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {QUERIES.map((query) => (
          <button
            key={query}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setValue(query);
              void runQuery(query);
            }}
            style={{
              padding: "4px 12px",
              background: "var(--color-accent-soft)",
              border: "1px solid var(--color-accent-dim)",
              borderRadius: 6,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              color: "var(--color-text-muted)",
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {query}
          </button>
        ))}
      </div>

      {rateLimitMsg ? (
        <div style={{ color: "var(--color-warning)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
          {rateLimitMsg}
        </div>
      ) : null}

      {error ? (
        <div style={{ color: "var(--color-danger)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{error}</div>
      ) : null}
    </div>
  );
}
