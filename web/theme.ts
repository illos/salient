// SPDX-License-Identifier: GPL-3.0-only
/**
 * Appearance preference: light, dark or system. Stored locally under `salient.theme` until account
 * preferences exist (V10). `index.html` applies the same rule before the first paint so a reload does
 * not flash; this module keeps the document class in sync afterwards and follows system changes.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_STORAGE_KEY = 'salient.theme';

const listeners = new Set<() => void>();
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(stored as Theme) ? (stored as Theme) : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? (media().matches ? 'dark' : 'light') : theme;
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = resolved;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const query = media();
  const onSystemChange = () => {
    if (readTheme() === 'system') applyTheme('system');
    listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(readTheme());
      listener();
    }
  };
  query.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    query.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Preference stays for this page only. */
  }
  applyTheme(theme);
  notify();
}

/** The stored preference and its current resolution, kept in sync with the document. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'system' as Theme);
  useEffect(() => applyTheme(theme), [theme]);
  const set = useCallback((next: Theme) => setTheme(next), []);
  return { theme, resolved: resolveTheme(theme), setTheme: set };
}
