import { useState } from "react";
import { AIChat } from "./AIChat";

export function AIFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "2px solid var(--color-accent)",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            fontSize: 24,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px color-mix(in srgb, var(--color-accent) 40%, transparent)",
            transition: "all 200ms ease",
            zIndex: 999,
            animation: "pulse 2s ease-in-out infinite"
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.transform = "scale(1.1)";
            el.style.boxShadow = "0 12px 32px color-mix(in srgb, var(--color-accent) 60%, transparent)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.transform = "scale(1)";
            el.style.boxShadow = "0 8px 24px color-mix(in srgb, var(--color-accent) 40%, transparent)";
          }}
          title="Open AI Assistant"
        >
          💬
        </button>
      )}

      {/* Modal Overlay & Chat */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "color-mix(in srgb, var(--color-bg) 60%, transparent)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              animation: "fadeIn 200ms ease"
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              width: "clamp(300px, 90vw, 500px)",
              height: "clamp(300px, 80vh, 600px)",
              zIndex: 1001,
              animation: "slideDown 300ms ease"
            }}
          >
            <AIChat onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
