import type { ReactElement } from 'react';
import { cn } from './cn.js';

export type PatternType = 'dots' | 'hairline-grid' | 'iso-grid' | 'noise';

interface PatternProps {
  /** Which pattern texture to render. */
  type: PatternType;
  /** Additional classes applied to the pattern layer (e.g. opacity adjustments). */
  className?: string;
}

/**
 * Renders a pointer-events-none, absolutely-positioned full-bleed div
 * with a background pattern CSS class. Drop inside any `relative` container
 * to add a subtle decorative texture behind content.
 *
 * The parent container must have `position: relative` (Tailwind: `relative`).
 *
 * Usage:
 * ```tsx
 * <div className="relative rounded-hero overflow-hidden">
 *   <Pattern type="dots" className="opacity-60" />
 *   <p>Content on top</p>
 * </div>
 * ```
 */

const patternClass: Record<PatternType, string> = {
  dots:           'canvas-dots',
  'hairline-grid': 'pattern-hairline-grid',
  'iso-grid':     'pattern-iso-grid',
  noise:          'pattern-noise',
};

export function Pattern({ type, className }: PatternProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute inset-0 pointer-events-none select-none',
        patternClass[type],
        className,
      )}
    />
  );
}
