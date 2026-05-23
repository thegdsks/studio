'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Share2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import type { AgentStatus } from '@studio/shared';
import {
  TopBar,
  Breadcrumbs,
  Button,
  Chip,
  Label,
  usePrefersReducedMotion,
} from '@studio/ui';

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
    <span className="font-mono tabular-nums text-text text-mono-md">
      {display}
    </span>
  );
}

// ─── Status ───────────────────────────────────────────────────────────────────

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

// ─── Share ────────────────────────────────────────────────────────────────────

function useShareUrl(runHash: string): () => void {
  return () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/run/${runHash}`
        : `/run/${runHash}`;
    void navigator.clipboard.writeText(url);
  };
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
}

export function RunTopBarComposed({
  runHash,
  startedAt,
  finishedAt,
  agentStatuses,
  runComplete,
  doneCount,
  totalCount,
}: RunTopBarComposedProps) {
  const [paused, setPaused] = useState(false);
  const runStatus = deriveRunStatus(agentStatuses, runComplete);
  const shortHash = runHash.slice(0, 8);
  const handleShare = useShareUrl(runHash);

  const brand = (
    <div className="flex items-center gap-2">
      <span className="font-mono text-label-sm tracking-[0.15em] text-text uppercase select-none">
        STUDIO
      </span>
      <span className="font-mono text-label-xs tabular-nums text-text-faint border border-border rounded-sm px-1.5 py-0.5 select-none">
        [r_{shortHash}]
      </span>
    </div>
  );

  const center = (
    <div className="flex items-center gap-4">
      <Breadcrumbs
        items={[
          { label: 'STUDIO', href: '/' },
          { label: 'RUN' },
          { label: `r_${shortHash}` },
        ]}
      />
      <span className="text-text-faint select-none" aria-hidden>|</span>
      <ElapsedTimer startedAt={startedAt} frozen={finishedAt} />
    </div>
  );

  const actions = (
    <>
      <Chip tone={statusTone[runStatus]}>{runStatus.toUpperCase()}</Chip>
      <Label className="font-mono tabular-nums text-text-faint">
        {doneCount} / {totalCount} DONE
      </Label>
      <Button
        variant="ghost"
        size="md"
        iconLeft={paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        aria-label={paused ? 'Resume run' : 'Pause run'}
        onClick={() => setPaused((v) => !v)}
      >
        {paused ? 'Resume' : 'Pause'}
      </Button>
      <Button
        variant="ghost"
        size="md"
        iconLeft={<Share2 className="h-4 w-4" />}
        onClick={handleShare}
        aria-label="Copy run link"
      >
        Share
      </Button>
      <Link
        href="/dashboard"
        aria-label="Dashboard"
        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors text-title-md font-medium"
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
    </>
  );

  return <TopBar brand={brand} center={center} actions={actions} />;
}
