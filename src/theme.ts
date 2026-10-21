export type Theme = 'light' | 'dark';
export const themeStorageKey = 'interview-atlas.theme';
export const themeColors: Record<Theme, string> = { light: '#f6f8fa', dark: '#101820' };
export function parseTheme(value: string | null): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}
export function resolveTheme(preference: Theme | null): Theme {
  return preference || 'light';
}
export function readThemePreference(): Theme | null {
  try { return parseTheme(localStorage.getItem(themeStorageKey)); } catch { return null; }
}
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
}
