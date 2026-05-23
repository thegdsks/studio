'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import type { AgentStatus } from '@studio/shared';
import { Chip, Label, cn } from '@studio/ui';
import { usePrefersReducedMotion } from '@studio/ui';

// ─── Timer ───────────────────────────────────────────────────────────────────

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
    <span className="font-mono tabular-nums text-text" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
      {display}
    </span>
  );
}

// ─── Status pill ─────────────────────────────────────────────────────────────

type RunStatus = 'queued' | 'running' | 'done' | 'error';

const statusTone: Record<RunStatus, 'neutral' | 'accent' | 'success' | 'error'> = {
  queued: 'neutral',
  running: 'accent',
  done: 'success',
  error: 'error',
};

function deriveRunStatus(
  statuses: AgentStatus[],
  runComplete: boolean,
): RunStatus {
  if (runComplete) return 'done';
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.some((s) => s === 'running')) return 'running';
  return 'queued';
}

// ─── RunTopBar ────────────────────────────────────────────────────────────────

interface RunTopBarProps {
  runHash: string;
  startedAt: number;
  finishedAt?: number;
  agentStatuses: AgentStatus[];
  runComplete: boolean;
}

export function RunTopBar({
  runHash,
  startedAt,
  finishedAt,
  agentStatuses,
  runComplete,
}: RunTopBarProps) {
  const runStatus = deriveRunStatus(agentStatuses, runComplete);
  const shortHash = runHash.slice(0, 8);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface flex items-center h-12 px-4 gap-4">
      {/* Left: wordmark + run hash */}
      <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
        <span
          className="font-mono text-label-sm tracking-widest text-text uppercase select-none"
          style={{ letterSpacing: '0.15em' }}
        >
          STUDIO
        </span>
        <span
          className={cn(
            'font-mono text-label-sm tabular-nums text-text-faint',
            'border border-border rounded-sm px-1.5 py-0.5 select-none',
          )}
        >
          [{shortHash}]
        </span>
      </div>

      {/* Center: elapsed timer */}
      <div className="flex-1 flex items-center justify-center">
        <Label className="mr-2 text-text-faint">elapsed</Label>
        <ElapsedTimer startedAt={startedAt} frozen={finishedAt} />
      </div>

      {/* Right: status pill + workspace + dashboard links */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Chip tone={statusTone[runStatus]}>{runStatus}</Chip>
        <Link
          href={`/workspace/${runHash}`}
          aria-label="Open workspace"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-text-muted hover:border-border-strong hover:text-text transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          <Label>Workspace</Label>
        </Link>
        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-text-muted hover:border-border-strong hover:text-text transition-colors"
        >
          <LayoutDashboard className="h-3 w-3" />
          <Label>Dashboard</Label>
        </Link>
      </div>
    </header>
  );
}
