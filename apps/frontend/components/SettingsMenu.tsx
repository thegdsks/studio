'use client';

import { useEffect, useRef, useState } from 'react';
import { Github } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { PrivacyToggle } from '@/components/PrivacyToggle';

interface UsageData {
  runsInWindow: number;
  maxPerHour: number;
  mockOnly: boolean;
  windowMs: number;
}

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
  privacyMode: boolean;
  onTogglePrivacy: (next: boolean) => void;
}

export default function SettingsMenu({
  open,
  onClose,
  privacyMode,
  onTogglePrivacy,
}: SettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageError, setUsageError] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Fetch usage when opened
  useEffect(() => {
    if (!open) return;
    setUsage(null);
    setUsageError(false);
    fetch('/api/usage')
      .then((r) => {
        if (!r.ok) throw new Error('non-ok');
        return r.json() as Promise<UsageData>;
      })
      .then(setUsage)
      .catch(() => setUsageError(true));
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 z-[90] w-60 bg-surface border border-border rounded-sm shadow-lg"
      role="menu"
    >
      {/* Appearance */}
      <div className="px-3 pt-3 pb-2">
        <span className="font-mono text-label-sm text-text-faint uppercase tracking-wider">
          [ APPEARANCE ]
        </span>
        <div className="mt-2 flex items-center gap-2">
          <ThemeToggle />
          <span className="font-mono text-label-sm text-text-muted">Theme</span>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Privacy */}
      <div className="px-3 py-2">
        <span className="font-mono text-label-sm text-text-faint uppercase tracking-wider">
          [ PRIVACY ]
        </span>
        <div className="mt-2">
          <PrivacyToggle value={privacyMode} onChange={onTogglePrivacy} />
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Status */}
      <div className="px-3 py-2">
        <span className="font-mono text-label-sm text-text-faint uppercase tracking-wider">
          [ STATUS ]
        </span>
        <div className="mt-2 flex flex-col gap-1">
          {usageError ? (
            <span className="font-mono text-label-sm text-text-faint">
              UNAVAILABLE
            </span>
          ) : usage === null ? (
            <span className="font-mono text-label-sm text-text-faint">
              LOADING...
            </span>
          ) : (
            <>
              <span className="font-mono text-label-sm text-text-muted">
                MOCK_ONLY:{' '}
                <span
                  className={
                    usage.mockOnly ? 'text-status-warn' : 'text-status-done'
                  }
                >
                  {usage.mockOnly ? 'ON' : 'OFF'}
                </span>
              </span>
              <span className="font-mono text-label-sm text-text-muted">
                RATE: {usage.runsInWindow}/{usage.maxPerHour} /h
              </span>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* GitHub link */}
      <div className="px-3 py-2">
        <a
          href="https://github.com/thegdsks/studio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-label-sm text-text-muted hover:text-text transition-colors"
          onClick={onClose}
        >
          <Github className="h-4 w-4 shrink-0" />
          VIEW ON GITHUB
        </a>
      </div>
    </div>
  );
}
