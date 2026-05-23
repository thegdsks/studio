import {
  forwardRef,
  type HTMLAttributes,
  type ElementType,
  type ComponentPropsWithRef,
} from 'react';
import { cn } from './cn.js';

export type CardTone = 'resting' | 'active' | 'success' | 'error' | 'idle';
export type CardGlow = 'soft' | 'subtle' | 'off';

interface CardBaseProps {
  tone?: CardTone;
  /**
   * Shadow glow intensity.
   * - `'soft'`: smaller blur (shadow-glow-accent-soft token)
   * - `'subtle'`: standard glow (shadow-glow-accent token)
   * - `'off'` (default): no glow
   * Legacy boolean `true` maps to `'subtle'` for back-compat.
   */
  glow?: boolean | CardGlow;
  /**
   * Border opacity transitions 6%→14% over 80ms linear on hover.
   * No transform, no shadow, no scale — per research §micro-detail 5.
   */
  hover?: boolean;
  /**
   * Same as hover plus `cursor-pointer` and a 1px ring-flash on click (180ms).
   */
  interactive?: boolean;
  /**
   * Render the card as a different element.
   * Use `'button'` for interactive cards for correct a11y semantics.
   */
  as?: ElementType;
  /**
   * Show 1px hairline divider between CardHeader and CardBody at 4% opacity.
   * Default: true when both CardHeader and CardBody are present (opt-out with false).
   */
  divided?: boolean;
}

type CardProps<E extends ElementType = 'div'> = CardBaseProps &
  Omit<ComponentPropsWithRef<E>, keyof CardBaseProps>;

/**
 * Left-border tone classes.
 * Active/success/error use a 2px left border in status color, body neutral.
 * Queued/resting/idle use standard border-border.
 */
const toneClasses: Record<CardTone, string> = {
  resting: 'border border-border',
  idle:    'border border-border bg-surface opacity-60',
  active:  'border-y border-r border-border border-l-2 border-l-accent',
  success: 'border-y border-r border-border border-l-2 border-l-status-done',
  error:   'border-y border-r border-border border-l-2 border-l-status-error',
};

function resolveGlowClass(
  glow: boolean | CardGlow | undefined,
): string {
  if (!glow || glow === 'off') return '';
  if (glow === true || glow === 'subtle') return 'shadow-glow-accent';
  if (glow === 'soft') return 'shadow-glow-accent-soft';
  return '';
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    as: Tag = 'div',
    tone = 'resting',
    glow = 'off',
    hover,
    interactive,
    divided,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        'flex flex-col rounded-lg',
        'bg-surface-raised',
        toneClasses[tone],
        resolveGlowClass(glow),
        // Hover: border opacity 6%→14%, 80ms linear — no transform, no scale
        (hover || interactive) && [
          'transition-[border-color] duration-hover ease-linear',
          'hover:border-border-strong',
        ],
        interactive && [
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
          'active:animate-ring-flash',
        ],
        // Idle tone: muted text + dimmer border, no glow
        tone === 'idle' && 'text-text-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Show 1px hairline divider below header at 4% opacity (default: true).
   */
  divided?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, divided = true, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-3',
          divided && 'border-b border-white/[0.04]',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex-1 min-h-0 overflow-y-auto px-4 py-3', className)}
        {...rest}
      />
    );
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-2 border-t border-white/[0.04]', className)}
        {...rest}
      />
    );
  },
);
