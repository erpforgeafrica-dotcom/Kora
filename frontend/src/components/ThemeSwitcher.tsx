import { useEffect, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeSwitcher() {
  const { themeId, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const currentTheme = themes.find((theme) => theme.id === themeId) ?? themes[0];

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        title="Change theme"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `2px solid ${currentTheme.accent}66`,
          background: currentTheme.accent,
          boxShadow: "var(--glow-accent)",
          cursor: "pointer"
        }}
      />

      {open ? (
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            width: 240,
            padding: 12,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px color-mix(in srgb, var(--color-bg) 55%, transparent)",
            zIndex: 200
          }}
        >
          <div
            style={{
              marginBottom: 10,
              fontSize: 9,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.2em",
              color: "var(--color-text-muted)"
            }}
          >
            APPEARANCE
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {themes.map((theme) => {
              const selected = theme.id === themeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setTheme(theme.id);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "background 140ms ease",
                    border: selected ? "1px solid var(--color-accent-strong)" : "1px solid transparent",
                    background: selected ? "var(--color-accent-dim)" : "transparent",
                    color: "var(--color-text-primary)"
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: theme.accent,
                      flexShrink: 0
                    }}
                  />
                  <span style={{ flex: 1, textAlign: "left" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: 700
                      }}
                    >
                      {theme.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        color: "var(--color-text-muted)"
                      }}
                    >
                      {theme.desc}
                    </span>
                  </span>
                  <span
                    style={{
                      width: 16,
                      fontSize: 12,
                      color: selected ? "var(--color-accent)" : "transparent"
                    }}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
