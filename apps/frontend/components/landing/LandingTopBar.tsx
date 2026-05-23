'use client';

import { useState } from 'react';
import { Settings, Github } from 'lucide-react';
import { TopBar, Breadcrumbs } from '@studio/ui';
import SettingsMenu from '@/components/SettingsMenu';

// ─── Brand ────────────────────────────────────────────────────────────────────

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-mono-sm text-text uppercase tracking-[0.375em] select-none">
        STUDIO
      </span>
      <span className="font-mono text-label-sm text-text-faint border border-border rounded-sm px-1.5 py-0.5 select-none">
        [v0.1]
      </span>
    </div>
  );
}

// ─── Meta row ─────────────────────────────────────────────────────────────────

function ReadyMeta() {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-status-done"
      />
      <span className="font-mono text-label-sm text-text-faint uppercase tracking-[0.3em] select-none">
        9 specialists ready
      </span>
    </div>
  );
}

// ─── Settings trigger ─────────────────────────────────────────────────────────

interface SettingsTriggerProps {
  open: boolean;
  onToggle: () => void;
}

function SettingsTrigger({ open, onToggle }: SettingsTriggerProps) {
  return (
    <button
      type="button"
      aria-label="Settings"
      aria-expanded={open}
      onClick={onToggle}
      className="h-10 w-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-[80ms]"
    >
      <Settings size={16} aria-hidden="true" />
    </button>
  );
}

// ─── Cmd K shortcut badge ─────────────────────────────────────────────────────

function CmdKBadge() {
  return (
    <span
      className="font-mono text-label-sm text-text-faint border border-border rounded-sm px-2 h-10 flex items-center select-none"
      aria-label="Press Cmd K to open command palette"
    >
      Cmd K
    </span>
  );
}

// ─── LandingTopBar ────────────────────────────────────────────────────────────

interface LandingTopBarProps {
  privacyMode: boolean;
  onTogglePrivacy: (next: boolean) => void;
}

export function LandingTopBar({ privacyMode, onTogglePrivacy }: LandingTopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Desktop actions: Cmd K badge + settings gear
  const desktopActions = (
    <div className="relative flex items-center gap-1">
      <CmdKBadge />
      <SettingsTrigger
        open={settingsOpen}
        onToggle={() => setSettingsOpen((v) => !v)}
      />
      <SettingsMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        privacyMode={privacyMode}
        onTogglePrivacy={onTogglePrivacy}
      />
    </div>
  );

  // Mobile menu sheet items: settings section inline
  const mobileMenuContent = (
    <div className="flex flex-col gap-3">
      {/* Keyboard shortcut hint */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-label-sm text-text-faint uppercase tracking-[0.08em]">
          Command palette
        </span>
        <span className="font-mono text-label-sm text-text-faint border border-border rounded-sm px-2 py-1 select-none">
          Cmd K
        </span>
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Settings link */}
      <div className="relative">
        <button
          type="button"
          aria-label="Open settings"
          onClick={() => setSettingsOpen((v) => !v)}
          className="flex items-center gap-2 font-mono text-label-sm text-text-muted hover:text-text transition-colors uppercase tracking-[0.08em] w-full py-1"
        >
          <Settings size={14} aria-hidden="true" />
          Settings
        </button>
        <SettingsMenu
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          privacyMode={privacyMode}
          onTogglePrivacy={onTogglePrivacy}
        />
      </div>

      {/* Docs link */}
      <a
        href="https://github.com"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 font-mono text-label-sm text-text-muted hover:text-text transition-colors uppercase tracking-[0.08em] py-1"
      >
        <Github size={14} aria-hidden="true" />
        Docs
      </a>
    </div>
  );

  return (
    <TopBar
      brand={<Brand />}
      center={
        <Breadcrumbs
          items={[
            { label: 'STUDIO', href: '/' },
            { label: 'LAUNCH' },
          ]}
        />
      }
      actions={desktopActions}
      mobileMenu={mobileMenuContent}
      meta={<ReadyMeta />}
    />
  );
}
