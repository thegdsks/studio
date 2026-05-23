'use client';

import { cn } from './cn.js';
import { usePrefersReducedMotion } from './motion.js';

export type StatusKind = 'queued' | 'running' | 'done' | 'error';

interface StatusDotProps {
  status: StatusKind;
  /** Dot diameter in px. Default: 6 (per design spec §micro-detail 1). */
  size?: number;
  className?: string;
}

/**
 * 6px solid dot with 1px inset border at 50% surface opacity.
 * Idle/queued: outlined (transparent fill, visible border).
 * Active/done/error: solid fill, no visible inset border.
 * Pulse animation only on `running` state; respects prefers-reduced-motion.
 */
export function StatusDot({ status, size = 6, className }: StatusDotProps) {
  const reducedMotion = usePrefersReducedMotion();

  const isOutlined = status === 'queued';
  const isPulsing  = status === 'running' && !reducedMotion;

  /**
   * Color classes per state.
   * Outlined state uses transparent bg + border in status color.
   * Solid state uses filled bg + a hairline inset border at ~50% surface opacity
   * (expressed as box-shadow ring so it doesn't affect layout).
   */
  const colorClass: Record<StatusKind, string> = {
    queued:  'bg-transparent border border-status-queued',
    running: 'bg-status-running shadow-[inset_0_0_0_1px_rgba(15,16,21,0.5)]',
    done:    'bg-status-done    shadow-[inset_0_0_0_1px_rgba(15,16,21,0.5)]',
    error:   'bg-status-error   shadow-[inset_0_0_0_1px_rgba(15,16,21,0.5)]',
  };

  return (
    <span
      role="status"
      aria-label={status}
      className={cn(
        'inline-block rounded-full shrink-0',
        colorClass[status],
        isPulsing && 'animate-pulse-dot',
        isOutlined && 'border',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
