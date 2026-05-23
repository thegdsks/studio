import {
  forwardRef,
  type HTMLAttributes,
  type ElementType,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from './cn.js';

export type CardTone = 'resting' | 'active' | 'success' | 'error' | 'idle';
export type CardGlow = 'soft' | 'subtle' | 'off';
/**
 * Surface treatment for elevated cards.
 * - `'flat'` (default): bg-surface-raised, no shadow.
 * - `'glass'`: backdrop-blur-glass + bg-surface/60 + shadow-elev-1 + 8% border.
 * - `'lifted'`: bg-surface-raised + shadow-elev-2 — for primary content cards.
 */
export type CardSurface = 'flat' | 'glass' | 'lifted';

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
   * Surface treatment. Controls background + shadow depth.
   * Defaults to `'flat'` for full back-compat.
   */
  surface?: CardSurface;
  /**
   * Lift on hover: translateY(-1px) + border opacity bump + one shadow step up.
   * 120ms ease-card. Skips transform under prefers-reduced-motion.
   */
  lift?: boolean;
  /**
   * Border opacity transitions 6%→14% over 80ms linear on hover.
   */
  hover?: boolean;
  /**
   * Same as hover plus `cursor-pointer` and a 1px ring-flash on click (180ms).
   * Adds full-card button semantics — pair with `as="button"`.
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
  /**
   * Affordance node rendered bottom-right (e.g. a Lucide arrow icon).
   * Slides 2px right on hover. Only rendered when `interactive` is true.
   */
  affordance?: ReactNode;
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

const surfaceClasses: Record<CardSurface, string> = {
  flat:   'bg-surface-raised',
  glass:  'bg-surface/60 backdrop-blur-glass border border-white/[0.08] shadow-elev-1',
  lifted: 'bg-surface-raised shadow-elev-2',
};

function resolveGlowClass(glow: boolean | CardGlow | undefined): string {
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
    surface = 'flat',
    lift,
    hover,
    interactive,
    affordance,
    divided,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isElevatable = lift || interactive;

  return (
    <Tag
      ref={ref}
      className={cn(
        'flex flex-col rounded-lg relative group',
        surfaceClasses[surface],
        // Tone adds its own border; glass surface manages border inline
        surface !== 'glass' && toneClasses[tone],
        resolveGlowClass(glow),
        // Hover: border opacity bump, 80ms linear
        (hover || interactive) && [
          'transition-[border-color,box-shadow,transform] duration-micro ease-linear',
          'hover:border-border-strong',
        ],
        // Lift: -1px translate + shadow step up, 120ms ease-card, reduced-motion safe
        isElevatable && [
          'motion-safe:hover:-translate-y-px',
          surface === 'lifted'
            ? 'motion-safe:hover:shadow-elev-3'
            : 'motion-safe:hover:shadow-elev-2',
        ],
        interactive && [
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
          'active:animate-ring-flash',
        ],
        tone === 'idle' && 'text-text-muted',
        className,
      )}
      {...rest}
    >
      {children}
      {interactive && affordance && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-3 right-3 text-text-faint',
            'transition-transform duration-micro ease-linear',
            'group-hover:translate-x-0.5',
          )}
        >
          {affordance}
        </span>
      )}
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
