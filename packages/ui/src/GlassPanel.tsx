import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn.js';

/**
 * Translucent panel for modals, sticky headers, sheets.
 * The hairline border at top is intentional — catches light without drawing a line.
 */
export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function GlassPanel({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-glass backdrop-blur-glass',
          'border border-border rounded-xl',
          className,
        )}
        style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}
        {...rest}
      />
    );
  },
);
