'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SettingsMenu from '@/components/SettingsMenu';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <div className="relative min-h-screen bg-bg text-text">
      {/* Subtle dot-grid canvas pattern: light dots on dark, dark dots on light */}
      <div
        className="pointer-events-none fixed inset-0 z-0 canvas-dots"
        aria-hidden="true"
      />

      {/* Sidebar with settings dropdown anchored to it */}
      <div className="relative z-40">
        <Sidebar
          settingsOpen={settingsOpen}
          onSettingsToggle={() => setSettingsOpen((v) => !v)}
        />

        {/* Settings menu positioned near the sidebar */}
        {settingsOpen && (
          <div className="fixed left-[72px] bottom-20 z-50">
            <SettingsMenu
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              privacyMode={privacyMode}
              onTogglePrivacy={setPrivacyMode}
            />
          </div>
        )}
      </div>

      {/* Page content: shifted right to clear the sidebar */}
      <div className="relative z-10 sm:pl-20">
        {children}
      </div>
    </div>
  );
}
