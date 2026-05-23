import type { AgentId } from '@studio/shared';
import { updateAgent, emit, stampRunFinished, appendChunk, getRun } from './store.js';
import { agentRunners, MOCK_ONLY } from './runners.js';
import type { RunContext } from './runners.js';
import { getMockArtifact } from './mockArtifacts.js';
import { critiqueArtifact } from './critique.js';

// Demo-pacing: stagger agent starts within a wave so the eye can track each one
// lighting up instead of seeing three pulse simultaneously. 120ms is enough to
// read as sequential without slowing the run perceptibly.
const WAVE_STAGGER_MS = Number(process.env['WAVE_STAGGER_MS'] ?? 120);

// Demo-theater: deliberate pause between waves for presentation legibility.
// Without this, agents in downstream waves might fire too quickly in a blur,
// making it hard for the audience on stage to trace the wave-by-wave cascade.
const WAVE_TRANSITION_MS = 400;

// Auto-refine: if a critique score is below this threshold and the agent has
// not yet been refined, the orchestrator fires one refine pass automatically.
// Set AUTO_REFINE_DISABLE=1 in env to skip entirely (fast test runs).
const AUTO_REFINE_THRESHOLD = Number(process.env['AUTO_REFINE_THRESHOLD'] ?? 70);
const AUTO_REFINE_DISABLED = process.env['AUTO_REFINE_DISABLE'] === '1';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function staggerRun(
  index: number,
  runId: string,
  agentId: AgentId,
  ctx: RunContext,
): Promise<unknown> {
  if (index > 0 && WAVE_STAGGER_MS > 0) await sleep(index * WAVE_STAGGER_MS);
  return runAgent(runId, agentId, ctx);
}


export async function runAgent(
  runId: string,
  agentId: AgentId,
  ctx: RunContext,
): Promise<unknown> {
  const runner = agentRunners[agentId];
  const mode = MOCK_ONLY ? 'mock' : 'real';
  const t0 = Date.now();

  // startedAt is only set on the very first run (iteration 1).
  // Auto-refine passes preserve the original startedAt and only update finishedAt.
  updateAgent(runId, agentId, { status: 'running', startedAt: t0, iteration: 1 });
  emit(runId, { agent_id: agentId, type: 'status', payload: { status: 'running' } });

  try {
    if (!runner) throw new Error(`No runner registered for ${agentId}`);

    const artifact = await runner(ctx, (event) => {
      // Mirror chunk events into streamedText on the run (SQL-side concat).
      if (event.type === 'chunk' && event.agent_id === agentId) {
        appendChunk(runId, agentId, event.payload.text);
      }
      // Persist ranLocally onto the agent so /api/runs/:id reflects it for late-joiners.
      if (event.type === 'meta' && event.agent_id === agentId && event.payload.ranLocally) {
        updateAgent(runId, agentId, { ranLocally: true });
      }
      emit(runId, event);
    });

    const finishedAt = Date.now();
    // Defensive: finishedAt must be after startedAt.
    if (finishedAt < t0) {
      throw new Error(
        `[orch] clock inversion for ${agentId}: finishedAt (${finishedAt}) < startedAt (${t0})`,
      );
    }

    // Mark the agent done immediately so the UI flips the card.
    updateAgent(runId, agentId, {
      status: 'done',
      finishedAt,
      finalArtifact: artifact,
    });
    emit(runId, { agent_id: agentId, type: 'result', payload: { artifact } });
    emit(runId, { agent_id: agentId, type: 'status', payload: { status: 'done' } });

    // eslint-disable-next-line no-console
    console.log(`[orch] ${runId.slice(0, 8)} ${agentId.padEnd(11)} done  ${String(finishedAt - t0).padStart(5)}ms (${mode})`);

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
      if (
        !AUTO_REFINE_DISABLED &&
        score < AUTO_REFINE_THRESHOLD
      ) {
        try {
          const { refinedArtifact, refinedScore, refinedCritique } = await runAutoRefine(
            runId,
            agentId,
            ctx,
            score,
            critique,
          );
          // Replace finalArtifact with the refined output and bump iteration.
          // startedAt is deliberately NOT touched here (preserve original start time).
          updateAgent(runId, agentId, {
            finalArtifact: refinedArtifact,
            finishedAt: Date.now(),
            iteration: 2,
            auto_refined: true,
            original_score: score,
            quality_score: refinedScore,
            quality_critique: refinedCritique,
          });
          emit(runId, { agent_id: agentId, type: 'result', payload: { artifact: refinedArtifact } });
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
          // Refine failed: log and emit error meta so the frontend knows, but do NOT
          // change agent status or overwrite the original artifact.
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

    return artifact;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Emit error, then fall back to hash-based mock so demo always shows something
    emit(runId, { agent_id: agentId, type: 'error', payload: { message } });

    const fallback = getMockArtifact(agentId, ctx.idea);
    updateAgent(runId, agentId, {
      status: 'error',
      finishedAt: Date.now(),
      error: message,
      finalArtifact: fallback,
      // Fallback artifacts are not worth critiquing — surface a fixed note instead.
      quality_score: 0,
      quality_critique: 'Output is a fallback. Re-run for a real result.',
    });
    emit(runId, { agent_id: agentId, type: 'result', payload: { artifact: fallback } });
    emit(runId, { agent_id: agentId, type: 'status', payload: { status: 'error' } });

    // eslint-disable-next-line no-console
    console.log(`[orch] ${runId.slice(0, 8)} ${agentId.padEnd(11)} ERROR ${String(Date.now() - t0).padStart(5)}ms (${mode}) — ${message.slice(0, 80)}`);

    return fallback;
  }
}

function getArtifact(runId: string, agentId: AgentId): unknown {
  const run = getRun(runId);
  return run?.agents[agentId]?.finalArtifact;
}

/**
 * Attempt one automatic refine pass for an agent that scored below threshold.
 * Calls the runner directly — does NOT go through runAgent — so that startedAt
 * is never overwritten. Resolves with the refined artifact, score, and critique.
 * Throws on runner error (caller is responsible for emitting error meta).
 * Never loops: one pass only, regardless of the refined score.
 */
async function runAutoRefine(
  runId: string,
  agentId: AgentId,
  ctx: RunContext,
  originalScore: number,
  critiqueFeedback: string,
): Promise<{ refinedArtifact: unknown; refinedScore: number; refinedCritique: string }> {
  const runner = agentRunners[agentId];
  if (!runner) {
    throw new Error(`No runner registered for ${agentId} — cannot auto-refine`);
  }

  const refineCtx: RunContext = {
    ...ctx,
    refine_feedback: critiqueFeedback,
  };

  // Pre-emit the feedback chunk so the streaming card shows the iteration is live.
  const preview = critiqueFeedback.slice(0, 80);
  const feedbackChunk = `> Refining based on feedback: "${preview}"\n\n`;
  appendChunk(runId, agentId, feedbackChunk);
  emit(runId, { agent_id: agentId, type: 'chunk', payload: { text: feedbackChunk } });

  // Call the runner directly. startedAt is NOT touched — preserve original.
  const refinedArtifact = await runner(refineCtx, (event) => {
    if (event.type === 'chunk' && event.agent_id === agentId) {
      appendChunk(runId, agentId, event.payload.text);
    }
    emit(runId, event);
  });

  // Re-critique the refined output (one pass, no recursion).
  const { score: refinedScore, critique: refinedCritique } = await critiqueArtifact({
    agentId,
    idea: ctx.idea,
    artifact: refinedArtifact,
  });

  // Log score delta (informational — OK if refine made it worse, caller persists).
  // eslint-disable-next-line no-console
  console.log(
    `[orch] ${runId.slice(0, 8)} ${agentId.padEnd(11)} re-critique ${originalScore} -> ${refinedScore}`,
  );

  return { refinedArtifact, refinedScore, refinedCritique };
}

export async function startRun(runId: string): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const { idea } = run;

  // ---- WAVE 1: strategist, namer, analyst (depends only on idea) ----------
  await Promise.allSettled([
    staggerRun(0, runId, 'strategist', { idea, upstream: {}, runId, privacy_mode: run.privacy_mode }),
    staggerRun(1, runId, 'namer',      { idea, upstream: {}, runId }),
    staggerRun(2, runId, 'analyst',    { idea, upstream: {}, runId }),
  ]);

  const strategistArtifact = getArtifact(runId, 'strategist');
  const namerArtifact = getArtifact(runId, 'namer');
  const analystArtifact = getArtifact(runId, 'analyst');

  const wave1Upstream: Partial<Record<AgentId, unknown>> = {
    strategist: strategistArtifact,
    namer: namerArtifact,
    analyst: analystArtifact,
  };

  // Wait before starting Wave 2
  await sleep(WAVE_TRANSITION_MS);

  // ---- WAVE 2: copywriter, designer, legal (need wave 1) ------------------
  await Promise.allSettled([
    staggerRun(0, runId, 'copywriter', { idea, upstream: wave1Upstream, runId }),
    staggerRun(1, runId, 'designer',   { idea, upstream: wave1Upstream, runId }),
    staggerRun(2, runId, 'legal',      { idea, upstream: wave1Upstream, runId, privacy_mode: run.privacy_mode }),
  ]);

  const copywriterArtifact = getArtifact(runId, 'copywriter');
  const designerArtifact = getArtifact(runId, 'designer');
  const legalArtifact = getArtifact(runId, 'legal');

  const wave2Upstream: Partial<Record<AgentId, unknown>> = {
    ...wave1Upstream,
    copywriter: copywriterArtifact,
    designer: designerArtifact,
    legal: legalArtifact,
  };

  // Wait before starting Wave 3
  await sleep(WAVE_TRANSITION_MS);

  // ---- WAVE 3: developer, marketer, growth (need waves 1+2) ---------------
  await Promise.allSettled([
    staggerRun(0, runId, 'developer', { idea, upstream: wave2Upstream, runId }),
    staggerRun(1, runId, 'marketer',  { idea, upstream: wave2Upstream, runId }),
    staggerRun(2, runId, 'growth',    { idea, upstream: wave2Upstream, runId }),
  ]);

  const developerArtifact = getArtifact(runId, 'developer');
  const marketerArtifact = getArtifact(runId, 'marketer');
  const growthArtifact = getArtifact(runId, 'growth');

  const wave3Upstream: Partial<Record<AgentId, unknown>> = {
    ...wave2Upstream,
    developer: developerArtifact,
    marketer: marketerArtifact,
    growth: growthArtifact,
  };

  // Wait before starting Wave 4
  await sleep(WAVE_TRANSITION_MS);

  // ---- WAVE 4: director (needs all prior waves) ----------------------------
  await runAgent(runId, 'director', { idea, upstream: wave3Upstream, runId });

  // ---- done ----------------------------------------------------------------
  stampRunFinished(runId);
  emit(runId, { agent_id: '__run', type: 'complete', payload: { run_id: runId } });
}
