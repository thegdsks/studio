'use client';

/**
 * DesignerArtifact — grid card renderer for the Designer agent.
 *
 * Layout within 220px card height:
 *   - Top 60 %: composed mockup image (shimmer skeleton while absent)
 *   - Bottom 40 %: brand name + 3 round palette swatches + font chip + "via Banana" pill
 *
 * Fail-loud: non-matching shapes fall through to RawFallback.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { Mono, fadeIn, withReducedMotion, usePrefersReducedMotion } from '@studio/ui';
import RawFallback from './RawFallback';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

interface BrandKit {
  name?: string;
  tagline?: string;
  primary?: string;
  secondary?: string;
  headlineFont?: string;
  bodyFont?: string;
}

interface Media {
  backdropUrl?: string;
  composedUrl?: string;
}

interface DesignerShape {
  mockupUrl?: string;
  palette?: Palette;
  brandKit?: BrandKit;
  media?: Media;
}

function isDesigner(a: unknown): a is DesignerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return 'mockupUrl' in o || 'palette' in o || 'brandKit' in o || 'media' in o;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaletteSwatch({ hex }: { hex: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 rounded-full border border-border shrink-0"
      style={{ backgroundColor: hex }}
    />
  );
}

function ImageSkeleton({ generating }: { generating: boolean }) {
  return (
    <div className="relative w-full h-full bg-surface-sunken flex flex-col items-center justify-center gap-2 overflow-hidden">
      {/* framer-motion shimmer sweep — no CSS keyframes per STYLE.md */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--color-surface-raised) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
      />
      <ImageOff className="relative h-4 w-4 text-text-faint" aria-hidden />
      {generating && (
        <Mono className="relative text-[10px] text-text-faint">
          generating brand mockup…
        </Mono>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  artifact: unknown;
}

export default function DesignerArtifact({ artifact }: Props): JSX.Element {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  if (!isDesigner(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { mockupUrl, palette, brandKit: bk, media } = artifact;
  const imageUrl = media?.composedUrl ?? mockupUrl;
  const hasMedia = Boolean(imageUrl);
  const hasBanana = Boolean(media?.composedUrl);

  // Font pairing chip text (e.g. "Space Grotesk · Inter")
  const fontChip =
    bk?.headlineFont && bk?.bodyFont
      ? `${bk.headlineFont} · ${bk.bodyFont}`
      : bk?.headlineFont ?? null;

  // Build up to 3 swatches from palette (or fall back to brandKit colors)
  const swatches: string[] = [];
  if (palette) {
    if (palette.primary) swatches.push(palette.primary);
    if (palette.secondary) swatches.push(palette.secondary);
    if (palette.accent) swatches.push(palette.accent);
  } else {
    if (bk?.primary) swatches.push(bk.primary);
    if (bk?.secondary) swatches.push(bk.secondary);
  }

  const imageVariants = withReducedMotion(fadeIn, reducedMotion);

  return (
    <div
      className="flex flex-col w-full"
      // pull to card edges — CardBody has horizontal padding
      style={{ margin: '-4px -16px -12px' }}
    >
      {/* ── Top 60 %: mockup image ──────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '96px' }}>
        {hasMedia && !imgError ? (
          <>
            {!imgLoaded && <ImageSkeleton generating={false} />}
            <motion.img
              src={imageUrl}
              alt="Brand mockup"
              className="absolute inset-0 w-full h-full object-cover"
              variants={imageVariants}
              initial="hidden"
              animate={imgLoaded ? 'visible' : 'hidden'}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <ImageSkeleton generating={!hasMedia} />
        )}
      </div>

      {/* ── Bottom 40 %: brand info ─────────────────────────────────── */}
      <div className="flex flex-col justify-between px-4 pb-2 pt-2 gap-1" style={{ minHeight: '64px' }}>
        {/* Row 1: brand name + round palette swatches */}
        <div className="flex items-center gap-2 min-w-0">
          {bk?.name ? (
            <span
              className="text-title-md text-text truncate"
              style={bk.headlineFont ? { fontFamily: bk.headlineFont } : undefined}
            >
              {bk.name}
            </span>
          ) : (
            <span className="text-title-md text-text-faint italic truncate">Brand name</span>
          )}
          {swatches.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {swatches.slice(0, 3).map((hex) => (
                <PaletteSwatch key={hex} hex={hex} />
              ))}
            </div>
          )}
        </div>

        {/* Row 2: font pairing chip + via-Banana pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {fontChip && (
            <Mono className="text-[10px] text-text-faint truncate max-w-[140px]">
              {fontChip}
            </Mono>
          )}
          {hasBanana && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-soft border border-border-accent font-mono text-[9.5px] text-accent shrink-0 leading-none">
              via Banana
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
