/**
 * Demo replayer: reads a DemoFixture and replays its events through the
 * normal store.emit path with realistic timing.
 *
 * Timing contract:
 *   - Total replay is capped at MAX_REPLAY_MS (90s).
 *   - If the original run took longer, all t_ms offsets are scaled
 *     proportionally so the last event fires at exactly MAX_REPLAY_MS.
 *   - If the original run took <=90s, offsets are used as-is.
 *
 * Late-joining SSE clients:
 *   The store already maintains a per-run replay buffer (store.getBuffer).
 *   Every event emitted via store.emit is appended to that buffer, and
 *   sseHandler flushes the buffer to any client that connects mid-replay.
 *   No extra buffering logic is needed here.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRun, emit, updateAgent, appendChunk, stampRunFinished } from '../store.js';
import type { AgentEvent, AgentId, AgentStatus } from '@studio/shared';
import type { DemoFixture, DemoFixtureEvent } from './recorder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = resolve(__dirname, 'fixtures');

const MAX_REPLAY_MS = 90_000;

/** Load and parse a fixture file by filename (e.g. "default.json"). */
export function loadFixture(fixtureName: string): DemoFixture {
  const fixturePath = resolve(FIXTURES_DIR, fixtureName);
  let raw: string;
  try {
    raw = readFileSync(fixturePath, 'utf-8');
  } catch (err) {
    throw new Error(`[replayer] Fixture not found at ${fixturePath}: ${String(err)}`);
  }
  return JSON.parse(raw) as DemoFixture;
}

/**
 * Compute a scaling factor so the last event lands at or before MAX_REPLAY_MS.
 * Returns 1.0 if the original run already fits.
 */
function computeScale(events: DemoFixtureEvent[]): number {
  if (events.length === 0) return 1;
  const lastT = events[events.length - 1]?.t_ms ?? 0;
  if (lastT <= MAX_REPLAY_MS) return 1;
  return MAX_REPLAY_MS / lastT;
}

/**
 * Apply a store-side side-effect for an event so the SQLite snapshot stays
 * roughly consistent with what SSE clients observe.
 */
function applyStoreEffect(runId: string, event: AgentEvent): void {
  if (event.agent_id === '__run') return;

  const agentId = event.agent_id as AgentId;

  if (event.type === 'status') {
    const s = event.payload as { status: AgentStatus };
    if (s.status === 'running') {
      updateAgent(runId, agentId, { status: 'running', startedAt: Date.now() });
    } else if (s.status === 'done') {
      updateAgent(runId, agentId, { status: 'done', finishedAt: Date.now() });
    } else if (s.status === 'error') {
      updateAgent(runId, agentId, { status: 'error', finishedAt: Date.now() });
    } else {
      updateAgent(runId, agentId, { status: s.status });
    }
  } else if (event.type === 'chunk') {
    const c = event.payload as { text: string };
    appendChunk(runId, agentId, c.text);
  } else if (event.type === 'result') {
    const r = event.payload as { artifact: unknown };
    updateAgent(runId, agentId, { finalArtifact: r.artifact });
  } else if (event.type === 'meta') {
    const m = event.payload as { quality_score?: number; quality_critique?: string; ranLocally?: boolean };
    updateAgent(runId, agentId, {
      quality_score: m.quality_score,
      quality_critique: m.quality_critique,
      ranLocally: m.ranLocally,
    });
  }
}

/**
 * Start replaying a fixture. Creates a fresh run in the store, then schedules
 * each event at its (scaled) t_ms offset via setTimeout.
 *
 * Returns the new run_id. The run is immediately visible in the store so SSE
 * clients can subscribe before the first event fires.
 */
export function replayRun(fixture: DemoFixture): string {
  const run = createRun(fixture.idea, { privacy_mode: false });
  const runId = run.run_id;

  const scale = computeScale(fixture.events);

  for (const fixtureEvent of fixture.events) {
    const delay = Math.round(fixtureEvent.t_ms * scale);

    // Re-construct the typed AgentEvent from the fixture shape.
    const event = {
      agent_id: fixtureEvent.agent_id,
      type: fixtureEvent.type,
      payload: fixtureEvent.payload,
    } as AgentEvent;

    setTimeout(() => {
      applyStoreEffect(runId, event);
      emit(runId, event);

      // Stamp run finished when the synthetic 'complete' fires.
      if (event.agent_id === '__run' && event.type === 'complete') {
        stampRunFinished(runId);
      }
    }, delay);
  }

  process.stderr.write(
    `[replayer] Started demo run ${runId} (${fixture.events.length} events, scale=${scale.toFixed(3)})\n`,
  );

  return runId;
}
