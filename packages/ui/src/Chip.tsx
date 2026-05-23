import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export type ChipTone = 'neutral' | 'accent' | 'success' | 'error';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  leading?: ReactNode;
}

const tones: Record<ChipTone, string> = {
  neutral: 'bg-surface-sunken text-text-muted border-border',
  accent:  'bg-accent-soft text-accent border-border-accent',
  success: 'bg-status-done-soft text-status-done border-border',
  error:   'bg-status-error-soft text-status-error border-border',
};

export function Chip({ tone = 'neutral', leading, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-sm',
        'text-label-sm font-mono uppercase tracking-wider',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {leading}
      <span>{children}</span>
    </span>
  );
}
