/**
 * Thin cost-recording helper for agent runtimes.
 *
 * Call sites live in agents/ which share a package boundary with apps/backend.
 * This module lazy-imports the DB helpers so it can be safely bundled into
 * either package and degrades gracefully when the DB is unavailable (e.g. in
 * isolated unit test runs).
 *
 * Failure contract: recordCost never throws — a failed write is logged to
 * stderr but must not cause the wrapping API call to fail.
 */

import { randomUUID } from 'node:crypto';

export interface RunContext {
  runId: string;
  agentId: string;
}

export interface CostEntry {
  runContext: RunContext;
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
  durationMs?: number;
}

export async function recordCost(entry: CostEntry): Promise<void> {
  try {
    // Dynamic import keeps the agents package from hard-wiring the backend DB.
    const { dbInsertCost, computeCostUsd } = await import(
      '../../apps/backend/src/db.js'
    );

    const usd = computeCostUsd({
      model: entry.model,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      images: entry.images,
    });

    dbInsertCost({
      id: randomUUID(),
      run_id: entry.runContext.runId,
      agent_id: entry.runContext.agentId,
      model: entry.model,
      provider: entry.provider,
      input_tokens: entry.inputTokens ?? 0,
      output_tokens: entry.outputTokens ?? 0,
      images: entry.images ?? 0,
      usd,
      duration_ms: entry.durationMs ?? null,
    });
  } catch (err) {
    process.stderr.write(
      `[costRecorder] failed to record cost for ${entry.runContext.runId}/${entry.runContext.agentId}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}
