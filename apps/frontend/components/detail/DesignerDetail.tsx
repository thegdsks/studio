'use client';

import { useState } from 'react';
import { Download, Copy, ExternalLink } from 'lucide-react';
import DesignerArtifact from '@/components/artifacts/DesignerArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadMarkdown, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

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
  logoUrl?: string;
  logoVariants?: string[];
  palette?: Palette;
  brandKit?: BrandKit;
  exportedCode?: string;
}

function isDesigner(a: unknown): a is DesignerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    'mockupUrl' in o || 'logoUrl' in o || 'logoVariants' in o || 'palette' in o || 'brandKit' in o
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '';
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '';
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function SwatchCard({ hex, label }: { hex: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void copyToClipboard(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={handleCopy}
        className="w-full h-20 transition-opacity hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: hex }}
        aria-label={`Copy ${hex}`}
      />
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">{label}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="font-mono text-mono-sm text-text-faint hover:text-text transition-colors duration-micro"
          >
            {copied ? 'Copied' : 'Copy hex'}
          </button>
        </div>
        <p className="font-mono text-mono-sm text-text">{hex}</p>
        {rgb && <p className="font-mono text-mono-xs text-text-faint">{rgb}</p>}
        {hsl && <p className="font-mono text-mono-xs text-text-faint">{hsl}</p>}
      </div>
    </div>
  );
}

function buildBrandMarkdown(data: DesignerShape): string {
  const lines = ['# Brand Kit', ''];
  if (data.palette) {
    lines.push('## Palette');
    if (data.palette.primary) lines.push(`- Primary: ${data.palette.primary}`);
    if (data.palette.secondary) lines.push(`- Secondary: ${data.palette.secondary}`);
    if (data.palette.accent) lines.push(`- Accent: ${data.palette.accent}`);
    lines.push('');
  }
  if (data.brandKit?.headlineFont) {
    lines.push('## Typography');
    lines.push(`- Headline: ${data.brandKit.headlineFont}`);
    if (data.brandKit.bodyFont) lines.push(`- Body: ${data.brandKit.bodyFont}`);
    lines.push('');
  }
  if (data.logoUrl) lines.push(`## Logo\n${data.logoUrl}`);
  if (data.mockupUrl) lines.push(`\n## Mockup\n${data.mockupUrl}`);
  return lines.join('\n');
}

function buildTailwindConfig(palette?: Palette, bk?: BrandKit): string {
  const primary = palette?.primary ?? bk?.primary ?? '';
  const accent = palette?.accent ?? bk?.accent ?? '';
  return `colors: {\n  primary: '${primary}',\n  accent: '${accent}',\n}`;
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function DesignerDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isDesigner(art) ? art : null;

  const swatches: { hex: string; label: string }[] = [];
  if (data?.palette) {
    if (data.palette.primary) swatches.push({ hex: data.palette.primary, label: 'Primary' });
    if (data.palette.secondary) swatches.push({ hex: data.palette.secondary, label: 'Secondary' });
    if (data.palette.accent) swatches.push({ hex: data.palette.accent, label: 'Accent' });
  } else if (data?.brandKit) {
    if (data.brandKit.primary) swatches.push({ hex: data.brandKit.primary, label: 'Primary' });
    if (data.brandKit.accent) swatches.push({ hex: data.brandKit.accent, label: 'Accent' });
  }

  const logoUrl = data?.logoUrl ?? data?.logoVariants?.[0];

  const buttons: ActionButton[] = [
    {
      label: 'Download brand kit as Markdown',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!data) return;
        downloadMarkdown('brand-kit.md', buildBrandMarkdown(data));
      },
    },
    {
      label: 'Copy palette as Tailwind config',
      icon: Copy,
      onClick: () => {
        if (!data) return;
        void copyToClipboard(buildTailwindConfig(data.palette, data.brandKit));
      },
    },
    ...(logoUrl
      ? [
          {
            label: 'Open logo in new tab',
            icon: ExternalLink,
            onClick: () => window.open(logoUrl, '_blank', 'noopener,noreferrer'),
          } satisfies ActionButton,
        ]
      : []),
  ];

  const nextSteps = [
    'Test logo at small sizes (favicon).',
    'Check colors meet WCAG AA contrast.',
    'Order a t-shirt with the logo on teepublic.com.',
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        <DesignerArtifact artifact={art} />

        {swatches.length > 0 && (
          <section className="space-y-4">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Palette Explorer
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {swatches.map((s) => (
                <SwatchCard key={s.label} hex={s.hex} label={s.label} />
              ))}
            </div>
          </section>
        )}

        {data?.brandKit && (data.brandKit.headlineFont || data.brandKit.bodyFont) && (
          <section className="space-y-4">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Typography Sample
            </p>
            <div className="rounded-lg border border-border bg-surface p-6 space-y-3">
              {data.brandKit.headlineFont && (
                <p
                  className="text-display-sm text-text leading-tight"
                  style={{ fontFamily: data.brandKit.headlineFont }}
                >
                  {data.brandKit.name ?? 'Your Brand'}: Built for what matters.
                </p>
              )}
              {data.brandKit.bodyFont && (
                <p
                  className="text-body-md text-text-muted leading-relaxed"
                  style={{ fontFamily: data.brandKit.bodyFont }}
                >
                  We help ambitious founders ship faster, look credible, and grow with confidence.
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
