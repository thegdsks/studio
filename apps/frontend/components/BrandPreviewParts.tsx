'use client';

/**
 * BrandPreviewParts — sub-components and helpers used by BrandPreview.
 * Extracted to keep BrandPreview.tsx under the 250-line limit.
 */

import { Mono, Label, assertValidBrandKit } from '@studio/ui';
import type { BrandKit } from '@studio/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtifactShape {
  palette?: { primary?: string; secondary?: string; accent?: string };
  media?: { composedUrl?: string; backdropUrl?: string };
  mockupUrl?: string;
}

export type ExtractResult = { ok: true; value: BrandKit } | { ok: false };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractBrandKit(artifact: unknown): ExtractResult {
  if (typeof artifact !== 'object' || artifact === null) return { ok: false };
  const obj = artifact as Record<string, unknown>;
  const kit = obj.brandKit ?? obj.brand ?? obj;
  try {
    assertValidBrandKit(kit);
    return { ok: true, value: kit };
  } catch {
    return { ok: false };
  }
}

export function extractMockupUrl(artifact: unknown): string | null {
  if (typeof artifact !== 'object' || artifact === null) return null;
  const obj = artifact as ArtifactShape;
  return obj.media?.composedUrl ?? (typeof obj.mockupUrl === 'string' ? obj.mockupUrl : null);
}

export function hasBananaMedia(artifact: unknown): boolean {
  if (typeof artifact !== 'object' || artifact === null) return false;
  const obj = artifact as ArtifactShape;
  return Boolean(obj.media?.composedUrl);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function HeroSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-8 w-8 rounded-full border border-border shadow-elev-1"
        style={{ backgroundColor: color }}
      />
      <Mono className="text-[10px] text-text-faint">{color}</Mono>
      <Mono className="text-[9px] text-text-faint uppercase tracking-wider">{label}</Mono>
    </div>
  );
}

export function FontPairingCard({
  headlineFont,
  bodyFont,
}: {
  headlineFont: string;
  bodyFont: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <Label>Type pairing</Label>
      <div className="space-y-2">
        <div>
          <Mono className="text-[9.5px] text-text-faint uppercase tracking-wider mb-1">
            Headline · {headlineFont}
          </Mono>
          <p
            className="text-headline-md text-text leading-tight"
            style={{ fontFamily: headlineFont }}
          >
            Aa Bb Cc
          </p>
        </div>
        <div>
          <Mono className="text-[9.5px] text-text-faint uppercase tracking-wider mb-1">
            Body · {bodyFont}
          </Mono>
          <p
            className="text-body-md text-text-muted"
            style={{ fontFamily: bodyFont }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </div>
  );
}
