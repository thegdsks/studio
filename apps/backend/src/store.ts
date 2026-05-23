/**
 * Run/agent state lives in SQLite (see ./db.ts). This module is a thin
 * facade that adds the runtime-only pieces:
 *   - per-run EventEmitter for live SSE subscribers
 *   - per-run in-memory replay buffer (so a late-joining SSE client gets
 *     the events it missed between createRun and `connect`)
 *   - 5-minute idempotency cache keyed by (normalised idea, privacy_mode)
 *
 * Emitters + buffers are intentionally NOT persisted — they would be
 * meaningless after a process restart (the SSE clients are gone).
 */

import { EventEmitter } from 'node:events';
import { nanoid } from 'nanoid';
import type { AgentId, AgentEvent, Agent, Run, RunSummary } from '@studio/shared';
import {
  dbCreateRun,
  dbGetRun,
  dbDeleteRun,
  dbAppendChunk,
  dbUpdateAgent,
  dbStampRunFinished,
  dbListSummaries,
  dbResetAgentArtifactAndQuality,
} from './db.js';

const emitters = new Map<string, EventEmitter>();
const buffers = new Map<string, AgentEvent[]>();

// Idempotency cache: same (idea, privacy_mode) within TTL returns the existing
// run_id instead of starting a new (billable) run.
const IDEA_CACHE_TTL_MS = 5 * 60 * 1000;
const ideaCache = new Map<string, { run_id: string; ts: number }>();

function normaliseIdea(idea: string, privacy_mode: boolean): string {
  return `${privacy_mode ? '1' : '0'}::${idea.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

export function findCachedRun(idea: string, privacy_mode: boolean): Run | undefined {
  const key = normaliseIdea(idea, privacy_mode);
  const cached = ideaCache.get(key);
  if (!cached) return undefined;
  if (Date.now() - cached.ts > IDEA_CACHE_TTL_MS) {
    ideaCache.delete(key);
    return undefined;
  }
  return dbGetRun(cached.run_id);
}

export function createRun(idea: string, opts?: { privacy_mode?: boolean }): Run {
  const run_id = nanoid();
  const startedAt = Date.now();
  const privacy_mode = opts?.privacy_mode ?? false;

  dbCreateRun({ run_id, idea, startedAt, privacy_mode });

  emitters.set(run_id, new EventEmitter());
  buffers.set(run_id, []);
  ideaCache.set(normaliseIdea(idea, privacy_mode), { run_id, ts: Date.now() });

  const run = dbGetRun(run_id);
  if (!run) throw new Error(`[store] createRun: failed to read back ${run_id}`);
  return run;
}

export function getRun(id: string): Run | undefined {
  return dbGetRun(id);
}

export function deleteRun(id: string): boolean {
  emitters.delete(id);
  buffers.delete(id);
  return dbDeleteRun(id);
}

export function updateAgent(
  runId: string,
  agentId: AgentId,
  patch: Partial<Agent>,
): void {
  dbUpdateAgent(runId, agentId, patch);
}

/**
 * Append a chunk to the agent's streamed text in a single SQL update
 * (no read-modify-write race). Used by the orchestrator's SSE mirror.
 */
export function appendChunk(runId: string, agentId: AgentId, chunk: string): void {
  dbAppendChunk(runId, agentId, chunk);
}

export function emit(runId: string, event: AgentEvent): void {
  const buf = buffers.get(runId);
  if (buf) buf.push(event);
  const emitter = emitters.get(runId);
  if (emitter) emitter.emit('event', event);
}

export function getEmitter(runId: string): EventEmitter | undefined {
  return emitters.get(runId);
}

export function getBuffer(runId: string): AgentEvent[] {
  return buffers.get(runId) ?? [];
}

export function stampRunFinished(runId: string): void {
  dbStampRunFinished(runId, Date.now());
}

/**
 * Reset an agent's transient fields in preparation for a re-run or refine.
 * Does NOT touch status — the caller is responsible for setting that.
 * We clear streamed text, artifact, error, and quality data so the next
 * run starts with a blank slate.
 */
export function resetAgentForRerun(runId: string, agentId: AgentId): void {
  // Clear streamed text via the dedicated reset path (empty string sentinel).
  dbUpdateAgent(runId, agentId, { streamedText: '' });
  // Null out quality fields by passing score=0 and empty critique explicitly;
  // the refine endpoint will treat this as "pending critique".
  // We also clear the artifact by setting it to null via a direct DB call.
  dbResetAgentArtifactAndQuality(runId, agentId);
}

export function listRunSummaries(): RunSummary[] {
  const rows = dbListSummaries();
  return rows.map((r) => {
    const summary: RunSummary = {
      run_id: r.run_id,
      idea: r.idea,
      startedAt: r.started_at,
      privacy_mode: r.privacy_mode === 1,
      counts: {
        queued: r.queued,
        running: r.running,
        done: r.done,
        error: r.error,
      },
      ranLocally: r.ran_locally,
      total: r.total,
      cost_usd: r.cost_usd,
    };
    if (r.finished_at !== null) summary.finishedAt = r.finished_at;
    return summary;
  });
}
