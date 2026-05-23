'use client';

import { type ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from './cn.js';

interface TopBarProps {
  /** Left slot: brand mark, wordmark, or logo. Always visible. */
  brand: ReactNode;
  /**
   * Center slot: live timer, breadcrumbs, page title.
   * Hidden on mobile (< 640px), shown on sm+.
   */
  center?: ReactNode;
  /**
   * Right slot: action buttons, connection dot.
   * On mobile, non-essential items are hidden — pass `mobileMenu` for overflow.
   * Each child must have a min 40px hit target.
   */
  actions?: ReactNode;
  /**
   * Mobile-only supplemental items rendered in the hamburger dropdown.
   * When provided, a Menu toggle appears on the right at < 640px.
   * Use for items hidden from the `actions` slot on mobile.
   */
  mobileMenu?: ReactNode;
  /**
   * Optional second row (32px tall) for mono breadcrumbs or run metadata.
   * Rendered below the main 56px row, separated by a hairline at 4% opacity.
   */
  meta?: ReactNode;
  /**
   * Stick to the viewport top with z-30. Default: true.
   * Set to false for embedded usage inside scroll containers.
   */
  sticky?: boolean;
  className?: string;
}

/**
 * Slotted top bar used on every page.
 *
 * Positioning: sticky top-0, starts at left:var(--sidebar-width) on md+
 * so it never overlaps the fixed sidebar. On mobile (below md) it fills
 * the full viewport width because the sidebar becomes a bottom nav.
 *
 * Glass surface: backdrop-blur-glass + bg-surface/60 + 1px hairline border.
 *
 * Main row: 56px tall (h-14).
 * Meta row (optional): 32px tall, separated by a hairline.
 *
 * Responsive strategy:
 *   Mobile  (< 640px):  brand + hamburger only. Center hidden. Actions hidden.
 *   Tablet  (640-1024px): brand + center (truncated) + key actions.
 *   Desktop (1024px+):  all slots visible.
 */
export function TopBar({
  brand,
  center,
  actions,
  mobileMenu,
  meta,
  sticky = true,
  className,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMobileMenu = mobileMenu !== undefined;

  return (
    <header
      className={cn(
        // Glass surface
        'bg-surface/60 backdrop-blur-glass',
        'border-b border-white/[0.08] shadow-elev-1',
        // Positioning: offset from sidebar on md+, full width on mobile
        sticky && 'sticky top-0 z-30',
        className,
      )}
      style={{ marginLeft: 'var(--sidebar-width)' }}
    >
      {/* Main row — 56px */}
      <div className="flex items-center h-14 px-4 sm:px-6 gap-3 sm:gap-4">
        {/* Brand — left, always visible, never shrinks */}
        <div className="flex items-center shrink-0">
          {brand}
        </div>

        {/* Center — hidden on mobile, flex-1 on sm+ */}
        {center !== undefined && (
          <div className="hidden sm:flex flex-1 items-center justify-center min-w-0">
            {center}
          </div>
        )}

        {/* Spacer when no center slot so actions push right */}
        {center === undefined && <div className="flex-1" aria-hidden="true" />}

        {/* Spacer on mobile when center exists but is hidden */}
        {center !== undefined && (
          <div className="flex sm:hidden flex-1" aria-hidden="true" />
        )}

        {/* Desktop actions — hidden on mobile, shown on sm+ */}
        {actions !== undefined && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}

        {/* Mobile hamburger — shown only when mobileMenu provided, only on mobile */}
        {hasMobileMenu && (
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'sm:hidden flex items-center justify-center',
              'h-10 w-10 rounded-lg shrink-0',
              'text-text-muted hover:text-text hover:bg-surface-raised',
              'transition-colors duration-[80ms]',
            )}
          >
            {menuOpen
              ? <X size={18} aria-hidden="true" />
              : <Menu size={18} aria-hidden="true" />
            }
          </button>
        )}
      </div>

      {/* Meta row — 32px, optional */}
      {meta !== undefined && (
        <div
          className={cn(
            'flex items-center h-8 px-4 sm:px-6',
            'border-t border-white/[0.04]',
          )}
        >
          {meta}
        </div>
      )}

      {/* Mobile menu sheet — full-width panel below the bar */}
      {hasMobileMenu && menuOpen && (
        <div
          className={cn(
            'sm:hidden',
            'border-t border-white/[0.08]',
            'bg-surface/95 backdrop-blur-glass',
            'px-4 py-3',
          )}
          role="navigation"
          aria-label="Mobile menu"
        >
          {mobileMenu}
        </div>
      )}
    </header>
  );
}
