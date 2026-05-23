'use client';

import { Download, Copy, ExternalLink } from 'lucide-react';
import AnalystArtifact from '@/components/artifacts/AnalystArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadCSV, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface Competitor {
  name: string;
  url?: string;
  positioning?: string;
  pricing?: string;
  strength?: string;
  weakness?: string;
}

interface AnalystShape {
  competitors: Competitor[];
  market_gap?: string;
  recommendation?: string;
}

function isAnalyst(a: unknown): a is AnalystShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return Array.isArray(o.competitors);
}

function isCompetitor(x: unknown): x is Competitor {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === 'string';
}

interface GridPoint {
  name: string;
  isYou: boolean;
  px: number; // 0-100
  py: number; // 0-100
}

function PositioningGrid({
  competitors,
  recommendation,
}: {
  competitors: Competitor[];
  recommendation?: string;
}) {
  // Place competitors in bottom quadrants, "You" in top-right (the white space)
  const SLOTS = [
    { px: 22, py: 72 },
    { px: 70, py: 78 },
    { px: 28, py: 58 },
    { px: 65, py: 60 },
    { px: 18, py: 85 },
    { px: 72, py: 88 },
  ];

  const points: GridPoint[] = competitors.slice(0, SLOTS.length).map((c, i) => {
    const slot = SLOTS[i] ?? { px: 30, py: 70 };
    return {
      name: c.name,
      isYou: false,
      px: slot.px,
      py: slot.py,
    };
  });

  // "You" always in top-right (high price, high AI) white space
  points.push({ name: 'You', isYou: true, px: 74, py: 22 });

  return (
    <section className="space-y-4">
      <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
        Positioning Grid
      </p>
      <div className="relative w-full max-w-sm mx-auto aspect-square border border-border rounded-lg bg-surface overflow-hidden select-none">
        {/* Axis dividers */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />

        {/* Axis labels */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-mono-xs text-text-faint">
          High AI
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-mono-xs text-text-faint">
          Low AI
        </span>
        <span className="absolute left-2 top-1/2 font-mono text-mono-xs text-text-faint"
          style={{ transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center' }}>
          Low price
        </span>
        <span className="absolute right-2 top-1/2 font-mono text-mono-xs text-text-faint"
          style={{ transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'center' }}>
          High price
        </span>

        {/* Points */}
        {points.map((pt) => (
          <div
            key={pt.name}
            className="absolute flex flex-col items-center"
            style={{ left: `${pt.px}%`, top: `${pt.py}%`, transform: 'translate(-50%, -50%)' }}
          >
            {pt.isYou ? (
              <svg width="14" height="14" viewBox="0 0 14 14" className="fill-accent">
                <polygon points="7,1 8.8,5.5 13.5,5.5 9.8,8.3 11.1,13 7,10.2 2.9,13 4.2,8.3 0.5,5.5 5.2,5.5" />
              </svg>
            ) : (
              <div className="h-3 w-3 rounded-full bg-text-muted border-2 border-surface" />
            )}
            <span
              className={`font-mono text-mono-xs mt-0.5 whitespace-nowrap ${
                pt.isYou ? 'text-accent font-medium' : 'text-text-faint'
              }`}
            >
              {pt.name}
            </span>
          </div>
        ))}
      </div>

      {recommendation && (
        <div className="rounded-lg border border-border-accent bg-surface-raised p-4 space-y-1">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Your angle</p>
          <p className="text-body-md text-text">{recommendation}</p>
        </div>
      )}
    </section>
  );
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function AnalystDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isAnalyst(art) ? art : null;
  const competitors = data?.competitors.filter(isCompetitor) ?? [];

  const buttons: ActionButton[] = [
    {
      label: 'Download matrix as CSV',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!competitors.length) return;
        downloadCSV(
          'competitor-matrix.csv',
          competitors.map((c) => ({
            name: c.name,
            url: c.url ?? '',
            positioning: c.positioning ?? '',
            pricing: c.pricing ?? '',
            strength: c.strength ?? '',
            weakness: c.weakness ?? '',
          })),
        );
      },
    },
    ...(data?.market_gap
      ? [
          {
            label: 'Copy market gap one-liner',
            icon: Copy,
            onClick: () => void copyToClipboard(data.market_gap ?? ''),
          } satisfies ActionButton,
        ]
      : []),
    {
      label: 'Open all competitor URLs',
      icon: ExternalLink,
      onClick: () => {
        competitors.forEach((c) => {
          if (c.url) window.open(c.url, '_blank', 'noopener,noreferrer');
        });
      },
    },
  ];

  const nextSteps = [
    'Pick 1 competitor to deeply analyze.',
    'Reach out to 3 of their churned customers.',
    "Write a 'why we're different' page using these weaknesses.",
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        <AnalystArtifact artifact={art} />
        {competitors.length > 0 && (
          <PositioningGrid competitors={competitors} recommendation={data?.recommendation} />
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
