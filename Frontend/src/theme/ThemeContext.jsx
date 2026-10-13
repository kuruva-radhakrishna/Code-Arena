import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

const STORAGE_KEY = 'ca_theme';

const ThemeContext = createContext({ theme: 'light', toggle: () => {}, setTheme: () => {} });

const prefersDark = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Light / dark theme. With nothing saved the theme follows the operating system (and
 * updates live when it changes); once the user picks one it is remembered in this browser.
 * The theme is applied as data-theme="light|dark" on <html>; index.html sets it before
 * React renders so there is no flash of the wrong theme.
 */
export function ThemeProvider({ children }) {
  const [stored, setStored] = useState(readStored); // null = follow the system
  const [system, setSystem] = useState(() => (prefersDark() ? 'dark' : 'light'));

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystem(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = stored ?? system;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((value) => {
    setStored(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable: the choice just lasts for this visit */ }
  }, []);

  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  // MUI components (used by the older admin forms) follow the same palette.
  const muiTheme = useMemo(
    () => createTheme({
      palette: theme === 'dark'
        ? {
            mode: 'dark',
            primary: { main: '#4d9be6' },
            background: { default: '#0d1117', paper: '#14161a' },
            text: { primary: '#e6edf3', secondary: '#9ca1ab' },
            divider: '#2b313a',
          }
        : { mode: 'light' },
    }),
    [theme]
  );

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
