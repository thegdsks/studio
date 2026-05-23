'use client';

import Link from 'next/link';
import { LayoutDashboard, LayoutGrid } from 'lucide-react';
import { Label, Chip, Mono } from '@studio/ui';
import type { AgentStatus } from '@studio/shared';

type RunStatus = 'queued' | 'running' | 'done' | 'error';

function deriveStatus(statuses: AgentStatus[], complete: boolean): RunStatus {
  if (complete) return 'done';
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.some((s) => s === 'running')) return 'running';
  return 'queued';
}

const statusTone: Record<RunStatus, 'neutral' | 'accent' | 'success' | 'error'> = {
  queued: 'neutral',
  running: 'accent',
  done: 'success',
  error: 'error',
};

interface WorkspaceHeaderProps {
  runId: string;
  agentStatuses: AgentStatus[];
  runComplete: boolean;
}

export function WorkspaceHeader({ runId, agentStatuses, runComplete }: WorkspaceHeaderProps) {
  const status = deriveStatus(agentStatuses, runComplete);
  const shortHash = runId.slice(0, 8);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface flex items-center h-12 px-4 gap-4">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="font-mono text-label-sm tracking-widest text-text uppercase select-none"
          style={{ letterSpacing: '0.15em' }}
        >
          STUDIO
        </span>
        <span className="font-mono text-label-sm text-text-faint">Workspace</span>
        <Mono className="text-label-sm text-text-faint border border-border rounded-sm px-1.5 py-0.5">
          [{shortHash}]
        </Mono>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 flex-shrink-0">
        <Chip tone={statusTone[status]}>{status}</Chip>
        <Link
          href={`/run/${runId}`}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-text-muted hover:border-border-strong hover:text-text transition-colors"
          aria-label="View grid"
        >
          <LayoutGrid className="h-3 w-3" />
          <Label>View grid</Label>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-text-muted hover:border-border-strong hover:text-text transition-colors"
          aria-label="Dashboard"
        >
          <LayoutDashboard className="h-3 w-3" />
          <Label>Dashboard</Label>
        </Link>
      </div>
    </header>
  );
}
