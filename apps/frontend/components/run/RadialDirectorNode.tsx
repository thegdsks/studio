'use client';

/**
 * RadialDirectorNode — the centre-piece Director node for RadialCanvas.
 *
 * Renders a slightly larger circle (DIRECTOR_R=46) with a Clapperboard icon.
 * When allSpecialistsDone=true: animated pulsing glow ring (respects
 * prefers-reduced-motion, falls back to a static ring).
 * Clickable: navigates to /run/[runId]/agent/director.
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';
import { StatusDot, usePrefersReducedMotion } from '@studio/ui';
import type { Agent } from '@studio/shared';

export interface RadialDirectorNodeProps {
  director: Agent | undefined;
  runId: string;
  allSpecialistsDone: boolean;
  cx: number;
  cy: number;
}

const DIRECTOR_R      = 46;
const DIRECTOR_ICON   = 22;
const DIRECTOR_GLOW_R = 56;

const COLOR_SURFACE    = 'var(--color-surface-raised)';
const COLOR_ACCENT     = 'var(--color-accent)';
const COLOR_DONE       = 'var(--color-status-done)';
const COLOR_DONE_SOFT  = 'var(--color-status-done-soft)';
const COLOR_TEXT_MUTED = 'var(--color-text-muted)';
const COLOR_TEXT_FAINT = 'var(--color-text-faint)';

export function RadialDirectorNode({
  director,
  runId,
  allSpecialistsDone,
  cx,
  cy,
}: RadialDirectorNodeProps) {
  const router        = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  function handleClick() {
    router.push(`/run/${runId}/agent/director`);
  }

  const strokeColor = allSpecialistsDone ? COLOR_DONE : COLOR_ACCENT;
  const labelColor  = allSpecialistsDone ? COLOR_TEXT_MUTED : COLOR_TEXT_FAINT;
  const iconColor   = allSpecialistsDone ? COLOR_DONE : COLOR_ACCENT;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Director: ${director?.status ?? 'queued'}`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Animated glow ring when all specialists done */}
      {allSpecialistsDone && !reducedMotion && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={DIRECTOR_GLOW_R}
          fill={COLOR_DONE_SOFT}
          stroke={COLOR_DONE}
          strokeWidth={1.5}
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Static glow for reduced-motion users */}
      {allSpecialistsDone && reducedMotion && (
        <circle
          cx={cx}
          cy={cy}
          r={DIRECTOR_GLOW_R}
          fill={COLOR_DONE_SOFT}
          stroke={COLOR_DONE}
          strokeWidth={1.5}
          opacity={0.5}
        />
      )}

      {/* Director circle */}
      <circle
        cx={cx}
        cy={cy}
        r={DIRECTOR_R}
        fill={COLOR_SURFACE}
        stroke={strokeColor}
        strokeWidth={1.5}
      />

      {/* Clapperboard icon */}
      <foreignObject
        x={cx - DIRECTOR_ICON / 2}
        y={cy - DIRECTOR_ICON / 2 - 8}
        width={DIRECTOR_ICON}
        height={DIRECTOR_ICON}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <Clapperboard
          size={DIRECTOR_ICON}
          color={iconColor}
          strokeWidth={1.5}
        />
      </foreignObject>

      {/* Status dot */}
      {director && (
        <foreignObject
          x={cx + DIRECTOR_R - 8}
          y={cy - DIRECTOR_R + 2}
          width={12}
          height={12}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <StatusDot status={director.status} />
        </foreignObject>
      )}

      {/* Label */}
      <text
        x={cx}
        y={cy + DIRECTOR_R + 18}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fill={labelColor}
        letterSpacing="0.06em"
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        DIRECTOR
      </text>
    </g>
  );
}
