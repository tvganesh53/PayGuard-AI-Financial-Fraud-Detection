import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  { id: 'cyber-blue', name: 'Cyber Blue (Default)', color: '#0284c7' },
  { id: 'neon-purple', name: 'Neon Purple (AI SOC)', color: '#9333ea' },
  { id: 'emerald-security', name: 'Emerald Security', color: '#059669' },
  { id: 'amber-intelligence', name: 'Amber Intelligence', color: '#d97706' },
  { id: 'crimson-threat', name: 'Crimson Threat', color: '#e11d48' },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('payguard_theme') || 'cyber-blue';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('payguard_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
