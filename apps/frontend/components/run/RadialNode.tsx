'use client';

/**
 * RadialNode — a specialist agent node for the radial canvas.
 *
 * Identical visual language to DagNode (same geometry constants, same ring
 * pulse/done animations, same icon + label layout) but the label is positioned
 * radially outward from centre rather than always below. This avoids a bespoke
 * prop on DagNode that would couple it to radial geometry.
 *
 * Label placement:
 *   - angle is from centre (300, 300) to the node centre.
 *   - label sits LABEL_OFFSET SVG-units further along that radial direction.
 *   - textAnchor toggles between start/middle/end based on the quadrant so it
 *     never clips against the ring boundary.
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { StatusDot, usePrefersReducedMotion } from '@studio/ui';
import { iconFor } from '@/lib/agentIcons';
import type { Agent } from '@studio/shared';

export interface RadialNodeProps {
  agent: Agent;
  cx: number;
  cy: number;
  /** Angle in radians from canvas centre to (cx, cy), used for label offset */
  angle: number;
  runId: string;
}

const NODE_R       = 36;
const RING_R       = 42;
const ICON_SIZE    = 18;
const LABEL_OFFSET = 58;  // SVG units outward from node centre

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

/**
 * Determine SVG textAnchor based on angle so the label doesn't overlap the ring.
 * Right half: start, Left half: end, Top/bottom near-vertical: middle.
 */
function textAnchorForAngle(angle: number): 'start' | 'middle' | 'end' {
  const deg = ((angle * 180) / Math.PI + 360) % 360;
  if (deg < 30 || deg > 330) return 'middle';   // top
  if (deg > 150 && deg < 210) return 'middle';   // bottom
  if (deg >= 30 && deg <= 150) return 'start';   // right side
  return 'end';                                   // left side
}

export function RadialNode({ agent, cx, cy, angle, runId }: RadialNodeProps) {
  const router        = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const Icon          = iconFor(agent.id);

  const isRunning = agent.status === 'running';
  const isDone    = agent.status === 'done';
  const isError   = agent.status === 'error';
  const hasRing   = isRunning || isDone || isError;

  // Label position: push LABEL_OFFSET units outward from node centre along the radial angle
  const labelX = cx + Math.cos(angle) * LABEL_OFFSET;
  const labelY = cy + Math.sin(angle) * LABEL_OFFSET;
  const anchor = textAnchorForAngle(angle);

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
      {/* Animated ring */}
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

      {/* Icon */}
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

      {/* Status dot — top-right corner */}
      <foreignObject
        x={cx + NODE_R - 8}
        y={cy - NODE_R + 2}
        width={12}
        height={12}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <StatusDot status={agent.status} />
      </foreignObject>

      {/* Radially-positioned name label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor={anchor}
        dominantBaseline="middle"
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
