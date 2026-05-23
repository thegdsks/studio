'use client';

import { type ReactNode } from 'react';
import { cn } from './cn.js';

interface TopBarProps {
  /** Left slot — brand mark, wordmark, or logo. */
  brand: ReactNode;
  /** Center slot — live timer, breadcrumbs, page title. */
  center?: ReactNode;
  /** Right slot — action buttons, connection dot. Each child must have ≥40px hit target. */
  actions?: ReactNode;
  /**
   * Optional second row (32px tall) for mono breadcrumbs or run metadata.
   * Rendered below the main 56px row, separated by a hairline at 4% opacity.
   */
  meta?: ReactNode;
  /**
   * Stick to the viewport top with z-40. Default: true.
   * Set to false for embedded usage inside scroll containers.
   */
  sticky?: boolean;
  className?: string;
}

/**
 * Slotted top bar used on every page. Glass surface: backdrop-blur-glass +
 * bg-surface/60 + 1px hairline border-bottom at 8% white opacity.
 *
 * Main row: 56px tall.
 * Meta row (optional): 32px tall, separated by a hairline.
 *
 * All action children must provide ≥40px hit targets (use Button size="md" or
 * wrap in a min-h-10 flex container).
 */
export function TopBar({
  brand,
  center,
  actions,
  meta,
  sticky = true,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        // Glass surface
        'bg-surface/60 backdrop-blur-glass',
        'border-b border-white/[0.08] shadow-elev-1',
        // Positioning
        sticky && 'sticky top-0 z-40',
        className,
      )}
    >
      {/* Main row — 56px */}
      <div className="flex items-center h-14 px-4 gap-4">
        {/* Brand — left */}
        <div className="flex items-center shrink-0">
          {brand}
        </div>

        {/* Center — flex-1 so it fills available space */}
        {center !== undefined && (
          <div className="flex-1 flex items-center justify-center min-w-0">
            {center}
          </div>
        )}

        {/* Spacer when no center slot so actions push right */}
        {center === undefined && <div className="flex-1" aria-hidden="true" />}

        {/* Actions — right, each child must be ≥40px */}
        {actions !== undefined && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Meta row — 32px, optional */}
      {meta !== undefined && (
        <div
          className={cn(
            'flex items-center h-8 px-4',
            'border-t border-white/[0.04]',
          )}
        >
          {meta}
        </div>
      )}
    </header>
  );
}
