import { EventEmitter } from 'node:events';
import { nanoid } from 'nanoid';
import type { AgentId, AgentEvent, Agent, AgentStatus } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import type { Run } from '@studio/shared';

const runs = new Map<string, Run>();
const emitters = new Map<string, EventEmitter>();
const buffers = new Map<string, AgentEvent[]>();

// Idempotency cache: same idea string within TTL returns the existing run_id
// instead of starting a new (billable) run.
const IDEA_CACHE_TTL_MS = 5 * 60 * 1000;
const ideaCache = new Map<string, { run_id: string; ts: number }>();

function normaliseIdea(idea: string): string {
  return idea.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findCachedRun(idea: string): Run | undefined {
  const key = normaliseIdea(idea);
  const cached = ideaCache.get(key);
  if (!cached) return undefined;
  if (Date.now() - cached.ts > IDEA_CACHE_TTL_MS) {
    ideaCache.delete(key);
    return undefined;
  }
  return runs.get(cached.run_id);
}

function makeInitialAgent(id: AgentId): Agent {
  const meta = AGENT_REGISTRY[id];
  return {
    id,
    name: meta.name,
    emoji: meta.emoji,
    status: 'queued' as AgentStatus,
    streamedText: '',
    tools: [],
  };
}

export function createRun(idea: string, opts?: { privacy_mode?: boolean }): Run {
  const run_id = nanoid();
  const agents = {} as Record<AgentId, Agent>;
  for (const id of AGENT_IDS) {
    agents[id] = makeInitialAgent(id);
  }
  const run: Run = {
    run_id,
    idea,
    startedAt: Date.now(),
    agents,
    privacy_mode: opts?.privacy_mode ?? false,
  };
  runs.set(run_id, run);
  emitters.set(run_id, new EventEmitter());
  buffers.set(run_id, []);
  ideaCache.set(normaliseIdea(idea), { run_id, ts: Date.now() });
  return run;
}

export function getRun(id: string): Run | undefined {
  return runs.get(id);
}

export function updateAgent(
  runId: string,
  agentId: AgentId,
  patch: Partial<Agent>,
): void {
  const run = runs.get(runId);
  if (!run) return;
  Object.assign(run.agents[agentId], patch);
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
  const run = runs.get(runId);
  if (run) run.finishedAt = Date.now();
}
