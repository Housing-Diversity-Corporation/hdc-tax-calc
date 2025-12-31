/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('hdcDarkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }

    // Fall back to system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  });

  // Apply dark mode class and data-theme attribute to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode', 'dark');
      document.documentElement.classList.add('dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode', 'dark');
      document.documentElement.classList.remove('dark');
      document.body.setAttribute('data-theme', 'light');
    }
    // Save preference to localStorage
    localStorage.setItem('hdcDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const hasUserPreference = localStorage.getItem('hdcDarkMode') !== null;
      if (!hasUserPreference) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
