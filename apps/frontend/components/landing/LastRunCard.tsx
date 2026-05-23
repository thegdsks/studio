'use client';

/**
 * LastRunCard — shows a mini-card for the most recent run.
 * Polls GET /api/runs?limit=1 on mount. Clicking navigates to /run/<id>.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { RunSummary } from '@studio/shared';

interface ListResponse {
  runs: RunSummary[];
}

function formatUsd(v: number | undefined): string {
  if (!v || v <= 0) return '$0.00';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(3)}`;
}

export function LastRunCard() {
  const [run, setRun] = useState<RunSummary | null>(null);

  useEffect(() => {
    async function fetchLast() {
      try {
        const res = await fetch('/api/runs?limit=1');
        if (!res.ok) return;
        const data = (await res.json()) as ListResponse;
        const first = data.runs[0];
        if (first) setRun(first);
      } catch {
        // best-effort — no visible error for this widget
      }
    }

    void fetchLast();
  }, []);

  if (!run) return null;

  const done = typeof run.finishedAt === 'number';
  const statusLabel = done ? 'finished' : 'running';

  return (
    <Link
      href={`/run/${run.run_id}`}
      className="group w-full max-w-2xl flex items-center justify-between gap-4 rounded-sm border border-border bg-surface-raised px-4 py-3 hover:border-border-strong transition-colors duration-micro"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-label-xs text-text-faint uppercase tracking-[0.35em]">
          Last run
        </span>
        <span className="text-body-sm text-text-muted truncate group-hover:text-text transition-colors duration-micro">
          {run.idea.length > 72 ? `${run.idea.slice(0, 72)}…` : run.idea}
        </span>
        <span className="font-mono text-[10px] text-text-faint">
          <span className={done ? 'text-status-done' : 'text-accent'}>
            {statusLabel}
          </span>
          {' · '}
          {formatUsd(run.cost_usd)}
        </span>
      </div>
      <ArrowRight className="h-4 w-4 text-text-faint group-hover:text-text-muted shrink-0 transition-colors duration-micro" />
    </Link>
  );
}
