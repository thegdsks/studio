# Auto-Refine Quality Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a critique score is below AUTO_REFINE_THRESHOLD (default 70), the orchestrator automatically fires one refine pass using the critique as feedback, re-scores, and the frontend shows a "[ refined ]" chip with the score delta.

**Architecture:** The critique `.then()` callback in `orchestrator.ts` is extended to check the threshold and, if eligible, call `runAgent` again with `refine_feedback` set and `iteration` bumped. After that second run, a fresh critique produces the final score. A single `auto_refined` flag and `original_score` field on the Agent contract carry the signal through to the frontend. The frontend reducer hydrates those fields from both the SSE meta event and the snapshot poll, and the AgentCardHeader renders the chip next to QualityBadge.

**Tech Stack:** TypeScript strict, Node 20, Express SSE backend, Next.js 14 frontend, shared contract in `packages/shared/src/agent.ts`.

---

## File Map

| File | Change type | Responsibility |
|---|---|---|
| `packages/shared/src/agent.ts` | Modify (add optional fields) | Frozen contract: add `auto_refined?` and `original_score?` to `Agent` and `AgentEvent` meta payload |
| `apps/backend/src/orchestrator.ts` | Modify | Threshold check, re-invoke runner, re-critique, emit meta event |
| `apps/frontend/lib/useRunStream.ts` | Modify | Hydrate `auto_refined` and `original_score` from meta events and snapshot |
| `apps/frontend/components/agent/AgentCardHeader.tsx` | Modify | Render "[ refined ]" chip next to QualityBadge when `agent.auto_refined === true` |

---

## Task 1: Extend the shared contract

**Files:**
- Modify: `packages/shared/src/agent.ts`

- [ ] **Step 1: Add `auto_refined` and `original_score` optional fields to the `Agent` interface**

Open `packages/shared/src/agent.ts`. After the existing `refined_with?` field (line 64), add the two optional fields. The entire `Agent` interface should look like this when done:

```typescript
export interface Agent {
  id: AgentId;
  name: string;
  emoji: string;
  status: AgentStatus;
  startedAt?: number;
  finishedAt?: number;
  streamedText: string;
  finalArtifact?: unknown;
  tools: string[];
  error?: string;
  /** True when this agent's run executed locally via Gemma (Ollama) instead of cloud Gemini. */
  ranLocally?: boolean;
  /** 0-100 quality score assigned by self-critique after the agent finishes. */
  quality_score?: number;
  /** One-line biggest specific improvement identified by self-critique. */
  quality_critique?: string;
  /** Run iteration: 1 = first run, 2 = first refine, etc. */
  iteration?: number;
  /** User feedback that triggered the most recent refine. */
  refined_with?: string;
  /** True when the orchestrator automatically refined this agent due to a low quality score. */
  auto_refined?: boolean;
  /** Quality score from the initial run, before auto-refine improved it. */
  original_score?: number;
}
```

- [ ] **Step 2: Extend the `AgentEvent` meta payload type to include the new fields**

In the same file, the `AgentEvent` union has a `'meta'` variant with a payload type. Extend it to carry `auto_refined` and `original_score`. The meta variant line should become:

```typescript
  | { agent_id: AgentId; type: 'meta';   payload: { ranLocally?: boolean; quality_score?: number; quality_critique?: string; auto_refined?: boolean; original_score?: number } }
```

- [ ] **Step 3: Verify the file compiles cleanly**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | head -40
```

Expected: no errors from `packages/shared/src/agent.ts`.

- [ ] **Step 4: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add packages/shared/src/agent.ts
git commit -m "feat: add auto_refined and original_score to Agent contract"
```

---

## Task 2: Backend auto-refine logic in the orchestrator

**Files:**
- Modify: `apps/backend/src/orchestrator.ts`

**Context:** The critique currently runs in a `.then()` chain inside `runAgent`. We need to extend that chain: if the score is below the threshold AND this is the first iteration AND the disable flag is not set, call `runAgent` again (with `refine_feedback`) and then re-critique. The result is emitted as a meta event with `auto_refined: true`, `original_score`, and the new `quality_score`.

The key constraint: the refine is capped at one pass. If the refined output still scores low, accept it. If the refine call itself throws, log the error, emit an error meta (but NOT a status change), and leave the original artifact + score intact.

- [ ] **Step 1: Add the AUTO_REFINE_THRESHOLD env read at the top of `orchestrator.ts`**

After the existing `WAVE_STAGGER_MS` and `WAVE_TRANSITION_MS` constants (lines 11-16), add:

```typescript
// Auto-refine: if a critique score is below this threshold and the agent has
// not yet been refined, the orchestrator fires one refine pass automatically.
// Set AUTO_REFINE_DISABLE=1 in env to skip entirely (fast test runs).
const AUTO_REFINE_THRESHOLD = Number(process.env['AUTO_REFINE_THRESHOLD'] ?? 70);
const AUTO_REFINE_DISABLED = process.env['AUTO_REFINE_DISABLE'] === '1';
```

- [ ] **Step 2: Import the shared logger**

The codebase has no `packages/shared/src/log.ts` yet (the Glob above confirmed it does not exist). The existing orchestrator uses `console.log` and `console.error` with `eslint-disable-next-line no-console` comments. Match that same pattern for the new auto-refine log lines. Do not introduce a new logger module.

- [ ] **Step 3: Extract a `runAutoRefine` helper function**

Add this function after the `getArtifact` helper (after line 128, before `startRun`). It is a standalone async function so it can be called inside the `.then()` chain without making the critique chain async-heavy inline:

```typescript
/**
 * Attempt one automatic refine pass for an agent that scored below threshold.
 * Resolves with the refined score and critique, or throws on runner error.
 * Never loops: one pass only, regardless of the refined score.
 */
async function runAutoRefine(
  runId: string,
  agentId: AgentId,
  ctx: RunContext,
  originalScore: number,
  critiqueFeedback: string,
): Promise<{ refinedScore: number; refinedCritique: string }> {
  const refineCtx: RunContext = {
    ...ctx,
    refine_feedback: critiqueFeedback,
  };

  // Re-run the agent with feedback. This resets streamed text, bumps iteration, etc.
  const artifact = await runAgent(runId, agentId, refineCtx);

  // Re-critique the refined output (one pass, no recursion).
  const { score: refinedScore, critique: refinedCritique } = await critiqueArtifact({
    agentId,
    idea: ctx.idea,
    artifact,
  });

  // Persist auto_refined + original_score + new quality fields on the agent record.
  updateAgent(runId, agentId, {
    auto_refined: true,
    original_score: originalScore,
    quality_score: refinedScore,
    quality_critique: refinedCritique,
  });

  return { refinedScore, refinedCritique };
}
```

- [ ] **Step 4: Update the `updateAgent` call site in `runAgent` to accept the new fields**

Check that `updateAgent` in `store.ts` accepts `auto_refined` and `original_score`. Read the relevant portion:

```bash
grep -n "auto_refined\|original_score\|updateAgent" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/backend/src/store.ts | head -30
```

If `updateAgent` accepts `Partial<Agent>` you are done. If it has an explicit allowlist, add the two fields there. (Checking before writing avoids a type error.)

- [ ] **Step 5: Extend the critique `.then()` callback in `runAgent` to trigger auto-refine**

Replace the existing critique chain (lines 86-96 in the original file) with the version below. This is the FULL replacement for that block:

```typescript
    // Run the self-critique asynchronously AFTER the done status is visible.
    // The UI should show a loading shimmer on the score badge until the meta
    // event arrives. We intentionally don't await this in staggerRun so it
    // doesn't delay downstream waves.
    critiqueArtifact({ agentId, idea: ctx.idea, artifact }).then(async ({ score, critique }) => {
      updateAgent(runId, agentId, { quality_score: score, quality_critique: critique });
      emit(runId, {
        agent_id: agentId,
        type: 'meta',
        payload: { quality_score: score, quality_critique: critique },
      });

      // Auto-refine: one pass if score is below threshold and this is the first run.
      // ctx.refine_feedback being set means we are already in a refine pass — skip.
      const isFirstIteration = !ctx.refine_feedback;
      if (
        !AUTO_REFINE_DISABLED &&
        isFirstIteration &&
        score < AUTO_REFINE_THRESHOLD
      ) {
        try {
          const { refinedScore, refinedCritique } = await runAutoRefine(
            runId,
            agentId,
            ctx,
            score,
            critique,
          );
          emit(runId, {
            agent_id: agentId,
            type: 'meta',
            payload: {
              auto_refined: true,
              original_score: score,
              quality_score: refinedScore,
              quality_critique: refinedCritique,
            },
          });
          // eslint-disable-next-line no-console
          console.log(
            `[orch] ${runId.slice(0, 8)} ${agentId.padEnd(11)} auto-refined ${score} -> ${refinedScore}`,
          );
        } catch (refineErr: unknown) {
          // Refine failed: log, emit error meta so the frontend knows, but do NOT
          // change agent status or overwrite the original artifact. Demo-safe.
          const msg = refineErr instanceof Error ? refineErr.message : 'Unknown refine error';
          // eslint-disable-next-line no-console
          console.error(`[orch] auto-refine failed for ${agentId}:`, refineErr);
          emit(runId, {
            agent_id: agentId,
            type: 'meta',
            payload: { quality_critique: `Auto-refine failed: ${msg}` },
          });
        }
      }
    }).catch((err: unknown) => {
      // Critique failures are non-fatal — log only.
      // eslint-disable-next-line no-console
      console.error(`[orch] critique failed for ${agentId}:`, err);
    });
```

Note: the existing `.catch` at the end stays, wrapping both the critique call and the auto-refine. The `.then()` is now `async` because `runAutoRefine` is awaited inside it.

- [ ] **Step 6: Type-check**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | head -60
```

Expected: no errors in `apps/backend/src/orchestrator.ts`.

- [ ] **Step 7: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/backend/src/orchestrator.ts
git commit -m "feat: auto-refine loop in orchestrator when quality score < threshold"
```

---

## Task 3: Verify store.ts accepts the new Agent fields

**Files:**
- Read/possibly modify: `apps/backend/src/store.ts`

This is a quick validation step before the frontend work to confirm no silent type widening is needed.

- [ ] **Step 1: Check the `updateAgent` signature**

```bash
grep -n "updateAgent\|Partial" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/backend/src/store.ts | head -20
```

- [ ] **Step 2: If `updateAgent` accepts `Partial<Agent>`, no changes needed**

If it uses a narrower type (e.g., an explicit `Pick` or local interface), add `auto_refined?: boolean` and `original_score?: number` to that local type.

- [ ] **Step 3: Type-check to confirm**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | grep "store.ts"
```

Expected: no output (no errors).

---

## Task 4: Hydrate auto_refined in the frontend SSE reducer

**Files:**
- Modify: `apps/frontend/lib/useRunStream.ts`

The `agentsReducer` already handles `meta` events (lines 87-95). It reads `ranLocally`, `quality_score`, and `quality_critique` from the payload. We need to add `auto_refined` and `original_score`.

- [ ] **Step 1: Extend the `meta` case in `agentsReducer`**

Replace the existing `case 'meta':` block (lines 87-95):

```typescript
    case 'meta':
      return {
        ...state,
        [id]: {
          ...prev,
          ranLocally: event.payload.ranLocally ?? prev.ranLocally,
          quality_score: event.payload.quality_score ?? prev.quality_score,
          quality_critique: event.payload.quality_critique ?? prev.quality_critique,
          auto_refined: event.payload.auto_refined ?? prev.auto_refined,
          original_score: event.payload.original_score ?? prev.original_score,
        },
      };
```

- [ ] **Step 2: Verify snapshot hydration also carries the fields**

The snapshot path at line 158 does `dispatch({ hydrate: data.agents as AgentsState })`. Because `auto_refined` and `original_score` are now part of `Agent`, they will be included in the snapshot payload if the backend persists them (which it does via `updateAgent`). No additional code change is needed here.

- [ ] **Step 3: Type-check**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | grep "useRunStream"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/frontend/lib/useRunStream.ts
git commit -m "feat: hydrate auto_refined and original_score from SSE meta events"
```

---

## Task 5: Render the "[ refined ]" chip in AgentCardHeader

**Files:**
- Modify: `apps/frontend/components/agent/AgentCardHeader.tsx`

The chip goes next to `QualityBadge`. It uses only Tailwind token classes. It shows a tooltip on hover with the score delta. No emoji, no inline style.

- [ ] **Step 1: Add the RefinedChip inline component inside the file**

Add this component just above the `AgentCardHeader` export (after the `bracketIndex` helper, around line 23):

```typescript
interface RefinedChipProps {
  originalScore: number;
  refinedScore: number;
}

/** Subtle chip shown when the orchestrator auto-improved the agent output. */
function RefinedChip({ originalScore, refinedScore }: RefinedChipProps) {
  return (
    <span
      className="inline-flex items-center h-5 font-mono text-[11px] text-text-faint border border-border rounded px-1 bg-bg-muted"
      title={`Auto-improved from ${originalScore} to ${refinedScore}`}
    >
      [ refined ]
    </span>
  );
}
```

- [ ] **Step 2: Render the chip next to QualityBadge in the header right-side cluster**

In the `AgentCardHeader` function, find the right-side `div` (line 51 in original). Add the chip between the QualityBadge and the ViaGemmaPill. The full right-side block should become:

```tsx
      {/* Right: badges + status dot + interactive hint */}
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {agent.status === 'done' && (
          <QualityBadge
            score={agent.quality_score}
            critique={agent.quality_critique}
          />
        )}
        {agent.status === 'done' && agent.auto_refined === true && agent.original_score !== undefined && agent.quality_score !== undefined && (
          <RefinedChip
            originalScore={agent.original_score}
            refinedScore={agent.quality_score}
          />
        )}
        {agent.ranLocally && <ViaGemmaPill />}
        <StatusDot status={agent.status} />
        {interactive && (
          <ChevronRight
            className="h-3.5 w-3.5 text-text-faint transition-transform duration-micro group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </div>
```

- [ ] **Step 3: Verify token classes used exist in the design system**

```bash
grep -r "bg-bg-muted\|border-border\|text-text-faint" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/packages/design-system/ --include="*.json" --include="*.ts" --include="*.css" | head -10
```

If `bg-bg-muted` is not present, substitute the nearest equivalent muted surface class from tokens. Check what the ViaGemmaPill uses for its subdued styling as a reference:

```bash
cat /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/frontend/components/agent/ViaGemmaPill.tsx
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1 | head -40
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add apps/frontend/components/agent/AgentCardHeader.tsx
git commit -m "feat: show refined chip on AgentCard when auto-refined"
```

---

## Task 6: Full typecheck and smoke test

- [ ] **Step 1: Run the full workspace typecheck**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app && pnpm typecheck 2>&1
```

Expected: zero errors across all packages.

- [ ] **Step 2: Scan for introduced violations**

```bash
grep -rn "console\.log\|any\b\|@ts-nocheck\|@ts-ignore" \
  /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/backend/src/orchestrator.ts \
  /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/frontend/lib/useRunStream.ts \
  /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/frontend/components/agent/AgentCardHeader.tsx \
  /Users/gdsks/G-Development/GLINRV5/studio/studio-app/packages/shared/src/agent.ts
```

Expected: `console.log` lines should only appear with the `eslint-disable-next-line no-console` comment immediately above them (matching the existing pattern in orchestrator.ts). No `any`, no suppress directives.

- [ ] **Step 3: Verify env variable documentation in the README or .env.example**

```bash
grep -n "AUTO_REFINE\|WAVE_STAGGER\|MOCK_ONLY" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/README.md | head -10
grep -n "AUTO_REFINE" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/.env.example 2>/dev/null || echo "no .env.example"
```

If `.env.example` exists, add the two vars:

```
# Auto-refine: set to 1 to skip the auto-refine loop (faster test runs)
AUTO_REFINE_DISABLE=
# Score threshold below which the orchestrator fires one refine pass (default 70)
AUTO_REFINE_THRESHOLD=70
```

- [ ] **Step 4: Final commit if env.example was updated**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add .env.example
git commit -m "chore: document AUTO_REFINE env vars in .env.example"
```

---

## Failure Mode Reference

This section is critical for demo safety. Know what happens when each component errors.

| Failure point | Behavior |
|---|---|
| `critiqueArtifact` throws on the first pass | `.catch()` logs the error. No auto-refine fires. Agent stays `done` with no `quality_score`. Existing behavior, unchanged. |
| `runAutoRefine` throws (runner fails during refine) | `catch (refineErr)` inside the `.then()` logs the error and emits a meta event with `quality_critique` set to `"Auto-refine failed: <message>"`. The original artifact and original score remain. Agent status stays `done`. Demo shows the original output. |
| Re-critique after refine returns score 0 | Accepted. `auto_refined` is set to `true`, `original_score` is the initial score, `quality_score` becomes 0. The chip still shows. No loop. |
| `AUTO_REFINE_DISABLE=1` is set | The entire threshold check is skipped. Critique still runs, but the `.then()` exits after emitting the standard meta event. |
| Agent is already a refine pass (`ctx.refine_feedback` is set) | `isFirstIteration` is `false`. The threshold check does not fire. Prevents infinite recursion. |
| `updateAgent` in store throws during auto-refine persist | This would propagate up through `runAutoRefine`, be caught by the `catch (refineErr)` block, and follow the same failure path as runner errors above. |
