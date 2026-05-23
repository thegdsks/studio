'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutDashboard, ListChecks, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

interface SidebarProps {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

/**
 * Navigation sidebar / bottom-nav.
 *
 * Desktop (md+, >= 768px): fixed left column, 56px collapsed, hover-expands
 *   to 200px. Flush with the top of the viewport — the topbar lives to its
 *   right via AppShell padding (var(--sidebar-width) = 56px).
 *
 * Mobile (< 768px): fixed bottom bar, full-width, 56px tall, icons only.
 */
export default function Sidebar({ settingsOpen: _settingsOpen, onSettingsToggle }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const isHome = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isRun = pathname.startsWith('/run/');

  const topItems: NavItem[] = [
    {
      label: 'Home',
      icon: <Home className="h-4 w-4 shrink-0" />,
      href: '/',
      isActive: isHome,
    },
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      href: '/dashboard',
      isActive: isDashboard,
    },
    {
      label: 'Runs',
      icon: <ListChecks className="h-4 w-4 shrink-0" />,
      href: '/dashboard',
      isActive: isRun,
    },
  ];

  const settingsItem: NavItem = {
    label: 'Settings',
    icon: <Settings className="h-4 w-4 shrink-0" />,
    onClick: onSettingsToggle,
    isActive: false,
  };

  function desktopItemClass(active: boolean) {
    const base =
      'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 w-full text-left overflow-hidden';
    if (active) {
      return `${base} bg-accent/10 text-accent border-l-2 border-accent`;
    }
    return `${base} text-text-muted hover:text-text hover:bg-surface-raised border-l-2 border-transparent`;
  }

  function mobileItemClass(active: boolean) {
    const base =
      'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[44px] transition-colors duration-150';
    return active
      ? `${base} text-accent`
      : `${base} text-text-muted hover:text-text`;
  }

  function renderDesktopItem(item: NavItem, idx: number) {
    const inner = (
      <>
        <span className="shrink-0">{item.icon}</span>
        <span className="font-mono text-label-sm uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 select-none">
          {item.label}
        </span>
      </>
    );

    if (item.href) {
      return (
        <Link
          key={idx}
          href={item.href}
          title={item.label}
          className={desktopItemClass(!!item.isActive)}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        key={idx}
        type="button"
        title={item.label}
        onClick={item.onClick}
        className={desktopItemClass(!!item.isActive)}
      >
        {inner}
      </button>
    );
  }

  const mobileItems: NavItem[] = [...topItems, settingsItem];

  return (
    <>
      {/* Desktop sidebar — hidden below md */}
      <aside
        className={[
          'fixed left-0 top-0 bottom-0 z-40',
          'hidden md:flex flex-col',
          'w-14 hover:w-[200px]',
          'transition-[width] duration-200 ease-out',
          'bg-surface border-r border-border',
          'overflow-hidden',
          'group/sidebar',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Brand mark — collapses to "S", expands to "STUDIO" */}
        <div className="relative flex items-center justify-center h-14 shrink-0 border-b border-border overflow-hidden">
          <span className="font-mono text-label-xs text-text-faint uppercase tracking-[0.3em] select-none group-hover/sidebar:opacity-0 transition-opacity duration-150">
            S
          </span>
          <span className="absolute font-mono text-label-sm text-text-muted uppercase tracking-[0.2em] select-none opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
            STUDIO
          </span>
        </div>

        {/* Top nav items */}
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {topItems.map((item, idx) => renderDesktopItem(item, idx))}
        </nav>

        {/* Bottom cluster: theme toggle + settings */}
        <div className="p-2 border-t border-border flex flex-col gap-1">
          <button
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggle}
            className={desktopItemClass(false)}
          >
            <span className="shrink-0">
              {isDark
                ? <Sun className="h-4 w-4 shrink-0" />
                : <Moon className="h-4 w-4 shrink-0" />
              }
            </span>
            <span className="font-mono text-label-sm uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 select-none">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>

          {renderDesktopItem(settingsItem, topItems.length)}
        </div>
      </aside>

      {/* Mobile bottom nav — shown below md, hidden md+ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-stretch h-14 bg-surface border-t border-border"
        aria-label="Main navigation"
      >
        {mobileItems.map((item, idx) => {
          if (item.href) {
            return (
              <Link
                key={idx}
                href={item.href}
                className={mobileItemClass(!!item.isActive)}
                aria-label={item.label}
              >
                {item.icon}
                <span className="font-mono text-[9px] uppercase tracking-wider select-none">
                  {item.label}
                </span>
              </Link>
            );
          }
          return (
            <button
              key={idx}
              type="button"
              aria-label={item.label}
              onClick={item.onClick}
              className={mobileItemClass(false)}
            >
              {item.icon}
              <span className="font-mono text-[9px] uppercase tracking-wider select-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
