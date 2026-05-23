'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { assertValidBrandKit, contrastRatio, type BrandKit } from './BrandKit.js';
import { useGoogleFonts } from './useGoogleFonts.js';

interface BrandThemeScopeProps {
  brand: BrandKit;
  /** Optional `data-` attribute hook for tests. */
  testId?: string;
  /** Class applied to the wrapping div. Useful for radius / padding context. */
  className?: string;
  children: ReactNode;
}

/**
 * Scopes brand colors + fonts to a subtree via CSS variables, without
 * polluting the parent app theme. Loads Google Fonts at runtime, validated
 * against the allow-list. Throws if the brand kit is malformed.
 *
 * Inside the scope:
 *   color:               var(--brand-primary)   /* default surface text *\/
 *   font-family:         var(--brand-font-body) | var(--brand-font-headline)
 *   background-color:    var(--brand-surface)
 */
export function BrandThemeScope({ brand, testId, className, children }: BrandThemeScopeProps) {
  assertValidBrandKit(brand);
  useGoogleFonts([brand.headlineFont, brand.bodyFont]);

  const style = useMemo<CSSProperties>(() => {
    const surface = brand.surface ?? '#0B0D14';
    const primaryOnSurface = contrastRatio(brand.primary, surface);
    if (primaryOnSurface < 3.5) {
      // Loud, not silent: a low-contrast brand on the preview is a demo bug.
      // The caller (FinalKitModal) renders a warning chip when this is true.
      // Keep going — DO NOT auto-correct the AI's choice.
      // eslint-disable-next-line no-console
      console.warn(
        `[BrandThemeScope] low contrast: primary ${brand.primary} on surface ${surface} = ${primaryOnSurface.toFixed(2)}:1`,
      );
    }
    const css: Record<string, string> = {
      '--brand-primary': brand.primary,
      '--brand-secondary': brand.secondary ?? brand.primary,
      '--brand-surface': surface,
      '--brand-font-headline': `'${brand.headlineFont}', system-ui, sans-serif`,
      '--brand-font-body': `'${brand.bodyFont}', system-ui, sans-serif`,
    };
    return css as CSSProperties;
  }, [brand]);

  return (
    <div data-brand={brand.name} data-testid={testId} className={className} style={style}>
      {children}
    </div>
  );
}
