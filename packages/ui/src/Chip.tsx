import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export type ChipTone = 'neutral' | 'primary' | 'secondary' | 'success' | 'error';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  leading?: ReactNode;
}

const tones: Record<ChipTone, string> = {
  neutral:   'bg-surface-sunken text-text-muted border-border',
  primary:   'bg-primary-soft text-primary border-border-primary',
  secondary: 'bg-surface-sunken text-secondary border-border',
  success:   'bg-success-soft text-success border-border',
  error:     'bg-error-soft text-error border-border',
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
