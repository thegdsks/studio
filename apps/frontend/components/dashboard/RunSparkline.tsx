'use client';

/**
 * RunSparkline — a 32px-tall SVG dot strip showing the last 30 runs.
 *
 * Each dot is color-coded by status (done / running / error / mixed).
 * Hover shows a tooltip with the idea + cost. Pure SVG, no chart library.
 */

import { useState } from 'react';
import type { RunSummary } from '@studio/shared';

// CSS variable references — no hex literals
const DOT_COLORS = {
  done:       'var(--color-status-done)',
  running:    'var(--color-accent)',
  error:      'var(--color-status-error)',
  mixed:      'var(--color-status-warn)',
} as const;

type DotStatus = keyof typeof DOT_COLORS;

function resolveDotStatus(run: RunSummary): DotStatus {
  if (run.counts.error > 0 && typeof run.finishedAt === 'number') return 'error';
  if (typeof run.finishedAt !== 'number') return 'running';
  if (run.counts.done < run.total) return 'mixed';
  return 'done';
}

function formatUsd(v: number | undefined): string {
  if (!v || v <= 0) return '$0.00';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(3)}`;
}

interface SparkDotProps {
  cx: number;
  cy: number;
  r: number;
  run: RunSummary;
  status: DotStatus;
  onHover: (run: RunSummary, x: number, y: number) => void;
  onLeave: () => void;
}

function SparkDot({ cx, cy, r, run, status, onHover, onLeave }: SparkDotProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={DOT_COLORS[status]}
      opacity={0.85}
      style={{ cursor: 'pointer' }}
      onMouseEnter={(e) => {
        const rect = (e.target as SVGCircleElement).getBoundingClientRect();
        onHover(run, rect.left + rect.width / 2, rect.top);
      }}
      onMouseLeave={onLeave}
      aria-label={`${run.idea.slice(0, 40)} — ${status}`}
      role="img"
    />
  );
}

interface TooltipProps {
  run: RunSummary;
  x: number;
  y: number;
}

function SparkTooltip({ run, x, y }: TooltipProps) {
  return (
    <div
      className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-full mb-2 px-2 py-1.5 rounded-sm border border-border bg-surface shadow-md max-w-[240px]"
      style={{ left: x, top: y - 6 }}
    >
      <p className="font-mono text-[10px] text-text-muted leading-snug line-clamp-2">
        {run.idea}
      </p>
      <p className="font-mono text-[10px] text-text-faint tabular-nums mt-0.5">
        {formatUsd(run.cost_usd)} ·{' '}
        {typeof run.finishedAt === 'number' ? 'done' : 'running'}
      </p>
    </div>
  );
}

interface RunSparklineProps {
  runs: RunSummary[];
}

const STRIP_HEIGHT = 32;
const DOT_R = 4;
const DOT_GAP = 12;
const PADDING_X = DOT_R;
const PADDING_Y = DOT_R;

export function RunSparkline({ runs }: RunSparklineProps) {
  const [hovered, setHovered] = useState<{ run: RunSummary; x: number; y: number } | null>(null);

  // Show last 30, oldest left
  const slice = runs.slice(-30);
  if (slice.length === 0) return null;

  const cy = STRIP_HEIGHT / 2;
  const width = PADDING_X * 2 + (slice.length - 1) * DOT_GAP + DOT_R * 2;

  return (
    <div className="w-full relative" aria-label="Recent runs sparkline">
      <svg
        width="100%"
        height={STRIP_HEIGHT}
        viewBox={`0 0 ${width} ${STRIP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="block"
        style={{ minHeight: STRIP_HEIGHT }}
      >
        {slice.map((run, i) => {
          const cx = PADDING_X + DOT_R + i * DOT_GAP;
          const status = resolveDotStatus(run);
          return (
            <SparkDot
              key={run.run_id}
              cx={cx}
              cy={cy + PADDING_Y - DOT_R}
              r={DOT_R}
              run={run}
              status={status}
              onHover={(r, x, y) => setHovered({ run: r, x, y })}
              onLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {hovered && (
        <SparkTooltip run={hovered.run} x={hovered.x} y={hovered.y} />
      )}
    </div>
  );
}
