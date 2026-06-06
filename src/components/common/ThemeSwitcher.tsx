import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  glowColor: string;
}

const THEMES: Theme[] = [
  {
    id: '1',
    name: 'Emerald Dark',
    category: 'dark',
    primaryColor: '#10b981',
    backgroundColor: '#030610',
    textColor: '#ffffff',
    glowColor: '#10b981',
  },
  {
    id: '2',
    name: 'Pure White',
    category: 'light',
    primaryColor: '#059669',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    glowColor: '#059669',
  },
  {
    id: '3',
    name: 'High Contrast',
    category: 'high_contrast',
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    glowColor: '#fbbf24',
  },
  {
    id: '4',
    name: 'Ocean Blue',
    category: 'dark',
    primaryColor: '#0ea5e9',
    backgroundColor: '#0c1629',
    textColor: '#ffffff',
    glowColor: '#0ea5e9',
  },
  {
    id: '5',
    name: 'Sunset Orange',
    category: 'colorful',
    primaryColor: '#f97316',
    backgroundColor: '#1c1917',
    textColor: '#ffffff',
    glowColor: '#f97316',
  },
];

interface Props {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  currentThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export default function ThemeSwitcher({ 
  position = 'top-right', 
  currentThemeId = '1',
  onThemeChange 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId);

  const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-bg', theme.backgroundColor);
    root.style.setProperty('--color-text', theme.textColor);
    root.style.setProperty('--color-glow', theme.glowColor);
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.textColor;
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    setSelectedTheme(themeId);
    applyTheme(theme);
    onThemeChange?.(themeId);
    setIsOpen(false);
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Theme Indicator Button - Glowing */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
        title="Change Theme"
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"
          style={{ backgroundColor: currentTheme.glowColor }}
        />
        
        {/* Button */}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            borderColor: currentTheme.glowColor,
            color: currentTheme.textColor,
          }}
        >
          <Palette className="w-5 h-5" />
        </div>
      </button>

      {/* Theme Picker Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-14 right-0 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold text-sm">Choose Theme</h3>
              <p className="text-slate-400 text-xs mt-1">Pick your favorite look</p>
            </div>
            
            <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl transition-all group
                    ${selectedTheme === theme.id 
                      ? 'bg-slate-800 border-2' 
                      : 'bg-slate-800/50 border-2 border-transparent hover:bg-slate-800'
                    }
                  `}
                  style={{
                    borderColor: selectedTheme === theme.id ? theme.glowColor : 'transparent',
                  }}
                >
                  {/* Theme Preview Circle */}
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-full border-2"
                      style={{
                        backgroundColor: theme.backgroundColor,
                        borderColor: theme.primaryColor,
                      }}
                    />
                    {selectedTheme === theme.id && (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-white"
                        style={{ color: theme.textColor }}
                      >
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium text-sm">{theme.name}</div>
                    <div className="text-slate-400 text-xs capitalize">{theme.category.replace('_', ' ')}</div>
                  </div>

                  {/* Glow indicator when selected */}
                  {selectedTheme === theme.id && (
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: theme.glowColor }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
