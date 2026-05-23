import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn.js';

export type CardTone = 'resting' | 'active' | 'success' | 'error';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  glow?: boolean;
}

const tones: Record<CardTone, string> = {
  resting: 'border-border',
  active:  'border-border-accent shadow-glow-accent',
  success: 'border-border',
  error:   'border-status-error',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = 'resting', glow, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col rounded-lg border bg-surface-raised',
        'transition-[border-color,box-shadow] duration-state ease-ease',
        tones[tone],
        glow && 'shadow-glow-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-3 border-b border-border',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('flex-1 min-h-0 overflow-y-auto px-4 py-3', className)} {...rest} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-2 border-t border-border', className)}
        {...rest}
      />
    );
  },
);
