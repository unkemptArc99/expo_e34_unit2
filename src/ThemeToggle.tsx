import { useEffect, useState } from 'react';
import { Icon } from './ui';
import { applyTheme, parseTheme, readThemePreference, resolveTheme, themeStorageKey, type Theme } from './theme';

export function ThemeToggle() {
  const [preference, setPreference] = useState(readThemePreference);
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = resolveTheme(preference, systemDark);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const change = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    const storage = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null) setPreference(parseTheme(event.newValue));
    };
    media.addEventListener('change', change);
    window.addEventListener('storage', storage);
    return () => { media.removeEventListener('change', change); window.removeEventListener('storage', storage); };
  }, []);
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setPreference(next);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* The selection still works when storage is unavailable. */ }
  }
  return <button className="theme-toggle" aria-label={label} title={label} onClick={toggle}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17}/></button>;
}
