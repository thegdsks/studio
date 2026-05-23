'use client';

/**
 * RadialCanvas — circular "mission control" view for nine specialist agents.
 *
 * Layout (SVG viewBox 0 0 600 600):
 *   - Canvas centre: (300, 300)
 *   - Director node: centre, radius 46 (1.28x specialist NODE_R=36)
 *   - 9 specialist nodes: evenly distributed on RING_RADIUS=200 from centre
 *     Angle for agent i = -π/2 + i * (2π / 9)  (starts at top, clockwise)
 *   - Dependency edges: quadratic beziers curving inward through near-centre cp
 *   - Progress ring: full circle at RING_RADIUS+70, stroke-dasharray tracks
 *     (doneCount / 10) fraction
 *   - Director glow: animated ring at DIRECTOR_GLOW_R when all 9 specialists done
 *
 * Wave groups (visual accent on border only, same ring position):
 *   Wave 1 — strategist, namer, analyst    → accent blue border
 *   Wave 2 — copywriter, designer, legal   → standard border
 *   Wave 3 — developer, marketer, growth   → dashed border treatment (via strokeDasharray)
 *
 * No hex literals. No fallbacks — throws if AGENT_DEPENDENCIES entry missing.
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';
import { usePrefersReducedMotion, StatusDot } from '@studio/ui';
import { AGENT_DEPENDENCIES } from '@/lib/useRunStream';
import type { AgentsState } from '@/lib/useRunStream';
import type { AgentId } from '@studio/shared';
import { RadialNode } from './RadialNode';
import { RadialEdge } from './RadialEdge';

// ─── Canvas geometry ──────────────────────────────────────────────────────────

const VIEW_SIZE    = 600;
const CANVAS_CX    = 300;
const CANVAS_CY    = 300;
const RING_RADIUS  = 200;   // specialist nodes ring radius (SVG units)

const DIRECTOR_R       = 46;  // director node circle radius (~1.28 × specialist 36)
const DIRECTOR_ICON    = 22;  // px for director Lucide icon
const DIRECTOR_GLOW_R  = 56;  // animated glow ring outside director

// Progress ring sits just outside the specialist ring
const PROGRESS_RING_R  = 270;
const PROGRESS_STROKE  = 3;

// ─── Agent ordering on ring ───────────────────────────────────────────────────

const SPECIALIST_IDS: AgentId[] = [
  'strategist', 'namer', 'analyst',       // wave 1
  'copywriter', 'designer', 'legal',      // wave 2
  'developer',  'marketer', 'growth',     // wave 3
];

// Wave 1 gets a subtle accent-coloured border to differentiate
const WAVE1_IDS = new Set<AgentId>(['strategist', 'namer', 'analyst']);
const WAVE3_IDS = new Set<AgentId>(['developer', 'marketer', 'growth']);

// ─── Layout math ─────────────────────────────────────────────────────────────

interface NodePosition {
  id: AgentId;
  cx: number;
  cy: number;
  angle: number;
}

function computePositions(): NodePosition[] {
  return SPECIALIST_IDS.map((id, i) => {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / 9);
    return {
      id,
      cx: CANVAS_CX + RING_RADIUS * Math.cos(angle),
      cy: CANVAS_CY + RING_RADIUS * Math.sin(angle),
      angle,
    };
  });
}

const NODE_POSITIONS: NodePosition[] = computePositions();
const POS_BY_ID: Record<AgentId, NodePosition> = Object.fromEntries(
  NODE_POSITIONS.map((p) => [p.id, p]),
) as Record<AgentId, NodePosition>;

// ─── Edge specs ───────────────────────────────────────────────────────────────

interface EdgeSpec {
  source: AgentId;
  target: AgentId;
}

function buildEdges(): EdgeSpec[] {
  const edges: EdgeSpec[] = [];
  for (const [targetId, deps] of Object.entries(AGENT_DEPENDENCIES) as [AgentId, AgentId[]][]) {
    if (targetId === 'director') continue;

    const targetDeps = AGENT_DEPENDENCIES[targetId];
    if (targetDeps === undefined) {
      throw new Error(`[RadialCanvas] AGENT_DEPENDENCIES missing entry for: ${targetId}`);
    }

    for (const sourceId of deps) {
      // Only draw edges between specialist nodes (both must be on the ring)
      if (!POS_BY_ID[sourceId]) continue;
      edges.push({ source: sourceId, target: targetId });
    }
  }
  return edges;
}

const EDGES: EdgeSpec[] = buildEdges();

// ─── Progress ring circumference ─────────────────────────────────────────────

const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_R;

// ─── Color tokens ─────────────────────────────────────────────────────────────

const COLOR_SURFACE    = 'var(--color-surface-raised)';
const COLOR_BORDER     = 'var(--color-border-strong)';
const COLOR_ACCENT     = 'var(--color-accent)';
const COLOR_DONE       = 'var(--color-status-done)';
const COLOR_DONE_SOFT  = 'var(--color-status-done-soft)';
const COLOR_TEXT_MUTED = 'var(--color-text-muted)';
const COLOR_TEXT_FAINT = 'var(--color-text-faint)';
const COLOR_PROGRESS   = 'var(--color-accent)';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RadialCanvasProps {
  agents: AgentsState;
  runId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RadialCanvas({ agents, runId }: RadialCanvasProps) {
  const router        = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const doneCount = useMemo(
    () => SPECIALIST_IDS.filter((id) => agents[id]?.status === 'done').length,
    [agents],
  );
  const allSpecialistsDone = doneCount === SPECIALIST_IDS.length;

  // Progress ring: dashoffset = circumference * (1 - fraction)
  const progressOffset = PROGRESS_CIRCUMFERENCE * (1 - doneCount / 10);

  const director = agents.director;

  function handleDirectorClick() {
    router.push(`/run/${runId}/agent/director`);
  }

  return (
    <div className="w-full flex items-center justify-center py-6 px-4">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        width="100%"
        style={{ maxWidth: `${VIEW_SIZE}px` }}
        aria-label="Agent radial layout"
        role="img"
        className="overflow-visible"
      >
        {/* Progress ring — faint track */}
        <circle
          cx={CANVAS_CX}
          cy={CANVAS_CY}
          r={PROGRESS_RING_R}
          fill="none"
          stroke={COLOR_BORDER}
          strokeWidth={PROGRESS_STROKE}
          opacity={0.4}
        />

        {/* Progress ring — filled arc, rotated to start at top */}
        <circle
          cx={CANVAS_CX}
          cy={CANVAS_CY}
          r={PROGRESS_RING_R}
          fill="none"
          stroke={COLOR_PROGRESS}
          strokeWidth={PROGRESS_STROKE}
          strokeLinecap="round"
          strokeDasharray={PROGRESS_CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90 ${CANVAS_CX} ${CANVAS_CY})`}
          opacity={0.55}
          style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.6s ease' }}
        />

        {/* Edges — rendered behind nodes */}
        {EDGES.map(({ source, target }) => {
          const sp = POS_BY_ID[source];
          const tp = POS_BY_ID[target];
          if (!sp || !tp) return null;
          const sourceAgent = agents[source];
          return (
            <RadialEdge
              key={`${source}-${target}`}
              x1={sp.cx}
              y1={sp.cy}
              x2={tp.cx}
              y2={tp.cy}
              sourceDone={sourceAgent?.status === 'done'}
              sourceRunning={sourceAgent?.status === 'running'}
            />
          );
        })}

        {/* Specialist nodes */}
        {NODE_POSITIONS.map(({ id, cx, cy, angle }) => {
          const agent = agents[id];
          if (!agent) return null;

          return (
            <RadialNode
              key={id}
              agent={agent}
              cx={cx}
              cy={cy}
              angle={angle}
              runId={runId}
            />
          );
        })}

        {/* Director — dead centre */}
        <g
          role="button"
          tabIndex={0}
          aria-label={`Director: ${director?.status ?? 'queued'}`}
          style={{ cursor: 'pointer' }}
          onClick={handleDirectorClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDirectorClick(); }}
        >
          {/* Glow ring when all specialists done */}
          {allSpecialistsDone && !reducedMotion && (
            <motion.circle
              cx={CANVAS_CX}
              cy={CANVAS_CY}
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
              cx={CANVAS_CX}
              cy={CANVAS_CY}
              r={DIRECTOR_GLOW_R}
              fill={COLOR_DONE_SOFT}
              stroke={COLOR_DONE}
              strokeWidth={1.5}
              opacity={0.5}
            />
          )}

          {/* Director circle — slightly larger than specialist nodes */}
          <circle
            cx={CANVAS_CX}
            cy={CANVAS_CY}
            r={DIRECTOR_R}
            fill={COLOR_SURFACE}
            stroke={allSpecialistsDone ? COLOR_DONE : COLOR_ACCENT}
            strokeWidth={1.5}
          />

          {/* Clapperboard icon */}
          <foreignObject
            x={CANVAS_CX - DIRECTOR_ICON / 2}
            y={CANVAS_CY - DIRECTOR_ICON / 2 - 8}
            width={DIRECTOR_ICON}
            height={DIRECTOR_ICON}
            style={{ overflow: 'visible', pointerEvents: 'none' }}
          >
            <Clapperboard
              size={DIRECTOR_ICON}
              color={allSpecialistsDone ? COLOR_DONE : COLOR_ACCENT}
              strokeWidth={1.5}
            />
          </foreignObject>

          {/* Director status dot */}
          {director && (
            <foreignObject
              x={CANVAS_CX + DIRECTOR_R - 8}
              y={CANVAS_CY - DIRECTOR_R + 2}
              width={12}
              height={12}
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <StatusDot status={director.status} />
            </foreignObject>
          )}

          {/* Director label */}
          <text
            x={CANVAS_CX}
            y={CANVAS_CY + DIRECTOR_R + 18}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fill={allSpecialistsDone ? COLOR_TEXT_MUTED : COLOR_TEXT_FAINT}
            letterSpacing="0.06em"
            style={{ textTransform: 'uppercase', userSelect: 'none' }}
          >
            DIRECTOR
          </text>
        </g>
      </svg>
    </div>
  );
}
