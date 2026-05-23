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
export type CardCurve = 'default' | 'panel' | 'hero';
export type CardPattern = 'none' | 'dots' | 'hairline-grid' | 'iso-grid' | 'noise';
export type CardAccentDomain = 'primary' | 'warm' | 'cool' | 'violet' | 'rose';

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
   * Border radius variant.
   * - `'default'`: rounded-lg (existing behavior, back-compat)
   * - `'panel'`: rounded-2xl (16px, for hero panels)
   * - `'hero'`: rounded-3xl (24px, for IdeaInput / FinalKitPanel hero surfaces)
   */
  curve?: CardCurve;
  /**
   * Subtle background pattern texture applied as a pointer-events-none
   * pseudo-layer under content. Default is `'none'`.
   * - `'dots'`: dot grid (canvas-dots)
   * - `'hairline-grid'`: 24×24 ruled grid
   * - `'iso-grid'`: 60° isometric diagonal grid
   * - `'noise'`: SVG turbulence noise (best for FinalKitPanel surface)
   */
  pattern?: CardPattern;
  /**
   * Domain accent for the 2px left border status rail.
   * When set to a non-primary value and tone is `resting` or `active`, the
   * left border uses the domain accent color instead of the status accent.
   * When tone is `done` or `error`, the status color always wins (urgency
   * overrides domain coding). Default: `'primary'` — existing behavior.
   */
  accentDomain?: CardAccentDomain;
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

/** Left-border rail classes keyed by accent domain for active tone. */
const domainActiveBorder: Record<CardAccentDomain, string> = {
  primary: 'border-l-accent',
  warm:    'border-l-accent-warm',
  cool:    'border-l-accent-cool',
  violet:  'border-l-accent-violet',
  rose:    'border-l-accent-rose',
};

/** Left-border rail classes keyed by accent domain for resting tone. */
const domainRestingBorder: Record<CardAccentDomain, string> = {
  primary: 'border-border',
  warm:    'border border-y-border border-r-border border-l-2 border-l-accent-warm/40',
  cool:    'border border-y-border border-r-border border-l-2 border-l-accent-cool/40',
  violet:  'border border-y-border border-r-border border-l-2 border-l-accent-violet/40',
  rose:    'border border-y-border border-r-border border-l-2 border-l-accent-rose/40',
};

/**
 * Left-border tone classes.
 * Active/success/error use a 2px left border in status color, body neutral.
 * Queued/resting/idle use standard border-border.
 * Domain accent is applied via accentDomain prop for resting/active tones.
 */
function resolveToneClass(tone: CardTone, domain: CardAccentDomain): string {
  if (tone === 'success') return 'border-y border-r border-border border-l-2 border-l-status-done';
  if (tone === 'error')   return 'border-y border-r border-border border-l-2 border-l-status-error';
  if (tone === 'idle')    return 'border border-border bg-surface opacity-60';
  if (tone === 'active') {
    const leftBorder = domainActiveBorder[domain];
    return `border-y border-r border-border border-l-2 ${leftBorder}`;
  }
  // resting
  if (domain === 'primary') return 'border border-border';
  return domainRestingBorder[domain];
}

const surfaceClasses: Record<CardSurface, string> = {
  flat:   'bg-surface-raised',
  glass:  'bg-surface/60 backdrop-blur-glass border border-white/[0.08] shadow-elev-1',
  lifted: 'bg-surface-raised shadow-elev-2',
};

const curveClasses: Record<CardCurve, string> = {
  default: 'rounded-lg',
  panel:   'rounded-2xl',
  hero:    'rounded-3xl',
};

const patternClasses: Record<CardPattern, string> = {
  none:           '',
  dots:           'canvas-dots',
  'hairline-grid': 'pattern-hairline-grid',
  'iso-grid':     'pattern-iso-grid',
  noise:          'pattern-noise',
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
    curve = 'default',
    pattern = 'none',
    accentDomain = 'primary',
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
  const patternClass = patternClasses[pattern];

  return (
    <Tag
      ref={ref}
      className={cn(
        'flex flex-col relative group',
        curveClasses[curve],
        surfaceClasses[surface],
        // Tone adds its own border; glass surface manages border inline
        surface !== 'glass' && resolveToneClass(tone, accentDomain),
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
      {/* Pattern layer — decorative, pointer-events-none, behind content */}
      {pattern !== 'none' && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 pointer-events-none',
            curveClasses[curve],
            patternClass,
          )}
        />
      )}
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
