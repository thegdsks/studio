'use client';

/**
 * Renders a themed brand preview from the Designer agent's artifact.
 *
 * Contract (strict on shape):
 *   { brandKit: { name, primary, secondary?, headlineFont, bodyFont, logoSvg?, logoUrl? } }
 *
 * If the artifact lacks a brandKit, render nothing — never invent placeholder
 * colors or fonts (per CLAUDE.md "no fallbacks").
 *
 * If `runId` is provided, font overrides are persisted to localStorage and the
 * font-swap picker is rendered below the preview.
 */

import { useMemo } from 'react';
import { BrandThemeScope, Chip, Heading, Label, assertValidBrandKit, contrastRatio } from '@studio/ui';
import type { BrandKit } from '@studio/ui';
import { useBrandKitPersistence } from '@/lib/useBrandKitPersistence';
import { BrandFontPicker } from './BrandFontPicker';

interface BrandPreviewProps {
  artifact: unknown;
  runId?: string;
}

export function BrandPreview({ artifact, runId }: BrandPreviewProps) {
  const baseKit = useMemo(() => extractBrandKit(artifact), [artifact]);
  const baseKitValue = baseKit.ok ? baseKit.value : null;

  const [overrides, setOverrides] = useBrandKitPersistence(runId, baseKitValue);

  if (!baseKit.ok || !baseKitValue) return null;

  // Merge persisted font overrides onto the artifact's kit
  const kit: BrandKit = {
    ...baseKitValue,
    ...(overrides.headlineFont ? { headlineFont: overrides.headlineFont } : {}),
    ...(overrides.bodyFont ? { bodyFont: overrides.bodyFont } : {}),
  };

  const surface = kit.surface ?? '#0B0D14';
  const contrast = contrastRatio(kit.primary, surface);
  const lowContrast = contrast < 3.5;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <Label>Brand kit</Label>
        <Heading level="headline-md" as="h3">
          {kit.name}
        </Heading>
        {lowContrast && (
          <Chip tone="error">low contrast {contrast.toFixed(1)}:1</Chip>
        )}
      </div>

      <BrandThemeScope brand={kit} className="rounded-xl border border-border overflow-hidden">
        <div
          className="p-8 flex flex-col gap-5"
          style={{
            backgroundColor: 'var(--brand-surface)',
            color: 'var(--brand-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            {kit.logoSvg ? (
              <span
                aria-label="logo"
                className="inline-block"
                dangerouslySetInnerHTML={{ __html: kit.logoSvg }}
              />
            ) : kit.logoUrl ? (
              <img src={kit.logoUrl} alt="" className="h-10 w-auto" />
            ) : null}
            <h2
              style={{
                fontFamily: 'var(--brand-font-headline)',
                fontWeight: 700,
                fontSize: '32px',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {kit.name}
            </h2>
          </div>

          {kit.tagline && (
            <p
              style={{
                fontFamily: 'var(--brand-font-body)',
                fontSize: '16px',
                lineHeight: 1.55,
                opacity: 0.85,
              }}
            >
              {kit.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Swatch color={kit.primary} label="primary" />
            <Swatch color={kit.secondary ?? kit.primary} label="secondary" />
            <Swatch color={surface} label="surface" />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#fff',
                fontFamily: 'var(--brand-font-body)',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Get started
            </button>
            <button
              type="button"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--brand-primary)',
                border: '1px solid var(--brand-primary)',
                fontFamily: 'var(--brand-font-body)',
                padding: '9px 18px',
                borderRadius: 10,
                fontWeight: 500,
              }}
            >
              Learn more
            </button>
          </div>
        </div>
      </BrandThemeScope>

      {runId && (
        <BrandFontPicker
          headlineFont={baseKitValue.headlineFont}
          bodyFont={baseKitValue.bodyFont}
          overrides={overrides}
          onChange={setOverrides}
        />
      )}
    </section>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-5 w-5 rounded border border-border"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-mono-sm" style={{ color: 'var(--brand-primary)', opacity: 0.85 }}>
        {label} · {color}
      </span>
    </div>
  );
}

type Extract =
  | { ok: true; value: BrandKit }
  | { ok: false };

function extractBrandKit(artifact: unknown): Extract {
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
