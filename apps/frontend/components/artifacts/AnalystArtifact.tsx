'use client';

import { ExternalLink } from 'lucide-react';
import { Label, Mono } from '@studio/ui';
import RawFallback from './RawFallback';

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
  tam?: string;
  defensibility_score?: number;
}

function isAnalyst(a: unknown): a is AnalystShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return Array.isArray(o.competitors);
}

function CompetitorCard({ c }: { c: Competitor }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-body-md font-semibold text-text">{c.name}</p>
        {c.url && (
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-body-sm text-accent hover:underline shrink-0"
            aria-label={`Visit ${c.name}`}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {c.positioning && <p className="text-body-sm text-text-muted">{c.positioning}</p>}
      {c.pricing && <p className="font-mono text-mono-sm text-text-faint">{c.pricing}</p>}
      <div className="flex flex-col gap-1">
        {c.strength && <p className="text-body-sm text-status-done">+ {c.strength}</p>}
        {c.weakness && <p className="text-body-sm text-status-error">- {c.weakness}</p>}
      </div>
    </div>
  );
}

// ─── Card variant ─────────────────────────────────────────────────────────────

function CardView({ competitors, market_gap, recommendation }: AnalystShape) {
  return (
    <div className="space-y-6">
      {market_gap && (
        <div className="rounded-lg border border-border-accent bg-surface p-4 space-y-1">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Market Gap</p>
          <p className="text-body-md text-text">{market_gap}</p>
        </div>
      )}

      {competitors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {competitors.map((c, i) => (
            <CompetitorCard key={i} c={c} />
          ))}
        </div>
      )}

      {recommendation && (
        <div className="rounded-lg border border-border bg-surface-raised p-5 space-y-1">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Our Angle</p>
          <p className="text-body-md text-text">{recommendation}</p>
        </div>
      )}
    </div>
  );
}

// ─── Detail variant ───────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-1">
      <Label>{label}</Label>
      <p className="text-headline-lg font-display text-text">{value}</p>
    </div>
  );
}

function DetailView({ competitors, market_gap, recommendation, tam, defensibility_score }: AnalystShape) {
  const hasStats = tam ?? defensibility_score !== undefined;

  return (
    <div className="space-y-10">
      {/* Stat tiles */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-4">
          {tam && <StatTile label="TAM" value={tam} />}
          {defensibility_score !== undefined && (
            <StatTile label="Defensibility" value={`${defensibility_score}/10`} />
          )}
        </div>
      )}

      {/* Market gap + recommendation side-by-side hero */}
      {(market_gap ?? recommendation) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {market_gap && (
            <div className="rounded-xl border border-border-accent bg-surface p-6 space-y-2">
              <Label>Market gap</Label>
              <p className="text-body-md text-text leading-relaxed">{market_gap}</p>
            </div>
          )}
          {recommendation && (
            <div className="rounded-xl border border-border bg-surface-raised p-6 space-y-2">
              <Label>Our angle</Label>
              <p className="text-body-md text-text leading-relaxed">{recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Competitors in 2-col grid */}
      {competitors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Label>Competitive landscape</Label>
            <Mono className="text-mono-sm text-text-faint">
              {competitors.length} player{competitors.length !== 1 ? 's' : ''}
            </Mono>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {competitors.map((c, i) => (
              <CompetitorCard key={i} c={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function AnalystArtifact({ artifact, variant = 'card' }: Props): JSX.Element {
  if (!isAnalyst(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  if (variant === 'detail') {
    return <DetailView {...artifact} />;
  }

  return <CardView {...artifact} />;
}
