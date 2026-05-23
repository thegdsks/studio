'use client';

import { type ReactNode } from 'react';
import { cn } from './cn.js';

export interface SidebarItem {
  id: string;
  label: string;
  /** Lucide icon node */
  icon?: ReactNode;
  /** Badge count or label */
  badge?: string | number;
  active?: boolean;
  href?: string;
  /** Render label in mono uppercase bracket style e.g. [AGENTS] */
  mono?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  /** Slot rendered at top of sidebar (logo, wordmark, etc.) */
  header?: ReactNode;
  /** Navigation items */
  items: SidebarItem[];
  /** Slot rendered at bottom (user info, settings link, etc.) */
  footer?: ReactNode;
  className?: string;
}

/**
 * Reusable sidebar nav primitive.
 *
 * Items: min-h-11 (44px) full-width, hover bg + lift.
 * Active: 2px left accent border + bg tint.
 * Mono items: font-mono uppercase bracket label.
 *
 * Usage:
 * ```tsx
 * <Sidebar
 *   header={<Logo />}
 *   items={[
 *     { id: 'agents', label: 'Agents', icon: <Bot size={16} />, active: true, mono: true },
 *     { id: 'runs',   label: 'Runs',   icon: <Play size={16} />, href: '/runs' },
 *   ]}
 *   footer={<UserChip />}
 * />
 * ```
 */
export function Sidebar({ header, items, footer, className }: SidebarProps) {
  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-surface border-r border-border',
        'w-56 shrink-0',
        className,
      )}
    >
      {header && (
        <div className="px-4 py-4 border-b border-border shrink-0">
          {header}
        </div>
      )}

      <ul role="list" className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {items.map((item) => (
          <SidebarNavItem key={item.id} item={item} />
        ))}
      </ul>

      {footer && (
        <div className="px-4 py-3 border-t border-border shrink-0">
          {footer}
        </div>
      )}
    </nav>
  );
}

interface SidebarNavItemProps {
  item: SidebarItem;
}

function SidebarNavItem({ item }: SidebarNavItemProps) {
  const Tag = item.href ? 'a' : 'button';

  return (
    <li>
      <Tag
        href={item.href}
        onClick={item.onClick}
        aria-current={item.active ? 'page' : undefined}
        className={cn(
          // Hit target: min 44px height, full width
          'flex items-center gap-2.5 w-full min-h-11 px-3 rounded-md',
          'text-left text-body-sm font-medium',
          'transition-[background-color,border-color,color] duration-micro ease-linear',
          // Default state
          'text-text-muted hover:text-text',
          'hover:bg-surface-raised',
          // Active state: 2px left accent border + bg tint
          item.active && [
            'border-l-2 border-l-accent pl-[10px]',
            'bg-accent-soft text-text',
          ],
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        )}
      >
        {item.icon && (
          <span className="shrink-0 text-current" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span
          className={cn(
            'flex-1 truncate',
            item.mono && 'font-mono text-label-sm tracking-[0.08em] uppercase',
          )}
        >
          {item.mono ? `[${item.label}]` : item.label}
        </span>
        {item.badge !== undefined && (
          <span
            className={cn(
              'shrink-0 tabular-nums font-mono text-label-xs',
              'px-1.5 py-0.5 rounded-sm',
              'bg-surface-raised text-text-faint',
              item.active && 'bg-accent-soft text-accent',
            )}
          >
            {item.badge}
          </span>
        )}
      </Tag>
    </li>
  );
}
