'use client';

/**
 * DagNode — circular node in the DAG canvas.
 * Shows Lucide agent icon, short name, status dot ring.
 * Animated ring pulses on `running`; flashes green on `done`.
 * Click navigates to /run/[runId]/agent/[agentId].
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { StatusDot, usePrefersReducedMotion } from '@studio/ui';
import { iconFor } from '@/lib/agentIcons';
import type { Agent } from '@studio/shared';

export interface DagNodeProps {
  agent: Agent;
  /** Centre x in SVG coordinate space */
  cx: number;
  /** Centre y in SVG coordinate space */
  cy: number;
  runId: string;
}

// Node geometry (SVG units matching viewBox 600x520)
const NODE_R       = 36;   // circle radius
const RING_R       = 42;   // animated ring radius (6px gap outside node)
const ICON_SIZE    = 18;   // px for the foreignObject icon
const LABEL_OFFSET = 54;   // y offset below centre for name label

// Token-derived colours (CSS vars; no hex literals in component logic)
const COLOR_SURFACE    = 'var(--color-surface-raised)';
const COLOR_BORDER     = 'var(--color-border-strong)';
const COLOR_RUNNING    = 'var(--color-status-running)';
const COLOR_DONE       = 'var(--color-status-done)';
const COLOR_ERROR      = 'var(--color-status-error)';
const COLOR_TEXT_MUTED = 'var(--color-text-muted)';

function ringColor(status: Agent['status']): string {
  switch (status) {
    case 'running': return COLOR_RUNNING;
    case 'done':    return COLOR_DONE;
    case 'error':   return COLOR_ERROR;
    default:        return 'transparent';
  }
}

function iconColor(status: Agent['status']): string {
  switch (status) {
    case 'running': return COLOR_RUNNING;
    case 'done':    return COLOR_DONE;
    case 'error':   return COLOR_ERROR;
    default:        return COLOR_TEXT_MUTED;
  }
}

export function DagNode({ agent, cx, cy, runId }: DagNodeProps) {
  const router        = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const Icon          = iconFor(agent.id);

  const isRunning = agent.status === 'running';
  const isDone    = agent.status === 'done';
  const isError   = agent.status === 'error';
  const hasRing   = isRunning || isDone || isError;

  function handleClick() {
    router.push(`/run/${runId}/agent/${agent.id}`);
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${agent.name}: ${agent.status}`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Animated ring — running pulses, done/error shows static ring */}
      {hasRing && !reducedMotion && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={RING_R}
          fill="none"
          stroke={ringColor(agent.status)}
          strokeWidth={1.5}
          animate={isRunning ? { opacity: [0.15, 0.65, 0.15] } : { opacity: 0.45 }}
          transition={isRunning
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0 }
          }
        />
      )}

      {/* Node circle */}
      <circle
        cx={cx}
        cy={cy}
        r={NODE_R}
        fill={COLOR_SURFACE}
        stroke={hasRing ? ringColor(agent.status) : COLOR_BORDER}
        strokeWidth={hasRing ? 1.5 : 1}
      />

      {/* Icon via foreignObject so Lucide React renders correctly */}
      <foreignObject
        x={cx - ICON_SIZE / 2}
        y={cy - ICON_SIZE / 2 - 6}
        width={ICON_SIZE}
        height={ICON_SIZE}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <Icon
          size={ICON_SIZE}
          color={iconColor(agent.status)}
          strokeWidth={1.5}
        />
      </foreignObject>

      {/* Status dot — top-right corner of node circle */}
      <foreignObject
        x={cx + NODE_R - 8}
        y={cy - NODE_R + 2}
        width={12}
        height={12}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <StatusDot status={agent.status} />
      </foreignObject>

      {/* Name label */}
      <text
        x={cx}
        y={cy + LABEL_OFFSET}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fill={COLOR_TEXT_MUTED}
        letterSpacing="0.06em"
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {agent.name}
      </text>
    </g>
  );
}
