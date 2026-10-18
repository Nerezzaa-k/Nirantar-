import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('nirantar_theme');
    if (savedTheme) return savedTheme;
    return 'light'; // Light mode by default for first-time users
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme) => {
      let effectiveDark = false;
      if (currentTheme === 'dark') {
        effectiveDark = true;
      } else if (currentTheme === 'system') {
        effectiveDark = mediaQuery.matches;
      }

      if (effectiveDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('nirantar_theme', theme);

    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setSpecificTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
