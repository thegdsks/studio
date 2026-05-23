'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import RawFallback from './RawFallback';

interface NameEntry {
  name: string;
  domain: string;
  available: boolean;
  alternative_tld?: string;
}

interface NamerShape {
  names: NameEntry[];
}

function isNamer(a: unknown): a is NamerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return Array.isArray(o.names);
}

interface Props {
  artifact: unknown;
}

export default function NamerArtifact({ artifact }: Props): JSX.Element {
  if (!isNamer(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const names = artifact.names.slice(0, 5);

  return (
    <div className="space-y-3">
      {names.map((entry, i) => {
        const isFirst = i === 0;
        return (
          <div
            key={entry.name}
            className={`relative rounded-lg border p-4 bg-surface space-y-2 ${
              isFirst ? 'border-border-accent' : 'border-border'
            }`}
          >
            {isFirst && (
              <span className="absolute top-3 right-3 font-mono text-label-sm text-accent uppercase tracking-widest bg-bg px-1.5 py-0.5 rounded border border-border-accent">
                Recommended
              </span>
            )}
            <p className="text-headline-md font-display text-text">{entry.name}</p>
            <p className="font-mono text-mono-sm text-text-muted">{entry.domain}</p>
            <div className="flex items-center gap-2 justify-between flex-wrap">
              {entry.available ? (
                <span className="flex items-center gap-1 text-status-done text-body-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  .com available
                </span>
              ) : (
                <span className="flex items-center gap-1 text-status-running text-body-sm">
                  <AlertCircle className="h-4 w-4" />
                  {entry.alternative_tld ? `try ${entry.alternative_tld}` : '.com taken'}
                </span>
              )}
              <a
                href={`https://www.namecheap.com/domains/registration/results/?domain=${entry.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-accent hover:underline font-mono"
              >
                Claim this name
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
