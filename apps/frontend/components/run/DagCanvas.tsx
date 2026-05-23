'use client';

/**
 * DagCanvas — SVG-based mission control DAG view for nine agents.
 *
 * Layout (SVG units, viewBox 0 0 600 520):
 *   Wave 1 (y=100): strategist (x=100), namer (x=300), analyst (x=500)
 *   Wave 2 (y=260): copywriter (x=100), designer (x=300), legal (x=500)
 *   Wave 3 (y=420): developer  (x=100), marketer  (x=300), growth (x=500)
 *
 * Edges derived from AGENT_DEPENDENCIES (source -> target).
 * Edges render behind nodes (SVG painter's model: edges first, then nodes).
 * Director is excluded from the canvas (shown in DirectorPanel aside).
 */

import type { AgentId } from '@studio/shared';
import { AGENT_DEPENDENCIES } from '@/lib/useRunStream';
import type { AgentsState } from '@/lib/useRunStream';
import { DagNode } from './DagNode';
import { DagEdge } from './DagEdge';

// ─── Canvas dimensions ───────────────────────────────────────────────────────

const VIEW_W = 600;
const VIEW_H = 520;

// ─── Layout constants (SVG coordinate space) ─────────────────────────────────

// Wave centre Y positions — three rows spaced evenly
const WAVE1_Y = 100;
const WAVE2_Y = 260;
const WAVE3_Y = 420;

// Column X positions — three columns
const COL1_X = 100;
const COL2_X = 300;
const COL3_X = 500;

// Node positions: [cy, cx] tuples per agentId
const NODE_POS: Record<AgentId, [number, number]> = {
  strategist: [WAVE1_Y, COL1_X],
  namer:      [WAVE1_Y, COL2_X],
  analyst:    [WAVE1_Y, COL3_X],
  copywriter: [WAVE2_Y, COL1_X],
  designer:   [WAVE2_Y, COL2_X],
  legal:      [WAVE2_Y, COL3_X],
  developer:  [WAVE3_Y, COL1_X],
  marketer:   [WAVE3_Y, COL2_X],
  growth:     [WAVE3_Y, COL3_X],
  // Director is rendered in the DirectorPanel aside, not the canvas
  director:   [VIEW_H + 100, COL2_X],
};

// ─── Canvas agent list (director excluded) ────────────────────────────────────

const CANVAS_AGENT_IDS: AgentId[] = [
  'strategist', 'namer', 'analyst',
  'copywriter', 'designer', 'legal',
  'developer', 'marketer', 'growth',
];

// ─── Edge specs derived from AGENT_DEPENDENCIES ──────────────────────────────

interface EdgeSpec {
  source: AgentId;
  target: AgentId;
}

function buildEdges(): EdgeSpec[] {
  const edges: EdgeSpec[] = [];
  for (const [targetId, deps] of Object.entries(AGENT_DEPENDENCIES) as [AgentId, AgentId[]][]) {
    if (targetId === 'director') continue;
    for (const sourceId of deps) {
      edges.push({ source: sourceId, target: targetId });
    }
  }
  return edges;
}

const EDGES: EdgeSpec[] = buildEdges();

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DagCanvasProps {
  agents: AgentsState;
  runId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DagCanvas({ agents, runId }: DagCanvasProps) {
  return (
    <div className="w-full flex items-center justify-center py-6 px-4">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        style={{ maxWidth: `${VIEW_W}px` }}
        aria-label="Agent dependency graph"
        role="img"
        className="overflow-visible"
      >
        {/* Edges rendered first so nodes paint above them */}
        {EDGES.map(({ source, target }) => {
          const [sy, sx] = NODE_POS[source];
          const [ty, tx] = NODE_POS[target];
          const sourceAgent = agents[source];
          return (
            <DagEdge
              key={`${source}-${target}`}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              sourceDone={sourceAgent?.status === 'done'}
              sourceRunning={sourceAgent?.status === 'running'}
            />
          );
        })}

        {/* Nodes */}
        {CANVAS_AGENT_IDS.map((id) => {
          const agent = agents[id];
          if (!agent) return null;
          const [cy, cx] = NODE_POS[id];
          return (
            <DagNode
              key={id}
              agent={agent}
              cx={cx}
              cy={cy}
              runId={runId}
            />
          );
        })}
      </svg>
    </div>
  );
}
