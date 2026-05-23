'use client';

import { type ReactNode } from 'react';
import { cn } from './cn.js';

interface StatusBarProps {
  /** Left slot — e.g. "9 agents · 3 done" summary text. */
  left?: ReactNode;
  /** Center slot — progress stepper, phase label. */
  center?: ReactNode;
  /** Right slot — CTA button, connection status dot. */
  right?: ReactNode;
  /**
   * Overall progress 0–1. Renders a 2px accent line at the top edge of the bar.
   * Omit to hide the progress line entirely.
   */
  progress?: number;
  className?: string;
}

/**
 * Bottom-of-viewport status bar. Sticky bottom-0 z-40.
 * Glass surface: bg-surface/60 + backdrop-blur-glass + 1px hairline border-top at 8%.
 * Height: 40px. Optional 2px accent progress line along the top edge.
 *
 * Numeric values use tabular-nums for stable layout during counting animations.
 */
export function StatusBar({
  left,
  center,
  right,
  progress,
  className,
}: StatusBarProps) {
  const hasProgress = progress !== undefined;
  const clampedProgress = hasProgress
    ? Math.min(1, Math.max(0, progress))
    : 0;

  return (
    <footer
      className={cn(
        // Glass surface
        'bg-surface/60 backdrop-blur-glass',
        'border-t border-white/[0.08]',
        // Positioning
        'sticky bottom-0 z-40',
        'relative',
        className,
      )}
    >
      {/* Progress line — 2px accent bar at very top of the bar */}
      {hasProgress && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 h-0.5 bg-accent transition-[width] duration-[240ms] ease-out"
          style={{ width: `${clampedProgress * 100}%` }}
        />
      )}

      {/* Content row — 40px */}
      <div className="flex items-center h-10 px-4 gap-4">
        {/* Left */}
        {left !== undefined && (
          <div className="flex items-center gap-2 shrink-0 font-mono text-mono-md text-text-muted tabular-nums">
            {left}
          </div>
        )}

        {/* Center — flex-1 */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {center}
        </div>

        {/* Right */}
        {right !== undefined && (
          <div className="flex items-center gap-2 shrink-0">
            {right}
          </div>
        )}
      </div>
    </footer>
  );
}
