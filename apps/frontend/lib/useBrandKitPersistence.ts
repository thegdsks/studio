'use client';

/**
 * Persists BrandKit font overrides to localStorage under
 * `studio.brandKit.<runId>`. Reads on mount; writes on change.
 *
 * SSR-safe: all localStorage access is guarded by `typeof window`.
 * Validation: uses `assertValidBrandKit` — throws on malformed data (no fallbacks).
 */

import { useEffect, useState } from 'react';
import { assertValidBrandKit } from '@studio/ui';
import type { BrandKit, GoogleFontName } from '@studio/ui';

export interface BrandKitOverrides {
  headlineFont?: GoogleFontName;
  bodyFont?: GoogleFontName;
}

function storageKey(runId: string): string {
  return `studio.brandKit.${runId}`;
}

function readFromStorage(runId: string): BrandKitOverrides | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey(runId));
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  // Build a minimal fake BrandKit to run through assertValidBrandKit
  // so fonts are properly validated against ALLOWED_GOOGLE_FONTS.
  const probe = {
    name: '__probe__',
    primary: '#000000',
    headlineFont: (parsed as Record<string, unknown>).headlineFont,
    bodyFont: (parsed as Record<string, unknown>).bodyFont,
  };
  // Throws on invalid — no fallback (per CLAUDE.md rule)
  assertValidBrandKit(probe);

  return parsed as BrandKitOverrides;
}

function writeToStorage(runId: string, overrides: BrandKitOverrides): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(runId), JSON.stringify(overrides));
}

/**
 * Returns [overrides, setOverrides].
 * `overrides` is null until window is available and localStorage is read.
 * Changing either font is persisted immediately.
 */
export function useBrandKitPersistence(
  runId: string | undefined,
  kit: BrandKit | null,
): [BrandKitOverrides, (next: BrandKitOverrides) => void] {
  const [overrides, setOverridesState] = useState<BrandKitOverrides>(() => {
    if (!runId) return {};
    return readFromStorage(runId) ?? {};
  });

  // Re-read from storage when runId changes (SSR → client hydration)
  useEffect(() => {
    if (!runId) return;
    const stored = readFromStorage(runId);
    if (stored) setOverridesState(stored);
  }, [runId]);

  // Persist whenever kit or overrides change
  useEffect(() => {
    if (!runId || !kit) return;
    writeToStorage(runId, overrides);
  }, [runId, kit, overrides]);

  function setOverrides(next: BrandKitOverrides): void {
    setOverridesState(next);
    if (runId) writeToStorage(runId, next);
  }

  return [overrides, setOverrides];
}
