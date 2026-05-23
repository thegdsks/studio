import type { HTMLAttributes } from 'react';
import { cn } from './cn.js';

export function Mono({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('font-mono text-mono-md text-text-muted', className)} {...rest} />;
}

export function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'font-mono text-label-sm uppercase tracking-wider text-text-faint',
        className,
      )}
      {...rest}
    />
  );
}
