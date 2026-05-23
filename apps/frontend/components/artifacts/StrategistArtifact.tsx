'use client';

import { AlertTriangle } from 'lucide-react';
import RawFallback from './RawFallback';

interface StrategistShape {
  positioning: string;
  icp: string;
  jtbd: string;
  three_risks: string[];
}

function isStrategist(a: unknown): a is StrategistShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.positioning === 'string' &&
    typeof o.icp === 'string' &&
    typeof o.jtbd === 'string' &&
    Array.isArray(o.three_risks)
  );
}

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function StrategistArtifact({ artifact }: Props): JSX.Element {
  if (!isStrategist(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { positioning, icp, jtbd, three_risks } = artifact;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-border-accent pl-5 py-2">
        <p className="text-headline-md font-display italic text-text leading-snug">
          {positioning}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
            Ideal Customer
          </p>
          <p className="text-body-md text-text">{icp}</p>
        </div>
        <div className="space-y-1">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
            Job to Be Done
          </p>
          <p className="text-body-md text-text">{jtbd}</p>
        </div>
      </div>

      {three_risks.length > 0 && (
        <div className="space-y-2">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-status-running" />
            Top Risks
          </p>
          <ol className="space-y-1.5">
            {three_risks.map((risk, i) => (
              <li key={i} className="flex gap-2 text-body-sm text-text-muted">
                <span className="font-mono text-text-faint shrink-0">{i + 1}.</span>
                <span>{risk}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
