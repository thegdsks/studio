'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, Mono } from '@studio/ui';

export interface AgentErrorDetail {
  /** Short machine-readable code, e.g. "TIMEOUT", "AUTH_FAILED". */
  code: string;
  /** Human-readable explanation shown in the card. */
  message: string;
  /** If true, a Retry button is rendered and onRetry should be provided. */
  retryable: boolean;
}

interface AgentCardErrorProps {
  error: AgentErrorDetail;
  /** Called when the user presses Retry. Only invoked when error.retryable is true. */
  onRetry?: () => void;
  retrying?: boolean;
}

/**
 * Full-bleed error state. Renders inside CardBody when an AgentErrorDetail
 * is present. Shows AlertTriangle icon, mono error code, human message, and
 * an optional Retry button. No silent fallbacks — caller must supply a real
 * AgentErrorDetail or not render this component at all.
 */
export function AgentCardError({ error, onRetry, retrying = false }: AgentCardErrorProps) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Icon + code row */}
      <div className="flex items-center gap-2">
        <AlertTriangle
          className="h-4 w-4 text-status-error shrink-0"
          aria-hidden
        />
        <Mono className="text-micro text-status-error uppercase tracking-widest tabular-nums">
          {error.code}
        </Mono>
      </div>

      {/* Human message */}
      <p className="text-body-sm text-text-muted leading-snug">
        {error.message}
      </p>

      {/* Retry — only when retryable + handler supplied */}
      {error.retryable && onRetry && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={
              retrying ? (
                <span
                  className="h-3.5 w-3.5 rounded-full border-2 border-text-faint/30 border-t-text-faint animate-spin shrink-0"
                  aria-hidden
                />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )
            }
            onClick={onRetry}
            disabled={retrying}
            aria-label="Retry this agent"
          >
            {retrying ? 'Retrying' : 'Retry'}
          </Button>
        </div>
      )}
    </div>
  );
}
