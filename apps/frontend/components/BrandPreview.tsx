'use client';

/**
 * BrandPreview — full-width brand display inside FinalKitModal.
 *
 * If the artifact has no brandKit, renders nothing (fail-loud: no invented defaults).
 *
 * Two sections:
 *   1. Hero block — composed mockup image with "via Banana" overlay chip.
 *   2. Brand strip — name, tagline, palette swatches, font pairing, logo.
 *      + Download mockup / Copy palette action buttons.
 *
 * Brand-kit hex values are runtime data — inline style is the correct pattern
 * for dynamic colors (per STYLE.md note on style={} exceptions).
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check } from 'lucide-react';
import {
  BrandThemeScope,
  Chip,
  Heading,
  Label,
  Button,
  contrastRatio,
  fadeUp,
  slideUpPanel,
  withReducedMotion,
  usePrefersReducedMotion,
} from '@studio/ui';
import type { BrandKit } from '@studio/ui';
import { useBrandKitPersistence } from '@/lib/useBrandKitPersistence';
import { BrandFontPicker } from './BrandFontPicker';
import {
  extractBrandKit,
  extractMockupUrl,
  hasBananaMedia,
  HeroSwatch,
  FontPairingCard,
  type ArtifactShape,
} from './BrandPreviewParts';

interface BrandPreviewProps {
  artifact: unknown;
  runId?: string;
}

export function BrandPreview({ artifact, runId }: BrandPreviewProps) {
  const baseKit = useMemo(() => extractBrandKit(artifact), [artifact]);
  const baseKitValue = baseKit.ok ? baseKit.value : null;
  const mockupUrl = useMemo(() => extractMockupUrl(artifact), [artifact]);
  const withBanana = useMemo(() => hasBananaMedia(artifact), [artifact]);

  const [overrides, setOverrides] = useBrandKitPersistence(runId, baseKitValue);
  const [palettesCopied, setPalettesCopied] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  if (!baseKit.ok || !baseKitValue) return null;

  const kit: BrandKit = {
    ...baseKitValue,
    ...(overrides.headlineFont ? { headlineFont: overrides.headlineFont } : {}),
    ...(overrides.bodyFont ? { bodyFont: overrides.bodyFont } : {}),
  };

  const surface = kit.surface ?? '#0B0D14';
  const contrast = contrastRatio(kit.primary, surface);
  const lowContrast = contrast < 3.5;

  // Build swatches from artifact palette fields, falling back to kit
  const artifactPal = (artifact as ArtifactShape).palette;
  const swatches: { color: string; label: string }[] = [];
  swatches.push({ color: artifactPal?.primary ?? kit.primary, label: 'Primary' });
  const sec = artifactPal?.secondary ?? kit.secondary;
  if (sec) swatches.push({ color: sec, label: 'Secondary' });
  if (artifactPal?.accent) swatches.push({ color: artifactPal.accent, label: 'Accent' });

  function handleDownload() {
    if (!mockupUrl) return;
    const anchor = document.createElement('a');
    anchor.href = mockupUrl;
    anchor.download = `${kit.name.toLowerCase().replace(/\s+/g, '-')}-mockup.svg`;
    anchor.click();
  }

  function handleCopyPalette() {
    const data = swatches.reduce<Record<string, string>>(
      (acc, s) => ({ ...acc, [s.label.toLowerCase()]: s.color }),
      {},
    );
    void navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setPalettesCopied(true);
      setTimeout(() => setPalettesCopied(false), 2000);
    });
  }

  const heroVariants = withReducedMotion(fadeUp, reducedMotion);
  const stripVariants = withReducedMotion(slideUpPanel, reducedMotion);

  return (
    <section className="space-y-4">
      {/* ── Section header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Label>Brand kit</Label>
        <Heading level="headline-md" as="h3">{kit.name}</Heading>
        {lowContrast && (
          <Chip tone="error">low contrast {contrast.toFixed(1)}:1</Chip>
        )}
      </div>

      {/* ── Hero: composed mockup image ─────────────────────────────── */}
      {mockupUrl && (
        <motion.div
          className="relative rounded-xl overflow-hidden border border-border-accent shadow-glow-accent"
          style={{ height: '440px' }}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <img
            src={mockupUrl}
            alt={`${kit.name} brand mockup`}
            className="w-full h-full object-cover"
          />
          {withBanana && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded bg-accent-soft border border-border-accent font-mono text-[10px] text-accent leading-none">
                via Banana
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Brand strip ─────────────────────────────────────────────── */}
      <motion.div variants={stripVariants} initial="hidden" animate="visible">
        <BrandThemeScope brand={kit} className="rounded-xl border border-border overflow-hidden">
          <div
            className="p-8 space-y-6"
            style={{ backgroundColor: 'var(--brand-surface)', color: 'var(--brand-primary)' }}
          >
            {/* Logo + name + tagline */}
            <div className="flex items-start gap-4">
              {kit.logoSvg ? (
                <span
                  aria-label="logo"
                  className="inline-block shrink-0"
                  dangerouslySetInnerHTML={{ __html: kit.logoSvg }}
                />
              ) : kit.logoUrl ? (
                <img src={kit.logoUrl} alt="" className="h-12 w-auto shrink-0" />
              ) : null}
              <div className="space-y-1">
                <h2 style={{ fontFamily: 'var(--brand-font-headline)', fontWeight: 700, fontSize: '36px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                  {kit.name}
                </h2>
                {kit.tagline && (
                  <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '15px', lineHeight: 1.55, opacity: 0.75 }}>
                    {kit.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Palette swatches */}
            {swatches.length > 0 && (
              <div className="flex flex-wrap gap-6">
                {swatches.map((s) => (
                  <HeroSwatch key={s.label} color={s.color} label={s.label} />
                ))}
              </div>
            )}

            {/* Font pairing card */}
            {kit.headlineFont && kit.bodyFont && (
              <FontPairingCard headlineFont={kit.headlineFont} bodyFont={kit.bodyFont} />
            )}
          </div>
        </BrandThemeScope>
      </motion.div>

      {/* ── Action buttons ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {mockupUrl && (
          <Button variant="secondary" size="sm" iconLeft={<Download className="h-4 w-4" />} onClick={handleDownload}>
            Download mockup
          </Button>
        )}
        {swatches.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={palettesCopied ? <Check className="h-4 w-4 text-status-done" /> : <Copy className="h-4 w-4" />}
            onClick={handleCopyPalette}
          >
            {palettesCopied ? 'Copied!' : 'Copy palette'}
          </Button>
        )}
      </div>

      {/* ── Font overrides picker ────────────────────────────────────── */}
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
