'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SettingsMenu from '@/components/SettingsMenu';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Root chrome shell.
 *
 * Layout invariant (--sidebar-width declared on <html> in globals.css):
 *   mobile  (< 768px): sidebar becomes bottom nav. Content fills full width.
 *                       pb-14 clears the 56px nav bar.
 *   tablet+ (>= 768px): 56px fixed sidebar on the left.
 *                       Content padded-left by var(--sidebar-width).
 *
 * TopBar and StatusBar apply margin-left: var(--sidebar-width) so they
 * start after the sidebar, not behind it.
 */
export default function AppShell({ children }: AppShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <div className="relative min-h-screen bg-bg text-text">
      {/* Dot-grid canvas background — decorative only */}
      <div
        className="pointer-events-none fixed inset-0 z-0 canvas-dots"
        aria-hidden="true"
      />

      {/* Fixed sidebar (desktop) / bottom nav (mobile) */}
      <Sidebar
        settingsOpen={settingsOpen}
        onSettingsToggle={() => setSettingsOpen((v) => !v)}
      />

      {/*
       * Settings menu overlay: fixed at sidebar's right edge, above the
       * settings button. The SettingsMenu itself renders null when closed.
       * Keeping it always mounted avoids layout shift on first open.
       */}
      <div className="fixed left-[72px] bottom-20 z-50">
        <SettingsMenu
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          privacyMode={privacyMode}
          onTogglePrivacy={setPrivacyMode}
        />
      </div>

      {/*
       * Content region.
       * On mobile: full width, pb-14 clears the 56px bottom nav bar.
       * On md+: left-padded by var(--sidebar-width) = 56px.
       * Inline style is intentional — CSS var not expressible as static Tailwind.
       */}
      <div
        className="relative z-10 pb-14 md:pb-0"
        style={{ paddingLeft: 'var(--sidebar-width)' }}
      >
        {children}
      </div>
    </div>
  );
}
