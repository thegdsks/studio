'use client';

import { ExternalLink } from 'lucide-react';
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
}

function isAnalyst(a: unknown): a is AnalystShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return Array.isArray(o.competitors);
}

interface Props {
  artifact: unknown;
}

export default function AnalystArtifact({ artifact }: Props): JSX.Element {
  if (!isAnalyst(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { competitors, market_gap, recommendation } = artifact;

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
            <div key={i} className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-body-md font-semibold text-text">{c.name}</p>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-body-sm text-accent hover:underline shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {c.positioning && (
                <p className="text-body-sm text-text-muted">{c.positioning}</p>
              )}
              {c.pricing && (
                <p className="font-mono text-mono-sm text-text-faint">{c.pricing}</p>
              )}
              <div className="flex flex-col gap-1">
                {c.strength && (
                  <p className="text-body-sm text-status-done">+ {c.strength}</p>
                )}
                {c.weakness && (
                  <p className="text-body-sm text-status-error">- {c.weakness}</p>
                )}
              </div>
            </div>
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
