import { type ReactNode } from 'react';
import { cn } from './cn.js';

interface PageHeaderProps {
  /**
   * Small mono uppercase line above the title.
   * E.g. "[STUDIO]", "RUN 004", "AGENTS".
   */
  eyebrow?: string;
  /** Main display title — rendered with text-display-lg token. */
  title: string;
  /** Optional subtitle in text-body-md muted. */
  subtitle?: string;
  /**
   * Right-aligned slot for CTA buttons or other actions.
   * Rendered alongside the title row.
   */
  actions?: ReactNode;
  /**
   * Show bottom 1px divider at 6% white opacity (default: true).
   */
  divider?: boolean;
  className?: string;
}

/**
 * Page-level header with display type, eyebrow, subtitle, and actions slot.
 * Gives every page a strong visual anchor — "Mission Control" aesthetic.
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   eyebrow="[STUDIO]"
 *   title="Brand Kit"
 *   subtitle="Nine specialists converging on one deliverable."
 *   actions={<Button size="lg">Start run</Button>}
 * />
 * ```
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  divider = true,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2 pb-6',
        divider && 'border-b border-white/[0.06]',
        className,
      )}
    >
      {eyebrow && (
        <p className="font-mono text-label-sm text-text-faint tracking-[0.08em] uppercase">
          {eyebrow}
        </p>
      )}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-display-lg text-text font-semibold leading-[1.05] tracking-[-0.035em]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-body-md text-text-muted max-w-prose">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0 mt-1">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
