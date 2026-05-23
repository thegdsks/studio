'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { StatusBar, usePrefersReducedMotion } from '@studio/ui';

// ─── Rotating tip text ────────────────────────────────────────────────────────

const TIPS = [
  'Press Tab to autocomplete a suggestion',
  'Press Cmd Return to launch',
  'Click an agent tile for details',
] as const;

function RotatingTip() {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(() => {
      setOpacity(0);
      const swap = setTimeout(() => {
        setIdx((i) => (i + 1) % TIPS.length);
        setOpacity(1);
      }, 300);
      return () => clearTimeout(swap);
    }, 6000);
    return () => clearInterval(interval);
  }, [reduced]);

  return (
    <span
      className="font-mono text-label-sm text-text-faint uppercase tracking-[0.3em] select-none"
      style={{
        opacity,
        transition: reduced ? 'none' : 'opacity 300ms ease-in-out',
      }}
    >
      {TIPS[idx]}
    </span>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function ReadyDot() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-status-done"
      />
      <span className="font-mono text-label-sm text-text-faint uppercase tracking-[0.35em]">
        READY
      </span>
    </span>
  );
}

// ─── Right: docs link ─────────────────────────────────────────────────────────

function DocsLink() {
  return (
    <a
      href="https://github.com"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1 font-mono text-label-sm text-text-faint uppercase tracking-[0.3em] hover:text-text-muted transition-colors duration-micro"
    >
      Docs
      <ArrowUpRight size={12} aria-hidden="true" />
    </a>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function LandingStatusBar() {
  return (
    <StatusBar
      left={<ReadyDot />}
      center={<RotatingTip />}
      right={<DocsLink />}
    />
  );
}
