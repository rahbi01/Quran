// src/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // قراءة الثيم المخزن
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('quran_theme');
    return saved === 'dark' ? 'dark' : 'light'; // الوضع الافتراضي فاتح
  });

  useEffect(() => {
    localStorage.setItem('quran_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}