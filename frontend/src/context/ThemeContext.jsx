import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState(() => {
    const savedTheme = localStorage.getItem('marketmind-theme');
    return savedTheme || 'dark';
  });
  const isDarkMode = themePreference === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : themePreference === 'dark';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('marketmind-theme', themePreference);
  }, [isDarkMode, themePreference]);

  const toggleTheme = () => {
    setThemePreferenceState(isDarkMode ? 'light' : 'dark');
  };

  const setThemePreference = useCallback(
    (preference) => setThemePreferenceState(preference),
    []
  );

  return (
    <ThemeContext.Provider value={{ isDarkMode, themePreference, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
