# DAG Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3x3 agent grid on the run page with a live animated SVG DAG canvas showing nine agent nodes arranged in three waves, connected by bezier edges that pulse as data flows.

**Architecture:** Three split files under `apps/frontend/components/run/`: `DagEdge.tsx` (SVG path + pulse animation), `DagNode.tsx` (circle card per agent), and `DagCanvas.tsx` (orchestrator with layout constants + SVG container). The run page replaces its `motion.div` grid with `<DagCanvas>`. All animation respects `usePrefersReducedMotion`.

**Tech Stack:** Next.js 14 app router, framer-motion, Lucide icons (via `apps/frontend/lib/agentIcons.tsx`), Tailwind + CSS vars from `packages/design-system/tokens.json`, TypeScript strict.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `apps/frontend/components/run/DagEdge.tsx` | SVG `<path>` for one dependency edge; pulses once when source transitions to `done` |
| Create | `apps/frontend/components/run/DagNode.tsx` | Circular node card: icon + name + status ring; click navigates to agent detail |
| Create | `apps/frontend/components/run/DagCanvas.tsx` | SVG canvas + layout constants; positions 9 nodes in 3 waves; renders edges from `AGENT_DEPENDENCIES` |
| Modify | `apps/frontend/app/run/[id]/page.tsx` | Swap `motion.div` grid for `<DagCanvas agents={agents} runId={runId} />` |

---

### Task 1: DagEdge subcomponent

**Files:**
- Create: `apps/frontend/components/run/DagEdge.tsx`

- [ ] **Step 1: Create DagEdge.tsx**

```tsx
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

// Token-derived constants — no raw values in logic
const EDGE_STROKE_IDLE    = 'var(--color-border-strong)';
const EDGE_STROKE_ACTIVE  = 'var(--color-status-running)';
const EDGE_STROKE_DONE    = 'var(--color-status-done)';
const EDGE_OPACITY_IDLE   = 0.35;
const EDGE_OPACITY_ACTIVE = 0.7;
// Pulse dash length matches edge visual length approximation
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

  // Cubic bezier: control points pull vertically for wave topology
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | head -30
```

Expected: Either clean or only pre-existing errors (not from DagEdge.tsx).

- [ ] **Step 3: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/frontend/components/run/DagEdge.tsx
git commit -m "feat: add DagEdge SVG bezier component with done-pulse animation"
```

---

### Task 2: DagNode subcomponent

**Files:**
- Create: `apps/frontend/components/run/DagNode.tsx`

- [ ] **Step 1: Create DagNode.tsx**

```tsx
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

// Token-derived node geometry (SVG units matching viewBox)
const NODE_R        = 36;   // circle radius
const RING_R        = 42;   // animated ring radius (6px gap)
const ICON_SIZE     = 18;   // px for the foreignObject icon
const LABEL_OFFSET  = 54;   // y offset below centre for name label

// Token-derived colours (CSS vars; no hex literals)
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
      aria-label={`${agent.name} — ${agent.status}`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Animated ring for running state */}
      {hasRing && !reducedMotion && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={RING_R}
          fill="none"
          stroke={ringColor(agent.status)}
          strokeWidth={1.5}
          opacity={isRunning ? undefined : 0.5}
          animate={isRunning ? { opacity: [0.2, 0.7, 0.2] } : { opacity: 0.5 }}
          transition={isRunning ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
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

      {/* Icon — foreignObject lets us use Lucide React components */}
      <foreignObject
        x={cx - ICON_SIZE / 2}
        y={cy - ICON_SIZE / 2 - 6}
        width={ICON_SIZE}
        height={ICON_SIZE}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <Icon
          size={ICON_SIZE}
          color={isRunning ? COLOR_RUNNING : isDone ? COLOR_DONE : isError ? COLOR_ERROR : COLOR_TEXT_MUTED}
          strokeWidth={1.5}
        />
      </foreignObject>

      {/* Status dot */}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | head -30
```

Expected: Clean or only pre-existing errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/frontend/components/run/DagNode.tsx
git commit -m "feat: add DagNode SVG component with status ring and click-nav"
```

---

### Task 3: DagCanvas orchestrator

**Files:**
- Create: `apps/frontend/components/run/DagCanvas.tsx`

- [ ] **Step 1: Create DagCanvas.tsx**

```tsx
'use client';

/**
 * DagCanvas — SVG-based mission control DAG view for nine agents.
 *
 * Layout (all in SVG units, viewBox 0 0 600 520):
 *   Wave 1 (y=100): strategist (x=100), namer (x=300), analyst (x=500)
 *   Wave 2 (y=260): copywriter (x=100), designer (x=300), legal (x=500)
 *   Wave 3 (y=420): developer  (x=100), marketer  (x=300), growth (x=500)
 *
 * Edges are drawn from AGENT_DEPENDENCIES (source → target).
 * Edges render behind nodes (SVG painter's model: edges first, then nodes).
 */

import type { AgentId } from '@studio/shared';
import { AGENT_DEPENDENCIES } from '@/lib/useRunStream';
import type { AgentsState } from '@/lib/useRunStream';
import { DagNode } from './DagNode';
import { DagEdge } from './DagEdge';

// ─── Layout constants (SVG coordinate space, viewBox 600×520) ────────────────

const VIEW_W = 600;
const VIEW_H = 520;

// Wave centre Y positions
const WAVE_Y: Record<1 | 2 | 3, number> = {
  1: 100,
  2: 260,
  3: 420,
};

// X positions per column
const COL_X: Record<1 | 2 | 3, number> = {
  1: 100,
  2: 300,
  3: 500,
};

// Wave assignment: agentId → [wave, col]
const NODE_POS: Record<AgentId, [number, number]> = {
  strategist: [WAVE_Y[1], COL_X[1]],
  namer:      [WAVE_Y[1], COL_X[2]],
  analyst:    [WAVE_Y[1], COL_X[3]],
  copywriter: [WAVE_Y[2], COL_X[1]],
  designer:   [WAVE_Y[2], COL_X[2]],
  legal:      [WAVE_Y[2], COL_X[3]],
  developer:  [WAVE_Y[3], COL_X[1]],
  marketer:   [WAVE_Y[3], COL_X[2]],
  growth:     [WAVE_Y[3], COL_X[3]],
  // director is shown in DirectorPanel, not in the canvas
  director:   [VIEW_H + 100, COL_X[2]], // off-canvas placeholder
};

// ─── Canvas agents (director excluded from canvas display) ───────────────────

const CANVAS_AGENT_IDS: AgentId[] = [
  'strategist', 'namer', 'analyst',
  'copywriter', 'designer', 'legal',
  'developer', 'marketer', 'growth',
];

// ─── Edge list: derived from AGENT_DEPENDENCIES (source → targets) ───────────

interface EdgeSpec {
  source: AgentId;
  target: AgentId;
}

function buildEdges(): EdgeSpec[] {
  const edges: EdgeSpec[] = [];
  for (const [targetId, deps] of Object.entries(AGENT_DEPENDENCIES) as [AgentId, AgentId[]][]) {
    if (targetId === 'director') continue; // director not rendered in canvas
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
    <div className="w-full flex items-center justify-center py-4">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        style={{ maxWidth: `${VIEW_W}px` }}
        aria-label="Agent dependency graph"
        role="img"
        className="overflow-visible"
      >
        {/* Edges — rendered first so nodes paint on top */}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | head -40
```

Expected: Clean or only pre-existing errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/frontend/components/run/DagCanvas.tsx
git commit -m "feat: add DagCanvas SVG orchestrator with wave topology and edges"
```

---

### Task 4: Wire DagCanvas into run page

**Files:**
- Modify: `apps/frontend/app/run/[id]/page.tsx`

- [ ] **Step 1: Replace grid with DagCanvas**

Replace the entire `<main>` section (the `motion.div` grid) in `apps/frontend/app/run/[id]/page.tsx`:

Remove these imports that are no longer needed:
```tsx
import { motion } from 'framer-motion';
import { staggerChildren, cardEnter, withReducedMotion } from '@studio/ui';
import AgentCard from '@/components/AgentCard';
```

Add import:
```tsx
import { DagCanvas } from '@/components/run/DagCanvas';
```

Remove:
```tsx
const GRID_AGENT_IDS = AGENT_IDS.filter((id) => id !== 'director');
```

Remove from the hook destructure:
- `staggerVariants` and `cardVariants` const declarations (they use removed imports).

Replace the `<main>` block:
```tsx
{/* Before */}
<main className="flex-1 overflow-y-auto p-4">
  <motion.div
    className="grid grid-cols-3 gap-3"
    variants={staggerVariants}
    initial="hidden"
    animate="visible"
  >
    {GRID_AGENT_IDS.map((id) => {
      const agent = agents[id];
      if (!agent) return null;
      const depIds = AGENT_DEPENDENCIES[id] ?? ([] as AgentId[]);
      const dependencies = depIds.map((depId) => ({
        name: AGENT_REGISTRY[depId].name,
        emoji: AGENT_REGISTRY[depId].emoji,
        done: agents[depId]
          ? agents[depId].status === 'done' || agents[depId].status === 'error'
          : false,
      }));
      return (
        <motion.div key={id} variants={cardVariants}>
          <AgentCard agent={agent} dependencies={dependencies} />
        </motion.div>
      );
    })}
  </motion.div>
</main>
```

```tsx
{/* After */}
<main className="flex-1 overflow-y-auto">
  <DagCanvas agents={agents} runId={runId} />
</main>
```

The final file should look like:

```tsx
'use client';

import type { } from 'framer-motion';
import { usePrefersReducedMotion } from '@studio/ui';
import { RunTopBar } from '@/components/run/RunTopBar';
import { AgentRail } from '@/components/run/AgentRail';
import { DirectorPanel } from '@/components/run/DirectorPanel';
import { FinalKitPanel } from '@/components/run/FinalKitPanel';
import { DagCanvas } from '@/components/run/DagCanvas';
import { useRunState } from '@/components/run/useRunState';

interface RunPageProps {
  params: { id: string };
}

export default function RunPage({ params }: RunPageProps) {
  const runId = params.id;
  const { agents, runComplete, panelOpen, setPanelOpen, runStartedAt, runFinishedAt } = useRunState(runId);

  const agentStatuses = Object.values(agents).map((a) => a.status);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <RunTopBar
        runHash={runId}
        startedAt={runStartedAt}
        finishedAt={runFinishedAt}
        agentStatuses={agentStatuses}
        runComplete={runComplete}
      />

      {/* Three-column shell */}
      <div className="flex flex-1 overflow-hidden">
        <AgentRail agents={agents} />

        {/* Center: DAG canvas */}
        <main className="flex-1 overflow-y-auto">
          <DagCanvas agents={agents} runId={runId} />
        </main>

        {/* Right: Director panel */}
        <aside className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4">
          {agents.director && agents.director.status !== 'queued' ? (
            <DirectorPanel agent={agents.director} />
          ) : (
            <div className="flex flex-col gap-2 py-4">
              <p className="font-mono text-label-sm uppercase text-text-faint" style={{ letterSpacing: '0.1em' }}>
                Director
              </p>
              <p className="text-body-sm text-text-faint italic">Waiting for all agents...</p>
            </div>
          )}
        </aside>
      </div>

      <FinalKitPanel
        run={{ agents }}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        runId={runId}
      />
    </div>
  );
}
```

Note: `usePrefersReducedMotion` import is unused after the refactor — remove it too. The final clean file is:

```tsx
'use client';

import { RunTopBar } from '@/components/run/RunTopBar';
import { AgentRail } from '@/components/run/AgentRail';
import { DirectorPanel } from '@/components/run/DirectorPanel';
import { FinalKitPanel } from '@/components/run/FinalKitPanel';
import { DagCanvas } from '@/components/run/DagCanvas';
import { useRunState } from '@/components/run/useRunState';

interface RunPageProps {
  params: { id: string };
}

export default function RunPage({ params }: RunPageProps) {
  const runId = params.id;
  const { agents, runComplete, panelOpen, setPanelOpen, runStartedAt, runFinishedAt } = useRunState(runId);

  const agentStatuses = Object.values(agents).map((a) => a.status);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <RunTopBar
        runHash={runId}
        startedAt={runStartedAt}
        finishedAt={runFinishedAt}
        agentStatuses={agentStatuses}
        runComplete={runComplete}
      />

      <div className="flex flex-1 overflow-hidden">
        <AgentRail agents={agents} />

        <main className="flex-1 overflow-y-auto">
          <DagCanvas agents={agents} runId={runId} />
        </main>

        <aside className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4">
          {agents.director && agents.director.status !== 'queued' ? (
            <DirectorPanel agent={agents.director} />
          ) : (
            <div className="flex flex-col gap-2 py-4">
              <p className="font-mono text-label-sm uppercase text-text-faint" style={{ letterSpacing: '0.1em' }}>
                Director
              </p>
              <p className="text-body-sm text-text-faint italic">Waiting for all agents...</p>
            </div>
          )}
        </aside>
      </div>

      <FinalKitPanel
        run={{ agents }}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        runId={runId}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1
```

Expected: No new errors introduced.

- [ ] **Step 3: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/frontend/app/run/[id]/page.tsx
git commit -m "feat: replace agent grid with DagCanvas on run page"
```

---

## Self-Review

### Spec coverage

| Requirement | Covered by |
|-------------|-----------|
| New `DagCanvas.tsx` file | Task 3 |
| SVG-based ~500x600px responsive canvas | Task 3 (viewBox 600x520, width 100%, maxWidth 600px) |
| Wave topology: wave1=strategist/namer/analyst, wave2=copywriter/designer/legal, wave3=developer/marketer/growth | Task 3 `NODE_POS` constant |
| Edges from `AGENT_DEPENDENCIES` as SVG bezier paths | Task 3 `buildEdges()` + Task 1 `DagEdge` |
| Circular/rounded node cards with Lucide icon + name + status dot | Task 2 `DagNode` |
| Status colours: queued=neutral, streaming=cyan pulse, done=green, error=red | Task 2 `ringColor()` + CSS vars |
| Animated ring on streaming | Task 2 framer-motion `animate` on `motion.circle` |
| Edge pulse once when source completes | Task 1 `useEffect` + `strokeDashoffset` animation |
| Click node navigates to `/run/[id]/agent/[agentId]` | Task 2 `handleClick` + `useRouter` |
| Wire into run page, replacing grid | Task 4 |
| AgentRail and DirectorPanel unchanged | Task 4 (preserved verbatim) |
| Tokens only / no hex literals in component logic | All tasks use `var(--color-*)` CSS vars |
| Lucide icons only | Task 2 uses `iconFor()` from `agentIcons.tsx` |
| No `any`, no `@ts-nocheck`, no `console.log` | All tasks: strict TypeScript, no debug logs |
| Max 250 lines per file — split into DagNode + DagEdge | Split into 3 files: DagEdge, DagNode, DagCanvas |
| prefers-reduced-motion respected | Task 1 + Task 2 use `usePrefersReducedMotion()` |
| No em dashes in user-visible copy | Checked — none present |

### Placeholder scan

No TBD, TODO, "implement later", "fill in details", "add appropriate error handling", or "similar to Task N" patterns present.

### Type consistency

- `DagEdgeProps`: `x1, y1, x2, y2: number`, `sourceDone: boolean`, `sourceRunning: boolean` — used consistently in `DagCanvas` edge render.
- `DagNodeProps`: `agent: Agent`, `cx: number`, `cy: number`, `runId: string` — used consistently in `DagCanvas` node render.
- `DagCanvasProps`: `agents: AgentsState`, `runId: string` — matches run page usage.
- `NODE_POS` returns `[y, x]` tuple — both DagCanvas and DagNode access `[cy, cx] = NODE_POS[id]` and `[sy, sx] = NODE_POS[source]` consistently.
- `AGENT_DEPENDENCIES` imported from `@/lib/useRunStream` (not `useRunState`) in DagCanvas — matches actual export location.
