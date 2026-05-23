import { type ReactNode } from 'react';
import { requireProp } from './failLoud.js';
import { cn } from './cn.js';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Mono breadcrumbs in Mission Control style: [STUDIO] / [RUN] / [r_8f3a]
 * Last item is non-clickable. Prior items render as links with ≥36px hit area.
 * Throws if items is empty — no fallback.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  requireProp(items.length > 0 ? items : null, 'items (non-empty array)');

  const nodes: ReactNode[] = [];

  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    const label = `[${item.label}]`;

    if (i > 0) {
      nodes.push(
        <span
          key={`sep-${i}`}
          aria-hidden="true"
          className="text-text-faint select-none px-1.5"
        >
          /
        </span>,
      );
    }

    if (isLast || !item.href) {
      nodes.push(
        <span
          key={item.label}
          aria-current={isLast ? 'page' : undefined}
          className={cn(
            'font-mono text-mono-md',
            isLast ? 'text-text' : 'text-text-muted',
          )}
        >
          {label}
        </span>,
      );
    } else {
      nodes.push(
        <a
          key={item.label}
          href={item.href}
          className={cn(
            'font-mono text-mono-md text-text-muted',
            'inline-flex items-center min-h-9',
            'hover:text-text transition-colors duration-micro',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm',
          )}
        >
          {label}
        </a>,
      );
    }
  });

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      {nodes}
    </nav>
  );
}
