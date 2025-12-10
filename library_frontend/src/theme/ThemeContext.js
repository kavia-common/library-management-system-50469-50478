import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // Apply to document attribute for CSS theming if needed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
  }), [theme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// PUBLIC_INTERFACE
export function useTheme() {
  /** Access theme value and toggler. */
  return useContext(ThemeCtx);
}
