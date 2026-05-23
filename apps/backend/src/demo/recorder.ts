/**
 * Demo recorder: when DEMO_RECORD=1, taps the store emit path and writes
 * every AgentEvent (with ms offset from run start) to a fixture file.
 *
 * Enabled via a one-liner in server.ts:
 *   if (process.env['DEMO_RECORD'] === '1') attachRecorder(runId, runStartMs);
 *
 * File format: DemoFixture (see below).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEmitter } from '../store.js';
import type { AgentEvent } from '@studio/shared';

export interface DemoFixtureEvent {
  t_ms: number;
  type: AgentEvent['type'];
  agent_id: AgentEvent['agent_id'];
  payload: AgentEvent['payload'];
}

export interface DemoFixture {
  runId: string;
  idea: string;
  events: DemoFixtureEvent[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, 'fixtures');

/**
 * Attach a recorder to a run's emitter. Writes to fixtures/<runId>.json
 * when the run emits its 'complete' event or after 120s (safety timeout).
 *
 * @param runId   The run_id returned by createRun.
 * @param idea    The idea string, stored in the fixture for reference.
 * @param startMs Epoch ms of run creation (used to compute t_ms offsets).
 */
export function attachRecorder(runId: string, idea: string, startMs: number): void {
  const emitter = getEmitter(runId);
  if (!emitter) {
    process.stderr.write(`[recorder] No emitter found for ${runId} — skipping\n`);
    return;
  }

  const events: DemoFixtureEvent[] = [];

  const onEvent = (event: AgentEvent): void => {
    events.push({
      t_ms: Date.now() - startMs,
      type: event.type,
      agent_id: event.agent_id,
      payload: event.payload,
    });

    if (event.agent_id === '__run' && event.type === 'complete') {
      flush();
    }
  };

  emitter.on('event', onEvent);

  // Safety flush after 120s in case 'complete' never fires.
  const safetyTimer = setTimeout(() => {
    process.stderr.write(`[recorder] Safety timeout reached for ${runId} — flushing\n`);
    flush();
  }, 120_000);

  function flush(): void {
    clearTimeout(safetyTimer);
    emitter?.off('event', onEvent);

    const fixture: DemoFixture = { runId, idea, events };

    mkdirSync(FIXTURES_DIR, { recursive: true });
    const outPath = resolve(FIXTURES_DIR, `${runId}.json`);
    writeFileSync(outPath, JSON.stringify(fixture, null, 2), 'utf-8');
    process.stderr.write(`[recorder] Wrote fixture: ${outPath} (${events.length} events)\n`);
  }
}
