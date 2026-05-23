'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'studio.theme';

const LIGHT_VARS: Record<string, string> = {
  '--color-bg': '#F8FAFC',
  '--color-surface': '#FFFFFF',
  '--color-surface-raised': '#F1F5F9',
  '--color-surface-sunken': '#F8FAFC',
  '--color-text': '#0F172A',
  '--color-text-muted': '#475569',
  '--color-text-faint': '#94A3B8',
  '--color-text-on-accent': '#FFFFFF',
  '--color-border': 'rgba(15, 23, 42, 0.08)',
  '--color-border-strong': 'rgba(15, 23, 42, 0.14)',
  '--color-border-accent': 'rgba(59, 130, 246, 0.45)',
  '--color-accent': '#2563EB',
  '--color-accent-soft': 'rgba(37, 99, 235, 0.12)',
  '--color-accent-glow': 'rgba(37, 99, 235, 0.25)',
  '--color-status-queued': '#94A3B8',
  '--color-status-running': '#2563EB',
  '--color-status-running-soft': 'rgba(37, 99, 235, 0.12)',
  '--color-status-done': '#16A34A',
  '--color-status-done-soft': 'rgba(22, 163, 74, 0.12)',
  '--color-status-warn': '#D97706',
  '--color-status-error': '#DC2626',
  '--color-status-error-soft': 'rgba(220, 38, 38, 0.12)',
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

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // storage unavailable
    }
    applyTheme(t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // storage unavailable
      }
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme: mounted ? theme : 'dark', setTheme, toggle };
}
