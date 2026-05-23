'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'studio.theme';

const LIGHT_VARS: Record<string, string> = {
  // Backgrounds
  '--color-bg': '#F8FAFC',
  '--color-surface': '#F1F5F9',
  '--color-surface-raised': '#FFFFFF',
  '--color-surface-sunken': '#E2E8F0',
  // Text
  '--color-text': '#0F172A',
  '--color-text-muted': '#475569',
  '--color-text-faint': '#94A3B8',
  '--color-text-on-accent': '#FFFFFF',
  // Borders
  '--color-border': 'rgba(15, 23, 42, 0.08)',
  '--color-border-strong': 'rgba(15, 23, 42, 0.18)',
  '--color-border-accent': 'rgba(37, 99, 235, 0.45)',
  // Accent
  '--color-accent': '#2563EB',
  '--color-accent-soft': 'rgba(37, 99, 235, 0.12)',
  '--color-accent-glow': 'rgba(37, 99, 235, 0.25)',
  // Status
  '--color-status-queued': '#94A3B8',
  '--color-status-running': '#2563EB',
  '--color-status-running-soft': 'rgba(37, 99, 235, 0.12)',
  '--color-status-done': '#15803D',
  '--color-status-done-soft': 'rgba(21, 128, 61, 0.12)',
  '--color-status-warn': '#B45309',
  '--color-status-error': '#B91C1C',
  '--color-status-error-soft': 'rgba(185, 28, 28, 0.12)',
};

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);

  if (theme === 'light') {
    for (const [prop, value] of Object.entries(LIGHT_VARS)) {
      root.style.setProperty(prop, value);
    }
    root.style.setProperty('color-scheme', 'light');
  } else {
    for (const prop of Object.keys(LIGHT_VARS)) {
      root.style.removeProperty(prop);
    }
    root.style.removeProperty('color-scheme');
  }
}

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // On mount: read persisted preference and apply it.
  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // Whenever theme state changes (after mount), apply to DOM and persist.
  // Keeping DOM side effects in a useEffect (not inside a state updater) is
  // required in React 18: updater functions are double-invoked in Strict Mode,
  // which would cause applyTheme to toggle back and forth, reverting the change.
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable
    }
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme: mounted ? theme : 'dark', setTheme, toggle };
}
