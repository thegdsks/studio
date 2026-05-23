'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import SettingsMenu from '@/components/SettingsMenu';

interface TopBarProps {
  privacyMode: boolean;
  onTogglePrivacy: (v: boolean) => void;
}

export function TopBar({ privacyMode, onTogglePrivacy }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="h-11 flex items-center justify-between px-6">
        {/* Word-mark */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-mono-sm text-text uppercase tracking-[0.375em]">
            STUDIO
          </span>
          <span className="font-mono text-label-sm text-text-faint border border-border rounded-sm px-1.5 py-0.5">
            [v0.1]
          </span>
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            onClick={() => setSettingsOpen((v) => !v)}
            className="p-1.5 rounded-sm hover:bg-surface-raised transition-colors duration-[80ms] ease-linear text-text-muted hover:text-text"
          >
            <Settings className="h-4 w-4" />
          </button>
          <SettingsMenu
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            privacyMode={privacyMode}
            onTogglePrivacy={onTogglePrivacy}
          />
        </div>
      </div>
      {/* Hairline divider at 4% opacity */}
      <div className="h-px bg-white/[0.04]" />
    </header>
  );
}
