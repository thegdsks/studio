'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Share2, Copy, Home, Radius, Network } from 'lucide-react';
import Link from 'next/link';
import type { AgentStatus } from '@studio/shared';
import {
  TopBar,
  Chip,
  usePrefersReducedMotion,
} from '@studio/ui';
import { useDemoMode } from '@/lib/useDemoMode';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewMode = 'radial' | 'dag';

// ─── Timer ────────────────────────────────────────────────────────────────────

function padTwo(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatElapsedCs(ms: number): string {
  const totalCs = Math.floor(Math.max(0, ms) / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${padTwo(mins)}:${padTwo(secs)}.${padTwo(cs)}`;
}

interface ElapsedTimerProps {
  startedAt: number;
  frozen?: number;
}

function ElapsedTimer({ startedAt, frozen }: ElapsedTimerProps) {
  const [display, setDisplay] = useState(() =>
    formatElapsedCs(frozen !== undefined ? frozen - startedAt : 0),
  );
  const rafRef = useRef<number>(0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (frozen !== undefined) {
      setDisplay(formatElapsedCs(frozen - startedAt));
      return;
    }
    if (prefersReduced) {
      const id = setInterval(() => {
        setDisplay(formatElapsedCs(Date.now() - startedAt));
      }, 1000);
      return () => clearInterval(id);
    }

    let last = 0;
    function tick(ts: number) {
      if (ts - last >= 33) {
        last = ts;
        setDisplay(formatElapsedCs(Date.now() - startedAt));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startedAt, frozen, prefersReduced]);

  return (
    <span className="font-mono tabular-nums text-text text-mono-md">
      {display}
    </span>
  );
}

// ─── Status derivation ────────────────────────────────────────────────────────

type RunStatus = 'queued' | 'running' | 'done' | 'error';

const statusTone: Record<RunStatus, 'neutral' | 'accent' | 'success' | 'error'> = {
  queued: 'neutral',
  running: 'accent',
  done: 'success',
  error: 'error',
};

function deriveRunStatus(statuses: AgentStatus[], runComplete: boolean): RunStatus {
  if (runComplete) return 'done';
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.some((s) => s === 'running')) return 'running';
  return 'queued';
}

// ─── Share hook ───────────────────────────────────────────────────────────────

function useShareUrl(runHash: string): () => void {
  return () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/run/${runHash}`
        : `/run/${runHash}`;
    void navigator.clipboard.writeText(url);
  };
}

// ─── View mode toggle ─────────────────────────────────────────────────────────

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        aria-label="Radial view"
        aria-pressed={viewMode === 'radial'}
        onClick={() => setViewMode('radial')}
        className={[
          'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-label-sm transition-colors duration-[80ms]',
          viewMode === 'radial'
            ? 'bg-surface-raised text-text'
            : 'text-text-faint hover:text-text-muted',
        ].join(' ')}
      >
        <Radius className="h-3.5 w-3.5" />
        <span>Radial</span>
      </button>
      <button
        type="button"
        aria-label="DAG view"
        aria-pressed={viewMode === 'dag'}
        onClick={() => setViewMode('dag')}
        className={[
          'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-label-sm transition-colors duration-[80ms]',
          viewMode === 'dag'
            ? 'bg-surface-raised text-text'
            : 'text-text-faint hover:text-text-muted',
        ].join(' ')}
      >
        <Network className="h-3.5 w-3.5" />
        <span>DAG</span>
      </button>
    </div>
  );
}

// ─── Brand slot ───────────────────────────────────────────────────────────────

function RunBrand({ shortHash }: { shortHash: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0 shrink-0">
      <Link
        href="/"
        className="font-mono text-mono-sm text-text uppercase tracking-[0.375em] select-none hover:text-text-muted transition-colors duration-[80ms]"
        aria-label="Back to Studio"
      >
        STUDIO
      </Link>
      <span className="text-text-faint select-none" aria-hidden>/</span>
      <span className="font-mono text-label-xs tabular-nums text-text-faint border border-border rounded-sm px-1.5 py-0.5 select-none">
        [r_{shortHash}]
      </span>
    </div>
  );
}

// ─── Center slot ──────────────────────────────────────────────────────────────

interface RunCenterProps {
  startedAt: number;
  finishedAt?: number;
  runStatus: RunStatus;
  doneCount: number;
  totalCount: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function RunCenter({
  startedAt,
  finishedAt,
  runStatus,
  doneCount,
  totalCount,
  viewMode,
  setViewMode,
}: RunCenterProps) {
  const { demoMode } = useDemoMode();

  return (
    <div className="flex items-center gap-3 min-w-0">
      <Chip tone={statusTone[runStatus]}>{runStatus.toUpperCase()}</Chip>
      {demoMode && (
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-sm border border-border bg-surface-raised font-mono text-label-sm text-status-warn uppercase tracking-wider shrink-0">
          DEMO — attribution on
        </span>
      )}
      <span className="font-mono tabular-nums text-label-sm text-text-faint select-none">
        {doneCount}/{totalCount}
      </span>
      <span className="text-text-faint select-none" aria-hidden>|</span>
      <ElapsedTimer startedAt={startedAt} frozen={finishedAt} />
      <span className="hidden lg:block text-text-faint select-none" aria-hidden>|</span>
      <div className="hidden lg:block">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
    </div>
  );
}

// ─── Desktop actions ──────────────────────────────────────────────────────────

interface RunActionsProps {
  paused: boolean;
  onTogglePause: () => void;
  onShare: () => void;
}

function RunActions({ paused, onTogglePause, onShare }: RunActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={paused ? 'Resume run' : 'Pause run'}
        onClick={onTogglePause}
        className="h-10 w-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-[80ms]"
      >
        {paused
          ? <Play className="h-4 w-4" aria-hidden="true" />
          : <Pause className="h-4 w-4" aria-hidden="true" />
        }
      </button>
      <button
        type="button"
        aria-label="Copy run link"
        onClick={onShare}
        className="h-10 w-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-[80ms]"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <Link
        href="/"
        aria-label="Back to Studio"
        className="h-10 w-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-[80ms]"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

// ─── Mobile menu content ──────────────────────────────────────────────────────

interface MobileMenuProps {
  startedAt: number;
  finishedAt?: number;
  runStatus: RunStatus;
  doneCount: number;
  totalCount: number;
  paused: boolean;
  onTogglePause: () => void;
  onShare: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function MobileMenuContent({
  startedAt,
  finishedAt,
  runStatus,
  doneCount,
  totalCount,
  paused,
  onTogglePause,
  onShare,
  viewMode,
  setViewMode,
}: MobileMenuProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Status summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip tone={statusTone[runStatus]}>{runStatus.toUpperCase()}</Chip>
          <span className="font-mono tabular-nums text-label-sm text-text-faint select-none">
            {doneCount}/{totalCount} done
          </span>
        </div>
        <ElapsedTimer startedAt={startedAt} frozen={finishedAt} />
      </div>

      {/* View toggle — only shown in mobile menu when not visible in center */}
      <div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Action buttons */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-label={paused ? 'Resume run' : 'Pause run'}
          onClick={onTogglePause}
          className="flex items-center gap-2 font-mono text-label-sm text-text-muted hover:text-text transition-colors uppercase tracking-[0.08em] h-9 px-1"
        >
          {paused
            ? <Play size={14} aria-hidden="true" />
            : <Pause size={14} aria-hidden="true" />
          }
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          aria-label="Copy run link"
          onClick={onShare}
          className="flex items-center gap-2 font-mono text-label-sm text-text-muted hover:text-text transition-colors uppercase tracking-[0.08em] h-9 px-1"
        >
          <Copy size={14} aria-hidden="true" />
          Copy link
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-label-sm text-text-muted hover:text-text transition-colors uppercase tracking-[0.08em] h-9 px-1"
        >
          <Home size={14} aria-hidden="true" />
          Back to Studio
        </Link>
      </div>
    </div>
  );
}

// ─── RunTopBarComposed ────────────────────────────────────────────────────────

interface RunTopBarComposedProps {
  runHash: string;
  startedAt: number;
  finishedAt?: number;
  agentStatuses: AgentStatus[];
  runComplete: boolean;
  doneCount: number;
  totalCount: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function RunTopBarComposed({
  runHash,
  startedAt,
  finishedAt,
  agentStatuses,
  runComplete,
  doneCount,
  totalCount,
  viewMode,
  setViewMode,
}: RunTopBarComposedProps) {
  const [paused, setPaused] = useState(false);
  const runStatus = deriveRunStatus(agentStatuses, runComplete);
  const shortHash = runHash.slice(0, 8);
  const handleShare = useShareUrl(runHash);
  const togglePause = () => setPaused((v) => !v);

  return (
    <TopBar
      brand={<RunBrand shortHash={shortHash} />}
      center={
        <RunCenter
          startedAt={startedAt}
          finishedAt={finishedAt}
          runStatus={runStatus}
          doneCount={doneCount}
          totalCount={totalCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      }
      actions={
        <RunActions
          paused={paused}
          onTogglePause={togglePause}
          onShare={handleShare}
        />
      }
      mobileMenu={
        <MobileMenuContent
          startedAt={startedAt}
          finishedAt={finishedAt}
          runStatus={runStatus}
          doneCount={doneCount}
          totalCount={totalCount}
          paused={paused}
          onTogglePause={togglePause}
          onShare={handleShare}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      }
    />
  );
}
