import { useEffect, useRef, useState } from "react";
import { useChatbot } from "../../contexts/ChatbotContext";
import { chatbotService } from "../../services/api/chatbot";

export interface KoraChatbotProps {
  role?: "client" | "business" | "operations" | "staff" | "admin";
  department?: string;
  onActionClick?: (actionId: string, target: string) => void;
}

export function KoraChatbot({ role = "client", department, onActionClick }: KoraChatbotProps) {
  const { isOpen, messages, isLoading, toggleChatbot, sendMessage, clearChat } =
    useChatbot();
  const [input, setInput] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        await chatbotService.createSession(role, department);
        setSessionReady(true);
      } catch (error) {
        console.error("Failed to initialize chatbot session:", error);
      }
    };
    initSession();
  }, [role, department]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionReady) return;

    const userMessage = input;
    setInput("");

    try {
      await sendMessage(userMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChatbot}
        title="Open KÓRA Chatbot"
        style={{
          position: "fixed",
          bottom: 104,
          right: 24,
          zIndex: 998,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--color-accent)",
          border: "none",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          transition: "all 140ms",
          boxShadow: "0 4px 16px var(--color-accent)40",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          btn.style.transform = "scale(1.1)";
          btn.style.boxShadow = "0 8px 24px var(--color-accent)60";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.transform = "";
          btn.style.boxShadow = "0 4px 16px var(--color-accent)40";
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        width: "100%",
        maxWidth: 380,
        height: 600,
        borderRadius: 12,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>KÓRA Assistant</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {sessionReady ? "Ready to help" : "Connecting..."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={clearChat}
            title="Clear chat history"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 100ms"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            🗑️
          </button>
          <button
            onClick={toggleChatbot}
            title="Close chatbot"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 100ms"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: 13,
              marginTop: "auto",
              marginBottom: "auto"
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <div>Hi! How can I help you today?</div>
            <div style={{ fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
              Ask about bookings, payments, promotions, and more
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              gap: 8
            }}
          >
            {message.role === "assistant" && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--color-surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                }}
              >
                🤖
              </div>
            )}
            <div
              style={{
                maxWidth: "70%",
                padding: "10px 12px",
                borderRadius: 8,
                background:
                  message.role === "user"
                    ? "var(--color-accent)"
                    : "var(--color-surface-2)",
                color:
                  message.role === "user"
                    ? "#fff"
                    : "var(--color-text-primary)",
                fontSize: 13,
                lineHeight: 1.4,
                wordWrap: "break-word"
              }}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              background: "var(--color-surface-2)",
              borderRadius: 8,
              width: "fit-content"
            }}
          >
            <span style={{ animation: "pulse 1s infinite", fontSize: 14 }}>●</span>
            <span style={{ animation: "pulse 1s infinite 0.2s", fontSize: 14 }}>●</span>
            <span style={{ animation: "pulse 1s infinite 0.4s", fontSize: 14 }}>●</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          gap: 8
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={!sessionReady || isLoading}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            color: "var(--color-text-primary)",
            fontSize: 13,
            fontFamily: "inherit",
            transition: "all 100ms",
            opacity: sessionReady ? 1 : 0.5,
            cursor: sessionReady ? "text" : "not-allowed"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || !sessionReady || isLoading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: input.trim() && sessionReady && !isLoading
              ? "var(--color-accent)"
              : "var(--color-surface-2)",
            border: "none",
            color: "#fff",
            cursor:
              input.trim() && sessionReady && !isLoading
                ? "pointer"
                : "not-allowed",
            fontSize: 16,
            transition: "all 100ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            if (input.trim() && sessionReady && !isLoading) {
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
          }}
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
