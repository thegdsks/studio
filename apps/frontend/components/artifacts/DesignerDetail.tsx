'use client';

/**
 * DesignerDetail — full-page renderer for the Designer artifact.
 *
 * Layout: mockup image at max-h-[420px] object-contain + brand sidebar.
 * Used by DesignerArtifact when variant="detail".
 */

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Label, Mono } from '@studio/ui';
import type { DesignerShape } from './designerTypes';

function PaletteSwatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="h-8 w-8 rounded-md border border-border shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="flex flex-col gap-0.5">
        <Mono className="text-mono-sm text-text">{hex}</Mono>
        <span className="text-label-xs text-text-faint uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

interface Props {
  shape: DesignerShape;
}

export default function DesignerDetail({ shape }: Props): JSX.Element {
  const [imgError, setImgError] = useState(false);
  const { mockupUrl, palette, brandKit: bk, media } = shape;
  const imageUrl = media?.composedUrl ?? mockupUrl;
  const hasMedia = Boolean(imageUrl);
  const hasBanana = Boolean(media?.composedUrl);

  const swatches: { hex: string; label: string }[] = [];
  if (palette) {
    if (palette.primary)   swatches.push({ hex: palette.primary,   label: 'Primary' });
    if (palette.secondary) swatches.push({ hex: palette.secondary, label: 'Secondary' });
    if (palette.accent)    swatches.push({ hex: palette.accent,    label: 'Accent' });
  } else if (bk) {
    if (bk.primary)   swatches.push({ hex: bk.primary,   label: 'Primary' });
    if (bk.secondary) swatches.push({ hex: bk.secondary, label: 'Secondary' });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Mockup image — full bleed, responsive */}
      <div className="flex-1 min-w-0">
        {hasMedia && !imgError ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-surface-sunken">
            <img
              src={imageUrl}
              alt={bk?.name ? `Brand mockup: ${bk.name}` : 'Designer agent brand mockup'}
              loading="eager"
              className="w-full object-contain max-h-[420px]"
              onError={() => setImgError(true)}
            />
            {hasBanana && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 rounded bg-accent-soft border border-border-accent font-mono text-label-xs text-accent leading-none">
                  via Banana
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-sunken gap-3 py-20">
            <ImageOff className="h-8 w-8 text-text-faint" aria-hidden />
            <Mono className="text-mono-sm text-text-faint">Mockup not available</Mono>
          </div>
        )}
      </div>

      {/* Brand sidebar */}
      <aside className="w-full lg:w-60 shrink-0 space-y-6">
        {bk?.name && (
          <div className="space-y-1">
            <Label>Brand name</Label>
            <p
              className="text-headline-lg font-display text-text"
              style={bk.headlineFont ? { fontFamily: bk.headlineFont } : undefined}
            >
              {bk.name}
            </p>
            {bk.tagline && (
              <p className="text-body-sm text-text-muted italic">{bk.tagline}</p>
            )}
          </div>
        )}

        {swatches.length > 0 && (
          <div className="space-y-2">
            <Label>Palette</Label>
            <div className="flex flex-col gap-3">
              {swatches.map((s) => (
                <PaletteSwatch key={s.label} hex={s.hex} label={s.label} />
              ))}
            </div>
          </div>
        )}

        {(bk?.headlineFont ?? bk?.bodyFont) && (
          <div className="space-y-2">
            <Label>Typography</Label>
            <div className="flex flex-col gap-1.5">
              {bk?.headlineFont && (
                <div className="flex items-center gap-2">
                  <Mono className="text-label-xs text-text-faint w-14 shrink-0">Display</Mono>
                  <Mono className="text-mono-sm text-text">{bk.headlineFont}</Mono>
                </div>
              )}
              {bk?.bodyFont && (
                <div className="flex items-center gap-2">
                  <Mono className="text-label-xs text-text-faint w-14 shrink-0">Body</Mono>
                  <Mono className="text-mono-sm text-text">{bk.bodyFont}</Mono>
                </div>
              )}
            </div>
          </div>
        )}

        {media?.backdropUrl && (
          <div className="space-y-2">
            <Label>Backdrop</Label>
            <div className="rounded-md border border-border overflow-hidden">
              <img
                src={media.backdropUrl}
                alt="Brand backdrop"
                className="w-full object-cover max-h-20"
              />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
