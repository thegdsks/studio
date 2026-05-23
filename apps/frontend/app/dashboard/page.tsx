'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { Card, Label, Mono } from '@studio/ui';
import type { ListRunsResponse, RunSummary } from '@studio/shared';
import { RunSparkline } from '@/components/dashboard/RunSparkline';

const REFRESH_MS = 4000;

type Filter = 'all' | 'privacy' | 'cloud' | 'in-progress' | 'errors';

export default function DashboardPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/runs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ListRunsResponse;
      setRuns(data.runs);
      setError(null);
      setLastFetched(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const handleDelete = useCallback(
    async (runId: string) => {
      if (!window.confirm('Delete this run? This cannot be undone.')) return;
      try {
        const res = await fetch(`/api/runs/${runId}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) {
          throw new Error(`HTTP ${res.status}`);
        }
        setRuns((prev) => prev.filter((r) => r.run_id !== runId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    [],
  );

  const stats = useMemo(() => {
    const total = runs.length;
    const completed = runs.filter((r) => typeof r.finishedAt === 'number').length;
    const inProgress = total - completed;
    const privacy = runs.filter((r) => r.privacy_mode).length;
    const localCount = runs.reduce((acc, r) => acc + r.ranLocally, 0);
    const totalUsd = runs.reduce((acc, r) => acc + (r.cost_usd ?? 0), 0);
    return { total, completed, inProgress, privacy, localCount, totalUsd };
  }, [runs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      // Filter chip
      switch (filter) {
        case 'privacy':     if (!r.privacy_mode) return false; break;
        case 'cloud':       if (r.privacy_mode) return false; break;
        case 'in-progress': if (typeof r.finishedAt === 'number') return false; break;
        case 'errors':      if (r.counts.error === 0) return false; break;
        case 'all':         break;
      }
      // Free-text on idea + run id
      if (q && !r.idea.toLowerCase().includes(q) && !r.run_id.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [runs, filter, query]);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="sticky top-0 z-header border-b border-border bg-surface">
        <div className="mx-auto max-w-page pl-20 pr-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Label>Mission control</Label>
            <h1 className="text-headline-md font-display text-text">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-mono-sm text-text-faint">
            {lastFetched && (
              <span>
                <Label className="mr-1.5">updated</Label>
                <span className="text-text-muted">{formatTime(lastFetched)}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-text-muted hover:border-border-strong hover:text-text transition-colors duration-micro"
              aria-label="Refresh"
            >
              <RefreshCw className="h-3 w-3" />
              refresh
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-sm bg-accent text-text-on-accent px-3 py-1 font-mono text-label-sm uppercase tracking-wider hover:opacity-90 transition-opacity duration-micro"
            >
              New idea
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-page px-4 py-6 flex flex-col gap-6">
        <StatsRow stats={stats} />

        {/* Sparkline: last 30 runs color-coded by status */}
        <RunSparkline runs={runs} />

        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
          counts={{
            all: runs.length,
            privacy: runs.filter((r) => r.privacy_mode).length,
            cloud: runs.filter((r) => !r.privacy_mode).length,
            'in-progress': runs.filter((r) => typeof r.finishedAt !== 'number').length,
            errors: runs.filter((r) => r.counts.error > 0).length,
          }}
        />

        {error && (
          <p className="text-body-sm text-status-error font-mono">
            [dashboard] {error}
          </p>
        )}

        {loading && runs.length === 0 ? (
          <p className="text-body-sm text-text-faint italic">Loading runs…</p>
        ) : runs.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <p className="text-body-sm text-text-faint italic">
            No runs match the current filter.
          </p>
        ) : (
          <RunsList runs={filtered} onDelete={(id) => void handleDelete(id)} />
        )}
      </main>
    </div>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────────────

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  privacy: number;
  localCount: number;
  totalUsd: number;
}

function StatsRow({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Stat label="Total runs" value={stats.total} />
      <Stat label="Completed" value={stats.completed} />
      <Stat label="In progress" value={stats.inProgress} highlight={stats.inProgress > 0} />
      <Stat label="Privacy mode" value={stats.privacy} iconAccent />
      <Stat label="Local agent runs" value={stats.localCount} iconAccent />
      <Stat label="Cost (USD)" value={formatUsd(stats.totalUsd)} />
    </div>
  );
}

function Stat({ label, value, highlight, iconAccent }: { label: string; value: number | string; highlight?: boolean; iconAccent?: boolean }) {
  return (
    <Card tone={highlight ? 'active' : 'resting'} className="px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {iconAccent && <ShieldCheck className="h-3 w-3 text-accent" />}
        <Label>{label}</Label>
      </div>
      <span className="font-mono text-headline-lg text-text tabular-nums leading-none">
        {value}
      </span>
    </Card>
  );
}

// ─── Filter Bar ─────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  privacy: 'Privacy',
  cloud: 'Cloud',
  'in-progress': 'In progress',
  errors: 'Errors',
};

function FilterBar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  counts,
}: {
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  counts: Record<Filter, number>;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={[
                'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1',
                'font-mono text-label-sm uppercase tracking-wider',
                'transition-colors duration-micro border',
                active
                  ? 'bg-accent text-text-on-accent border-accent'
                  : 'bg-surface-raised text-text-muted border-border hover:border-border-strong hover:text-text',
              ].join(' ')}
            >
              {FILTER_LABELS[f]}
              <span
                className={[
                  'inline-flex min-w-[1.25rem] justify-center px-1 rounded-sm tabular-nums',
                  active
                    ? 'bg-bg/30 text-text-on-accent'
                    : 'bg-surface-sunken text-text-faint',
                ].join(' ')}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-faint pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search idea or run id"
          className="
            w-full bg-surface-sunken border border-border rounded-sm
            font-mono text-body-sm text-text placeholder:text-text-faint
            pl-7 pr-2 py-1.5 focus:outline-none focus:border-border-accent
            transition-colors
          "
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// ─── Runs List ──────────────────────────────────────────────────────────────

function RunsList({ runs, onDelete }: { runs: RunSummary[]; onDelete: (id: string) => void }) {
  return (
    <ul className="flex flex-col gap-3">
      {runs.map((run) => (
        <li key={run.run_id}>
          <RunRow run={run} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}

function RunRow({ run, onDelete }: { run: RunSummary; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const done = typeof run.finishedAt === 'number';
  const hasError = run.counts.error > 0;
  const elapsed = done && run.finishedAt
    ? formatDuration(run.finishedAt - run.startedAt)
    : formatDuration(Date.now() - run.startedAt);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    void navigator.clipboard.writeText(run.run_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(run.run_id);
  }

  const tone = hasError ? 'error' : done ? 'resting' : 'active';

  return (
    <Card tone={tone} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
      <Link
        href={`/run/${run.run_id}`}
        className="flex-1 min-w-0 flex flex-col gap-1 focus:outline-none group"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-text-muted">Idea</Label>
          <span className="text-body-md text-text truncate group-hover:text-accent transition-colors duration-micro">
            {run.idea}
          </span>
          {run.privacy_mode && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-border-accent bg-accent-soft text-accent font-mono text-label-sm uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" />
              privacy
            </span>
          )}
          {run.ranLocally > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-border-accent bg-accent-soft text-accent font-mono text-label-sm uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              {run.ranLocally} via gemma
            </span>
          )}
          {hasError && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-status-error bg-status-error-soft text-status-error font-mono text-label-sm uppercase tracking-wider">
              {run.counts.error} errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-text-faint">
          <Mono className="text-mono-sm">{run.run_id.slice(0, 8)}</Mono>
          <span className="text-text-faint">·</span>
          <span className="text-body-sm">
            <Label className="mr-1.5">{done ? 'finished' : 'running'}</Label>
            <span className="text-text-muted font-mono tabular-nums">{elapsed}</span>
          </span>
          <span className="text-body-sm">
            <Label className="mr-1.5">cost</Label>
            <span className="text-text-muted font-mono tabular-nums">{formatUsd(run.cost_usd ?? 0)}</span>
          </span>
        </div>
      </Link>

      <AgentMiniGrid run={run} />

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy run id"
          aria-label="Copy run id"
          className="p-1.5 rounded-sm text-text-faint hover:text-text hover:bg-surface-raised transition-colors duration-micro"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-status-done" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          title="Delete run"
          aria-label="Delete run"
          className="p-1.5 rounded-sm text-text-faint hover:text-status-error hover:bg-surface-raised transition-colors duration-micro"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <Link
          href={`/run/${run.run_id}`}
          className="p-1.5 rounded-sm text-text-faint hover:text-text hover:bg-surface-raised transition-colors duration-micro"
          aria-label="Open run"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function AgentMiniGrid({ run }: { run: RunSummary }) {
  const dotColor = (s: 'queued' | 'running' | 'done' | 'error'): string => {
    switch (s) {
      case 'queued':  return 'bg-status-queued';
      case 'running': return 'bg-status-running';
      case 'done':    return 'bg-status-done';
      case 'error':   return 'bg-status-error';
    }
  };

  const slots: ('done' | 'running' | 'error' | 'queued')[] = [];
  for (let i = 0; i < run.counts.done; i++) slots.push('done');
  for (let i = 0; i < run.counts.running; i++) slots.push('running');
  for (let i = 0; i < run.counts.error; i++) slots.push('error');
  for (let i = 0; i < run.counts.queued; i++) slots.push('queued');
  while (slots.length < run.total) slots.push('queued');

  return (
    <div className="flex items-center gap-1 shrink-0" aria-label="Agent status">
      {slots.slice(0, run.total).map((status, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-2 rounded-full ${dotColor(status)}`}
          title={status}
        />
      ))}
      <span className="ml-2 font-mono text-mono-sm text-text-faint tabular-nums">
        {run.counts.done}/{run.total}
      </span>
    </div>
  );
}

// ─── Empty + utils ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="p-12 flex flex-col items-center text-center gap-3">
      <Label>No runs yet</Label>
      <p className="text-body-md text-text-muted max-w-prose">
        Launch your first idea on the landing page. Runs will appear here in real time and persist across restarts.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-accent text-text-on-accent px-4 py-2 font-mono text-label-sm uppercase tracking-wider hover:opacity-90 transition-opacity duration-micro"
      >
        Launch a run
        <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 0) return '0s';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${(sec % 60).toString().padStart(2, '0')}s`;
}

function formatUsd(usd: number): string {
  if (!usd || usd <= 0) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}
