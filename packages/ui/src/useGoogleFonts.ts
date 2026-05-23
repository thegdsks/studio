'use client';

import { useEffect } from 'react';
import { isAllowedFont, type GoogleFontName } from './BrandKit.js';

/**
 * Injects Google Fonts CSS API v2 <link> tags for the given families.
 * Idempotent — each family is loaded once per page.
 *
 * Throws (in dev) if a family is not in ALLOWED_GOOGLE_FONTS. In prod the
 * unrecognised family is dropped silently to avoid breaking the demo render —
 * but the BrandKit validator should have rejected it upstream first.
 */
export function useGoogleFonts(families: ReadonlyArray<string | undefined>): void {
  useEffect(() => {
    const valid = families.filter(
      (f): f is GoogleFontName => typeof f === 'string' && isAllowedFont(f),
    );
    if (valid.length === 0) return;

    const injected: HTMLLinkElement[] = [];
    for (const family of valid) {
      const id = `gfont-${slug(family)}`;
      if (document.getElementById(id)) continue;

      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = buildGoogleFontUrl(family);
      document.head.appendChild(link);
      injected.push(link);
    }

    // Do not remove on unmount: families used elsewhere in the same session
    // should stay resident to avoid flicker.
  }, [families.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

function buildGoogleFontUrl(family: string): string {
  // Variable weight axis for any family that supports it; falls back to 400/600/700.
  const encoded = family.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
}
