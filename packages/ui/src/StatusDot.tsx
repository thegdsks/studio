'use client';

import { cn } from './cn.js';
import { usePrefersReducedMotion } from './motion.js';

export type StatusKind = 'queued' | 'running' | 'done' | 'error';

interface StatusDotProps {
  status: StatusKind;
  className?: string;
}

/**
 * 6px solid dot — size sourced from tokens.space.status-dot (CSS var --space-status-dot).
 * Inset shadow sourced from tokens.shadow.dot-inset (CSS var --shadow-dot-inset).
 *
 * Idle/queued: outlined (transparent fill, visible border in status color).
 * Active/done/error: solid fill + 1px inset surface shadow.
 * Pulse animation only on `running` state; respects prefers-reduced-motion.
 */
export function StatusDot({ status, className }: StatusDotProps) {
  const reducedMotion = usePrefersReducedMotion();

  const isOutlined = status === 'queued';
  const isPulsing  = status === 'running' && !reducedMotion;

  /**
   * Color classes per state.
   * Solid states use shadow-dot-inset (tokens.shadow.dot-inset) for the
   * 1px inset ring so no raw rgba literals appear in component code.
   */
  const colorClass: Record<StatusKind, string> = {
    queued:  'bg-transparent border border-status-queued',
    running: 'bg-status-running shadow-dot-inset',
    done:    'bg-status-done    shadow-dot-inset',
    error:   'bg-status-error   shadow-dot-inset',
  };

  return (
    <span
      role="status"
      aria-label={status}
      className={cn(
        'inline-block rounded-full shrink-0',
        // Size from tokens.space.status-dot (6px) via Tailwind spacing utility
        'w-[var(--space-status-dot)] h-[var(--space-status-dot)]',
        colorClass[status],
        isPulsing && 'animate-pulse-dot',
        isOutlined && 'border',
        className,
      )}
    />
  );
}
