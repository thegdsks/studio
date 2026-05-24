'use client';

import { Clapperboard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent } from '@studio/shared';
import { usePrefersReducedMotion } from '@studio/ui';

interface DirectorPillProps {
  agent: Agent | undefined;
  onClick: () => void;
}

export function DirectorPill({ agent, onClick }: DirectorPillProps) {
  const prefersReduced = usePrefersReducedMotion();

  if (!agent) return null;

  const { status, finalArtifact, error } = agent;

  // Error state
  if (status === 'error') {
    return (
      <div
        className="fixed bottom-20 right-6 z-30"
        title={error ?? 'Director synthesis failed'}
      >
        <div className="flex items-center gap-2 rounded-full border border-status-error bg-surface-raised px-4 py-2 shadow-elev-2">
          <Clapperboard className="h-4 w-4 text-status-error shrink-0" aria-hidden />
          <span className="font-mono text-mono-sm text-status-error">Director error</span>
        </div>
      </div>
    );
  }

  // Queued or running state
  if (status === 'queued' || status === 'running') {
    return (
      <div className="fixed bottom-20 right-6 z-30">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2 shadow-elev-1 opacity-70">
          {status === 'running' ? (
            <Loader2 className="h-4 w-4 text-text-faint animate-spin shrink-0" aria-hidden />
          ) : (
            <Clapperboard className="h-4 w-4 text-text-faint shrink-0" aria-hidden />
          )}
          <span className="font-mono text-mono-sm text-text-faint">
            Director: waiting for specialists
          </span>
        </div>
      </div>
    );
  }

  // Done state: check for briefing
  const artifact = finalArtifact as Record<string, unknown> | null | undefined;
  const coherenceScore =
    artifact && typeof artifact['coherence_score'] === 'number'
      ? artifact['coherence_score']
      : null;

  if (status === 'done') {
    return (
      <div className="fixed bottom-20 right-6 z-30">
        <motion.button
          type="button"
          onClick={onClick}
          whileHover={prefersReduced ? {} : { scale: 1.04 }}
          whileTap={prefersReduced ? {} : { scale: 0.97 }}
          className="flex items-center gap-2.5 rounded-full border border-accent bg-surface-raised px-4 py-2.5 shadow-elev-2 hover:bg-accent-soft transition-colors cursor-pointer"
          aria-label="Open Director briefing"
        >
          <Clapperboard className="h-4 w-4 text-accent shrink-0" aria-hidden />
          <span className="font-mono text-mono-sm text-accent font-medium">Briefing ready</span>
          {coherenceScore !== null && (
            <span className="font-mono text-mono-xs text-text-muted tabular-nums bg-surface-sunken border border-border rounded-sm px-1.5 py-0.5">
              {coherenceScore}
            </span>
          )}
        </motion.button>
      </div>
    );
  }

  return null;
}
