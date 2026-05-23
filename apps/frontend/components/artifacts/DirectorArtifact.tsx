'use client';

/**
 * DirectorArtifact — renders the Director agent's final synthesis.
 *
 * Card variant: compact summary with headline_metric + money_quote.
 * Detail variant: full DirectorReveal component with briefing data.
 *
 * When artifact has no .briefing (queued or streaming), shows a
 * "Director synthesis pending" state. Never falls through to RawFallback
 * silently — RawFallback is shown only on shape mismatch.
 */

import { Clapperboard } from 'lucide-react';
import { Label, Mono } from '@studio/ui';
import { DirectorReveal } from '@/components/run/DirectorReveal';
import type { DirectorBriefingData } from '@/components/run/DirectorReveal';
import RawFallback from './RawFallback';

// ─── Shape ───────────────────────────────────────────────────────────────────

interface DirectorShape {
  briefing?: DirectorBriefingData;
  [key: string]: unknown;
}

function isDirector(a: unknown): a is DirectorShape {
  if (!a || typeof a !== 'object') return false;
  // Director artifacts may arrive before briefing is populated —
  // we accept any object and check for briefing separately.
  return true;
}

function hasBriefing(shape: DirectorShape): shape is DirectorShape & { briefing: DirectorBriefingData } {
  const b = shape.briefing;
  if (!b || typeof b !== 'object') return false;
  const br = b as unknown as Record<string, unknown>;
  return (
    typeof br.headline_metric === 'string' &&
    typeof br.money_quote === 'string' &&
    typeof br.voiceover_script === 'string' &&
    Array.isArray(br.talking_points) &&
    Array.isArray(br.next_actions)
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PendingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface-sunken py-16 px-6 text-center">
      <Clapperboard className="h-8 w-8 text-text-faint" aria-hidden />
      <div className="space-y-1">
        <p className="text-body-md font-medium text-text-muted">Director synthesis pending</p>
        <Mono className="text-mono-sm text-text-faint">
          Waiting for all specialist agents to complete
        </Mono>
      </div>
    </div>
  );
}

function CardSummary({ briefing }: { briefing: DirectorBriefingData }) {
  return (
    <div className="space-y-2">
      <p className="text-body-md font-semibold text-text leading-snug">
        {briefing.headline_metric}
      </p>
      <p className="text-body-sm text-text-muted italic">{briefing.money_quote}</p>
      {briefing.next_actions.length > 0 && (
        <div className="space-y-1 pt-1">
          <Label>Next actions</Label>
          <ul className="space-y-1">
            {briefing.next_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <Mono className="text-mono-sm text-accent tabular-nums shrink-0">{i + 1}.</Mono>
                <span className="text-body-sm text-text">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export type DirectorVariant = 'card' | 'detail';

interface Props {
  artifact: unknown;
  variant?: DirectorVariant;
}

export default function DirectorArtifact({ artifact, variant = 'card' }: Props): JSX.Element {
  if (!isDirector(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  if (!hasBriefing(artifact)) {
    return <PendingState />;
  }

  if (variant === 'detail') {
    return <DirectorReveal briefing={artifact.briefing} />;
  }

  return <CardSummary briefing={artifact.briefing} />;
}
