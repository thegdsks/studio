'use client';

import { useState } from 'react';
import RawFallback from './RawFallback';

interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

interface BrandKit {
  name?: string;
  vibe?: string;
  primary?: string;
  accent?: string;
  headlineFont?: string;
  bodyFont?: string;
}

interface DesignerShape {
  mockupUrl?: string;
  exportedCode?: string;
  logoUrl?: string;
  logoVariants?: string[];
  palette?: Palette;
  brandKit?: BrandKit;
}

function isDesigner(a: unknown): a is DesignerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    'mockupUrl' in o ||
    'logoUrl' in o ||
    'logoVariants' in o ||
    'palette' in o ||
    'brandKit' in o ||
    'exportedCode' in o
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-10 w-10 rounded-md border border-border shadow-sm"
        style={{ backgroundColor: hex }}
        title={hex}
      />
      <span className="font-mono text-mono-sm text-text-faint">{hex}</span>
      <span className="text-label-sm text-text-muted">{label}</span>
    </div>
  );
}

interface Props {
  artifact: unknown;
}

export default function DesignerArtifact({ artifact }: Props): JSX.Element {
  const [imgError, setImgError] = useState(false);

  if (!isDesigner(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { mockupUrl, logoUrl, logoVariants, palette, brandKit } = artifact;
  const primaryLogo = logoUrl ?? logoVariants?.[0];
  const bk = brandKit;

  const swatches: { hex: string; label: string }[] = [];
  if (palette) {
    if (palette.primary) swatches.push({ hex: palette.primary, label: 'Primary' });
    if (palette.secondary) swatches.push({ hex: palette.secondary, label: 'Secondary' });
    if (palette.accent) swatches.push({ hex: palette.accent, label: 'Accent' });
  } else if (bk) {
    if (bk.primary) swatches.push({ hex: bk.primary, label: 'Primary' });
    if (bk.accent) swatches.push({ hex: bk.accent, label: 'Accent' });
  }

  return (
    <div className="space-y-6">
      {primaryLogo && !imgError && (
        <div className="flex items-center justify-center bg-surface-raised rounded-lg border border-border p-6">
          <img
            src={primaryLogo}
            alt="Brand logo"
            className="max-h-24 object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      {(!primaryLogo || imgError) && (
        <div className="flex items-center justify-center bg-surface-raised rounded-lg border border-border p-6 h-24">
          <span className="text-body-sm text-text-faint italic">Logo preview unavailable</span>
        </div>
      )}

      {swatches.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {swatches.map((s) => (
            <Swatch key={s.label} hex={s.hex} label={s.label} />
          ))}
        </div>
      )}

      {bk && (bk.headlineFont || bk.bodyFont) && (
        <div className="space-y-2 border border-border rounded-lg p-4 bg-surface">
          {bk.headlineFont && (
            <p
              className="text-headline-md text-text"
              style={{ fontFamily: bk.headlineFont }}
            >
              {bk.name ?? 'Your Brand'} Headline
            </p>
          )}
          {bk.bodyFont && (
            <p
              className="text-body-md text-text-muted"
              style={{ fontFamily: bk.bodyFont }}
            >
              Body copy set in {bk.bodyFont}.
            </p>
          )}
          {bk.vibe && (
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Vibe: {bk.vibe}
            </p>
          )}
        </div>
      )}

      {mockupUrl && (
        <div className="border border-border rounded-lg overflow-hidden">
          <img
            src={mockupUrl}
            alt="Site mockup"
            className="w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
