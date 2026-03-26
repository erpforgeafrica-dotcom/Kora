import { useEffect, useState, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface AIChatProps {
  onClose?: () => void;
  title?: string;
}

const SAMPLE_RESPONSES = [
  "I can help you manage your bookings. What would you like to do?",
  "I see you have 3 pending bookings. Would you like me to help you process any of them?",
  "Your staff availability looks good. All your specialists are currently available.",
  "I recommend prioritizing the 2 bookings from premium customers. Would you like me to schedule them?",
  "Your revenue is up 12% this week! Great performance. Keep it up!",
  "I noticed a customer left a 5-star review. Would you like to send them a thank you message?",
  "You have 8 pending messages (3 new). Would you like to review them?",
  "I can help you with customer segmentation, staff scheduling, or revenue analysis. What would you like to focus on?",
  "Your system health is excellent. All metrics are within normal ranges.",
  "Would you like me to generate a performance report for this week?"
];

export function AIChat({ onClose, title = "KÓRA Assistant" }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi there! I'm KÓRA Assistant. I can help you with bookings, staff management, revenue insights, and more. How can I help you today?",
      timestamp: new Date(Date.now() - 5000)
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const randomResponse = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800 + Math.random() * 400);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-surface)",
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "clamp(12px, 3vw, 16px)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div>
          <div
            style={{
              fontSize: "clamp(9px, 1.8vw, 10px)",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.12em",
              color: "var(--color-text-muted)",
              fontWeight: 700,
              marginBottom: 2
            }}
          >
            AI ASSISTANT
          </div>
          <h3 style={{ margin: 0, fontSize: "clamp(12px, 2.5vw, 14px)", color: "var(--color-text-primary)" }}>
            {title}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "clamp(14px, 2vw, 16px)",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "clamp(2px, 1vw, 4px) clamp(4px, 1.5vw, 8px)"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "clamp(12px, 3vw, 16px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(8px, 2vw, 12px)"
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                background:
                  msg.role === "user"
                    ? "var(--color-accent)"
                    : "var(--color-surface-2)",
                color:
                  msg.role === "user"
                    ? "var(--color-accent-soft)"
                    : "var(--color-text-primary)",
                fontSize: "clamp(12px, 2vw, 13px)",
                lineHeight: 1.5,
                animation: "slideDown 300ms ease"
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start"
            }}
          >
            <div
              style={{
                padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                background: "var(--color-surface-2)",
                display: "flex",
                gap: "clamp(4px, 1vw, 6px)"
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  animation: "pulse 1.4s infinite"
                }}
              />
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  animation: "pulse 1.4s infinite 0.2s"
                }}
              />
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  animation: "pulse 1.4s infinite 0.4s"
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          gap: "clamp(6px, 1.5vw, 8px)"
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleSendMessage(input);
            }
          }}
          placeholder="Ask me anything..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)",
            borderRadius: 6,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
            color: "var(--color-text-primary)",
            fontSize: "clamp(11px, 2vw, 12px)",
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            transition: "border-color 140ms ease",
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? "not-allowed" : "text"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        />
        <button
          onClick={() => handleSendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)",
            borderRadius: 6,
            border: "1px solid var(--color-accent)",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            fontSize: "clamp(11px, 2vw, 12px)",
            fontWeight: 700,
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 140ms ease",
            opacity: isLoading || !input.trim() ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
