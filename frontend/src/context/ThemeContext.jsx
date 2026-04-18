import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEMES = {
  dark: {
    label: 'Dark Mode',
    class: 'theme-dark',
    icon: 'moon',
  },
  light: {
    label: 'Light Mode',
    class: 'theme-light',
    icon: 'sun',
  },
  hacker: {
    label: 'Hacker Mode',
    class: 'theme-hacker',
    icon: 'terminal',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('cybershield_theme');
    return saved && THEMES[saved] ? saved : 'dark';
  });

  const applyTheme = useCallback((themeName) => {
    const root = document.documentElement;
    // Remove all theme classes
    Object.values(THEMES).forEach((t) => root.classList.remove(t.class));
    // Add new theme class
    if (THEMES[themeName]) {
      root.classList.add(THEMES[themeName].class);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = (themeName) => {
    if (THEMES[themeName]) {
      setThemeState(themeName);
      localStorage.setItem('cybershield_theme', themeName);
    }
  };

  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const idx = keys.indexOf(theme);
    const next = keys[(idx + 1) % keys.length];
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
