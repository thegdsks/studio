'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'studio:demo-mode';

/** Persisted demo mode toggle. Default false. */
export function useDemoMode(): { demoMode: boolean; setDemoMode: (next: boolean) => void } {
  const [demoMode, setDemoModeState] = useState(false);

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    setDemoModeState(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const setDemoMode = useCallback((next: boolean) => {
    setDemoModeState(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  }, []);

  return { demoMode, setDemoMode };
}
