import { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "dark" | "oxblood" | "forest" | "abyss" | "light" | "pink";

const THEMES = [
  { id: "dark" as const, label: "OBSIDIAN", accent: "#00e5c8", desc: "Command centre default" },
  { id: "oxblood" as const, label: "OXBLOOD", accent: "#e05252", desc: "Authority & precision" },
  { id: "forest" as const, label: "DEEP FOREST", accent: "#34d058", desc: "Calm operational green" },
  { id: "abyss" as const, label: "ABYSS BLUE", accent: "#4a9eff", desc: "Deep ocean intelligence" },
  { id: "light" as const, label: "POLAR", accent: "#00897b", desc: "High-visibility light" },
  { id: "pink" as const, label: "ROSE GARDEN", accent: "#d946a6", desc: "Elegant & premium" }
];

const ThemeContext = createContext<{
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof THEMES;
}>({
  themeId: "dark",
  setTheme: () => undefined,
  themes: THEMES
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = localStorage.getItem("kora_theme") as ThemeId | null;
    return stored ?? "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("kora_theme", themeId);
  }, [themeId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme: setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
