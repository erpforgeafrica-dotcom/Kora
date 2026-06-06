import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface KoraTheme {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  header: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  card: string;
  cardBorder: string;
}

export const THEMES: KoraTheme[] = [
  {
    id: 'emerald-dark',
    name: 'Emerald Dark',
    emoji: '🌑',
    bg:           '#030610',
    surface:      '#06091a',
    surfaceHover: '#0a0f24',
    border:       'rgba(255,255,255,0.08)',
    header:       'rgba(6,9,26,0.95)',
    text:         '#ffffff',
    textMuted:    'rgba(255,255,255,0.55)',
    textFaint:    'rgba(255,255,255,0.35)',
    primary:      '#10b981',
    primaryHover: '#34d399',
    primaryText:  '#030610',
    card:         'rgba(255,255,255,0.04)',
    cardBorder:   'rgba(255,255,255,0.07)',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    emoji: '🌊',
    bg:           '#060d1f',
    surface:      '#0a1628',
    surfaceHover: '#0f1e35',
    border:       'rgba(14,165,233,0.15)',
    header:       'rgba(10,18,40,0.96)',
    text:         '#e0f2fe',
    textMuted:    'rgba(224,242,254,0.55)',
    textFaint:    'rgba(224,242,254,0.35)',
    primary:      '#0ea5e9',
    primaryHover: '#38bdf8',
    primaryText:  '#060d1f',
    card:         'rgba(14,165,233,0.05)',
    cardBorder:   'rgba(14,165,233,0.12)',
  },
  {
    id: 'oxblood',
    name: 'Deep Oxblood',
    emoji: '🍷',
    bg:           '#0f0508',
    surface:      '#1a080c',
    surfaceHover: '#220b10',
    border:       'rgba(185,28,28,0.18)',
    header:       'rgba(26,8,12,0.97)',
    text:         '#fce7e7',
    textMuted:    'rgba(252,231,231,0.55)',
    textFaint:    'rgba(252,231,231,0.35)',
    primary:      '#dc2626',
    primaryHover: '#ef4444',
    primaryText:  '#fce7e7',
    card:         'rgba(185,28,28,0.06)',
    cardBorder:   'rgba(185,28,28,0.15)',
  },
  {
    id: 'forest-green',
    name: 'Deep Forest',
    emoji: '🌲',
    bg:           '#030f08',
    surface:      '#061a0e',
    surfaceHover: '#092416',
    border:       'rgba(22,163,74,0.15)',
    header:       'rgba(6,26,14,0.97)',
    text:         '#dcfce7',
    textMuted:    'rgba(220,252,231,0.55)',
    textFaint:    'rgba(220,252,231,0.35)',
    primary:      '#16a34a',
    primaryHover: '#22c55e',
    primaryText:  '#030f08',
    card:         'rgba(22,163,74,0.06)',
    cardBorder:   'rgba(22,163,74,0.12)',
  },
  {
    id: 'deep-pink',
    name: 'Deep Rose',
    emoji: '🌸',
    bg:           '#0f0510',
    surface:      '#1a0820',
    surfaceHover: '#220b2a',
    border:       'rgba(219,39,119,0.18)',
    header:       'rgba(26,8,32,0.97)',
    text:         '#fce7f3',
    textMuted:    'rgba(252,231,243,0.55)',
    textFaint:    'rgba(252,231,243,0.35)',
    primary:      '#db2777',
    primaryHover: '#ec4899',
    primaryText:  '#fce7f3',
    card:         'rgba(219,39,119,0.06)',
    cardBorder:   'rgba(219,39,119,0.15)',
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    emoji: '👑',
    bg:           '#05050f',
    surface:      '#0c0c28',
    surfaceHover: '#121238',
    border:       'rgba(99,102,241,0.18)',
    header:       'rgba(12,12,40,0.97)',
    text:         '#e0e7ff',
    textMuted:    'rgba(224,231,255,0.55)',
    textFaint:    'rgba(224,231,255,0.35)',
    primary:      '#6366f1',
    primaryHover: '#818cf8',
    primaryText:  '#e0e7ff',
    card:         'rgba(99,102,241,0.06)',
    cardBorder:   'rgba(99,102,241,0.15)',
  },
  {
    id: 'pure-light',
    name: 'Pure Light',
    emoji: '☀️',
    bg:           '#f8fafc',
    surface:      '#ffffff',
    surfaceHover: '#f1f5f9',
    border:       'rgba(15,23,42,0.10)',
    header:       'rgba(255,255,255,0.97)',
    text:         '#0f172a',
    textMuted:    '#475569',
    textFaint:    '#94a3b8',
    primary:      '#059669',
    primaryHover: '#047857',
    primaryText:  '#ffffff',
    card:         'rgba(15,23,42,0.03)',
    cardBorder:   'rgba(15,23,42,0.08)',
  },
];

interface ThemeCtx {
  theme: KoraTheme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: THEMES[0],
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('kora-theme') || 'emerald-dark');
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    localStorage.setItem('kora-theme', themeId);
    // Apply to document root for any global CSS vars
    const r = document.documentElement.style;
    r.setProperty('--kora-bg',      theme.bg);
    r.setProperty('--kora-surface', theme.surface);
    r.setProperty('--kora-primary', theme.primary);
    r.setProperty('--kora-text',    theme.text);
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [themeId, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
