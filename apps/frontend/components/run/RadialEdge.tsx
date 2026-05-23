'use client';

/**
 * RadialEdge — SVG cubic-bezier path connecting two nodes in the radial canvas.
 *
 * Edges curve toward the center of the canvas (cx=300, cy=300) using a
 * control-point that bends the path inward. When sourceDone flips true,
 * a short dash races along the path once (one-shot pulse), matching DagEdge
 * behaviour. Respects prefers-reduced-motion: skips the pulse entirely.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@studio/ui';

export interface RadialEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceDone: boolean;
  sourceRunning: boolean;
}

// Token-derived constants — CSS vars, no hex
const STROKE_IDLE   = 'var(--color-border-strong)';
const STROKE_ACTIVE = 'var(--color-status-running)';
const STROKE_DONE   = 'var(--color-status-done)';
const OPACITY_IDLE   = 0.3;
const OPACITY_ACTIVE = 0.65;

// Pulse: short dash races from source to target on done transition
const PULSE_DASH = 8;
const PULSE_GAP  = 220;

// Center of the radial canvas (used as bezier anchor for curved paths)
const CANVAS_CX = 300;
const CANVAS_CY = 300;

function buildPath(x1: number, y1: number, x2: number, y2: number): string {
  // Control point biased toward the canvas center so edges curve inward
  const cpX = (x1 + x2) / 2 * 0.55 + CANVAS_CX * 0.45;
  const cpY = (y1 + y2) / 2 * 0.55 + CANVAS_CY * 0.45;
  return `M ${x1} ${y1} Q ${cpX} ${cpY}, ${x2} ${y2}`;
}

export function RadialEdge({ x1, y1, x2, y2, sourceDone, sourceRunning }: RadialEdgeProps) {
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

  const d = buildPath(x1, y1, x2, y2);

  const stroke = sourceDone
    ? STROKE_DONE
    : sourceRunning
      ? STROKE_ACTIVE
      : STROKE_IDLE;

  const opacity = sourceRunning || sourceDone ? OPACITY_ACTIVE : OPACITY_IDLE;

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
