'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutDashboard, ListChecks, Settings, Github } from 'lucide-react';

interface SidebarProps {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

export default function Sidebar({ settingsOpen: _settingsOpen, onSettingsToggle }: SidebarProps) {
  const pathname = usePathname();

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

  const bottomItem: NavItem = {
    label: 'GitHub',
    icon: <Github className="h-4 w-4 shrink-0" />,
    href: 'https://github.com/thegdsks/studio',
    external: true,
    isActive: false,
  };

  function itemClass(active: boolean) {
    const base =
      'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 w-full text-left overflow-hidden';
    if (active) {
      return `${base} bg-accent/10 text-accent border-l-2 border-accent`;
    }
    return `${base} text-text-muted hover:text-text hover:bg-surface-sunken border-l-2 border-transparent`;
  }

  function renderItem(item: NavItem, idx: number) {
    const inner = (
      <>
        <span className="shrink-0">{item.icon}</span>
        <span className="font-mono text-label-sm uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 select-none">
          {item.label}
        </span>
      </>
    );

    if (item.href && item.external) {
      return (
        <a
          key={idx}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          title={item.label}
          className={itemClass(!!item.isActive)}
        >
          {inner}
        </a>
      );
    }

    if (item.href) {
      return (
        <Link
          key={idx}
          href={item.href}
          title={item.label}
          className={itemClass(!!item.isActive)}
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
        className={itemClass(!!item.isActive)}
      >
        {inner}
      </button>
    );
  }

  return (
    <aside
      className={[
        'fixed left-4 top-16 bottom-4 z-40',
        'hidden sm:flex flex-col',
        'w-14 hover:w-[200px]',
        'transition-[width] duration-200 ease-out',
        'bg-surface-raised border border-border rounded-xl shadow-lg',
        'overflow-hidden',
        'group/sidebar',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {/* Top nav items */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {topItems.map((item, idx) => renderItem(item, idx))}

        <div className="border-t border-border my-1" />

        {renderItem(settingsItem, topItems.length)}
      </nav>

      {/* Bottom-anchored item */}
      <div className="p-2 border-t border-border">
        {renderItem(bottomItem, 99)}
      </div>
    </aside>
  );
}
