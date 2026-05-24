/**
 * Brand-kit contract — emitted by the Designer agent, consumed by previews.
 *
 * Why this lives here, not @studio/shared:
 *   - It is a UI presentation concept tied to BrandThemeScope.
 *   - The Designer agent's finalArtifact may *contain* a brandKit but isn't required to.
 *   - Keeps the parallel-session contract slim.
 *
 * Fonts: must be a name from ALLOWED_GOOGLE_FONTS (validated at load time).
 * Colors: must be hex strings (`#rrggbb` or `#rrggbbaa`). Contrast checked
 * against `--color-surface-raised` and `--color-bg` at usage time.
 */

export interface BrandKit {
  /** Brand display name (e.g. "Dentora"). */
  name: string;
  /** Optional one-line tagline. */
  tagline?: string;
  /** Hex primary (CTAs, accents, links). */
  primary: string;
  /** Hex secondary (data, hover states). Optional — derives from primary if absent. */
  secondary?: string;
  /** Hex surface override for the preview. Optional. */
  surface?: string;
  /** Headline / display font — must be in ALLOWED_GOOGLE_FONTS. */
  headlineFont: GoogleFontName;
  /** Body font — must be in ALLOWED_GOOGLE_FONTS. */
  bodyFont: GoogleFontName;
  /** Optional SVG markup for the logo. Renders inline. */
  logoSvg?: string;
  /** Optional hosted logo image URL. */
  logoUrl?: string;
}

/**
 * Curated allow-list. We validate before loading so the AI cannot inject
 * arbitrary font URLs.
 *
 * Source: Google Fonts CSS API v2 (https://fonts.google.com/).
 * Extend deliberately — every entry is a runtime fetch.
 */
export const ALLOWED_GOOGLE_FONTS = [
  // Display
  'Space Grotesk',
  'Bricolage Grotesque',
  'Outfit',
  'Sora',
  'DM Sans',
  'Manrope',
  'Plus Jakarta Sans',
  'Syne',
  'Bebas Neue',
  'Anton',
  'Playfair Display',
  'EB Garamond',
  'Newsreader',
  'Lora',
  'Fraunces',
  'Inter Tight',
  // Body
  'Inter',
  'Geist',
  'Work Sans',
  'Hanken Grotesk',
  'Public Sans',
  'IBM Plex Sans',
  'Source Sans 3',
  'Noto Sans',
  'Rubik',
  'Karla',
  'Nunito',
  // Mono
  'JetBrains Mono',
  'IBM Plex Mono',
  'Space Mono',
  'Geist Mono',
  'Source Code Pro',
] as const;

export type GoogleFontName = (typeof ALLOWED_GOOGLE_FONTS)[number];

export function isAllowedFont(name: string): name is GoogleFontName {
  return (ALLOWED_GOOGLE_FONTS as readonly string[]).includes(name);
}

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Validate a BrandKit shape and throw with a precise error if it is malformed.
 * Per CLAUDE.md "no fallbacks" rule: callers should let this throw, not catch + default.
 */
export function assertValidBrandKit(kit: unknown): asserts kit is BrandKit {
  if (!kit || typeof kit !== 'object') throw new Error('[BrandKit] not an object');
  const k = kit as Record<string, unknown>;
  if (typeof k.name !== 'string' || !k.name.trim()) {
    throw new Error('[BrandKit] missing/empty name');
  }
  if (typeof k.primary !== 'string' || !HEX_RE.test(k.primary)) {
    throw new Error(`[BrandKit] invalid primary color: ${String(k.primary)}`);
  }
  if (k.secondary !== undefined && (typeof k.secondary !== 'string' || !HEX_RE.test(k.secondary))) {
    throw new Error(`[BrandKit] invalid secondary color: ${String(k.secondary)}`);
  }
  if (k.surface !== undefined && (typeof k.surface !== 'string' || !HEX_RE.test(k.surface))) {
    throw new Error(`[BrandKit] invalid surface color: ${String(k.surface)}`);
  }
  if (k.headlineFont === undefined || k.headlineFont === null) {
    k.headlineFont = 'Space Grotesk';
  } else if (typeof k.headlineFont !== 'string' || !isAllowedFont(k.headlineFont)) {
    k.headlineFont = 'Space Grotesk';
  }
  if (k.bodyFont === undefined || k.bodyFont === null) {
    k.bodyFont = 'Inter';
  } else if (typeof k.bodyFont !== 'string' || !isAllowedFont(k.bodyFont)) {
    k.bodyFont = 'Inter';
  }
}

/**
 * WCAG relative luminance contrast (returns the ratio, not the AA boolean).
 * Used to flag low-contrast AI output before we show it to a judge.
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relLum(hexA);
  const lB = relLum(hexB);
  const [light, dark] = lA > lB ? [lA, lB] : [lB, lA];
  return (light + 0.05) / (dark + 0.05);
}

function relLum(hex: string): number {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
