'use client';

/**
 * DagEdge — SVG bezier path connecting two DAG nodes.
 * Pulses once (strokeDashoffset animation) when `sourceDone` flips true.
 * Respects prefers-reduced-motion: pulse is skipped entirely.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@studio/ui';

export interface DagEdgeProps {
  /** Start centre x (SVG units) */
  x1: number;
  /** Start centre y (SVG units) */
  y1: number;
  /** End centre x (SVG units) */
  x2: number;
  /** End centre y (SVG units) */
  y2: number;
  /** Whether the source node has status === 'done' */
  sourceDone: boolean;
  /** Whether the source node has status === 'running' */
  sourceRunning: boolean;
}

// Token-derived constants — CSS vars, no raw hex literals
const EDGE_STROKE_IDLE   = 'var(--color-border-strong)';
const EDGE_STROKE_ACTIVE = 'var(--color-status-running)';
const EDGE_STROKE_DONE   = 'var(--color-status-done)';
const EDGE_OPACITY_IDLE   = 0.35;
const EDGE_OPACITY_ACTIVE = 0.7;

// Pulse dash: short marker racing along the path once on done transition
const PULSE_DASH = 8;
const PULSE_GAP  = 200;

export function DagEdge({ x1, y1, x2, y2, sourceDone, sourceRunning }: DagEdgeProps) {
  const reducedMotion = usePrefersReducedMotion();
  const prevDoneRef   = useRef(sourceDone);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (!reducedMotion && !prevDoneRef.current && sourceDone) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 800);
      prevDoneRef.current = sourceDone;
      return () => clearTimeout(t);
    }
    prevDoneRef.current = sourceDone;
    return undefined;
  }, [sourceDone, reducedMotion]);

  // Cubic bezier: control points pull vertically for wave topology flow
  const dy = Math.abs(y2 - y1) * 0.5;
  const d  = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

  const stroke = sourceDone
    ? EDGE_STROKE_DONE
    : sourceRunning
      ? EDGE_STROKE_ACTIVE
      : EDGE_STROKE_IDLE;

  const opacity = sourceRunning || sourceDone ? EDGE_OPACITY_ACTIVE : EDGE_OPACITY_IDLE;

  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth={1.5}
      fill="none"
      strokeLinecap="round"
      opacity={opacity}
      strokeDasharray={pulsing ? `${PULSE_DASH} ${PULSE_GAP}` : undefined}
      animate={pulsing && !reducedMotion ? { strokeDashoffset: [0, -(PULSE_DASH + PULSE_GAP)] } : {}}
      transition={pulsing && !reducedMotion ? { duration: 0.8, ease: 'linear' } : {}}
    />
  );
}
