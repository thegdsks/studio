/**
 * SQLite persistence for Studio runs. Runs survive backend restarts
 * (important during tsx-watch dev cycle and demo recovery).
 *
 * Schema:
 *   runs(run_id PK, idea, started_at, finished_at?, privacy_mode)
 *   agents(run_id FK, agent_id, status, started_at?, finished_at?,
 *          streamed_text, final_artifact JSON?, tools JSON, error?,
 *          ran_locally?)
 *
 * Layout choice: each agent gets its own row keyed on (run_id, agent_id)
 * so we can upsert per-agent without rewriting the whole run blob.
 *
 * The EventEmitters and idea-cache are intentionally kept in memory —
 * they're runtime-only state (live SSE subscriptions, dedup window).
 */

import Database from 'better-sqlite3';
import type Sqlite from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Agent, AgentId, AgentStatus, Run } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';

const DB_PATH = process.env['STUDIO_DB_PATH']
  ? resolve(process.env['STUDIO_DB_PATH'])
  : resolve(process.cwd(), '.studio/studio.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db: Sqlite.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    run_id        TEXT PRIMARY KEY,
    idea          TEXT NOT NULL,
    started_at    INTEGER NOT NULL,
    finished_at   INTEGER,
    privacy_mode  INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);

  CREATE TABLE IF NOT EXISTS agents (
    run_id          TEXT NOT NULL,
    agent_id        TEXT NOT NULL,
    status          TEXT NOT NULL,
    started_at      INTEGER,
    finished_at     INTEGER,
    streamed_text   TEXT NOT NULL DEFAULT '',
    final_artifact  TEXT,
    tools           TEXT NOT NULL DEFAULT '[]',
    error           TEXT,
    ran_locally     INTEGER,
    PRIMARY KEY (run_id, agent_id),
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_agents_run_id ON agents(run_id);

  CREATE TABLE IF NOT EXISTS media (
    id          TEXT PRIMARY KEY,
    run_id      TEXT NOT NULL,
    agent_id    TEXT,
    slug        TEXT NOT NULL,
    kind        TEXT NOT NULL,
    mime        TEXT NOT NULL,
    path        TEXT NOT NULL,
    prompt      TEXT,
    width       INTEGER,
    height      INTEGER,
    bytes       INTEGER,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_media_run_id ON media(run_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_media_run_slug ON media(run_id, slug);
`);

// ---- prepared statements ---------------------------------------------------

const stmtInsertRun = db.prepare(`
  INSERT INTO runs (run_id, idea, started_at, finished_at, privacy_mode)
  VALUES (@run_id, @idea, @started_at, @finished_at, @privacy_mode)
`);
const stmtInsertAgent = db.prepare(`
  INSERT INTO agents (run_id, agent_id, status, streamed_text, tools)
  VALUES (@run_id, @agent_id, @status, '', '[]')
`);
const stmtUpdateRunFinished = db.prepare(`
  UPDATE runs SET finished_at = @finished_at WHERE run_id = @run_id
`);
const stmtGetRun = db.prepare(`SELECT * FROM runs WHERE run_id = ?`);
const stmtGetAgents = db.prepare(`SELECT * FROM agents WHERE run_id = ?`);
const stmtAppendChunk = db.prepare(`
  UPDATE agents SET streamed_text = streamed_text || @chunk
  WHERE run_id = @run_id AND agent_id = @agent_id
`);
const stmtUpdateAgentStatus = db.prepare(`
  UPDATE agents SET status = @status, started_at = @started_at, finished_at = @finished_at
  WHERE run_id = @run_id AND agent_id = @agent_id
`);
const stmtUpdateAgentArtifact = db.prepare(`
  UPDATE agents SET final_artifact = @final_artifact
  WHERE run_id = @run_id AND agent_id = @agent_id
`);
const stmtUpdateAgentError = db.prepare(`
  UPDATE agents SET error = @error WHERE run_id = @run_id AND agent_id = @agent_id
`);
const stmtUpdateAgentRanLocally = db.prepare(`
  UPDATE agents SET ran_locally = 1 WHERE run_id = @run_id AND agent_id = @agent_id
`);
const stmtUpdateAgentTools = db.prepare(`
  UPDATE agents SET tools = @tools WHERE run_id = @run_id AND agent_id = @agent_id
`);
const stmtDeleteRun = db.prepare(`DELETE FROM runs WHERE run_id = ?`);
const stmtListSummaries = db.prepare(`
  SELECT
    r.run_id, r.idea, r.started_at, r.finished_at, r.privacy_mode,
    SUM(CASE WHEN a.status = 'queued'  THEN 1 ELSE 0 END) AS queued,
    SUM(CASE WHEN a.status = 'running' THEN 1 ELSE 0 END) AS running,
    SUM(CASE WHEN a.status = 'done'    THEN 1 ELSE 0 END) AS done,
    SUM(CASE WHEN a.status = 'error'   THEN 1 ELSE 0 END) AS error,
    SUM(CASE WHEN a.ran_locally = 1    THEN 1 ELSE 0 END) AS ran_locally,
    COUNT(a.agent_id) AS total
  FROM runs r
  LEFT JOIN agents a ON a.run_id = r.run_id
  GROUP BY r.run_id
  ORDER BY r.started_at DESC
`);

// ---- row types -------------------------------------------------------------

interface RunRow {
  run_id: string;
  idea: string;
  started_at: number;
  finished_at: number | null;
  privacy_mode: number;
}

interface AgentRow {
  run_id: string;
  agent_id: AgentId;
  status: AgentStatus;
  started_at: number | null;
  finished_at: number | null;
  streamed_text: string;
  final_artifact: string | null;
  tools: string;
  error: string | null;
  ran_locally: number | null;
}

interface SummaryRow {
  run_id: string;
  idea: string;
  started_at: number;
  finished_at: number | null;
  privacy_mode: number;
  queued: number;
  running: number;
  done: number;
  error: number;
  ran_locally: number;
  total: number;
}

// ---- helpers ---------------------------------------------------------------

function rowToAgent(r: AgentRow): Agent {
  const meta = AGENT_REGISTRY[r.agent_id];
  const agent: Agent = {
    id: r.agent_id,
    name: meta.name,
    emoji: meta.emoji,
    status: r.status,
    streamedText: r.streamed_text,
    tools: JSON.parse(r.tools) as string[],
  };
  if (r.started_at !== null) agent.startedAt = r.started_at;
  if (r.finished_at !== null) agent.finishedAt = r.finished_at;
  if (r.final_artifact !== null) agent.finalArtifact = JSON.parse(r.final_artifact);
  if (r.error !== null) agent.error = r.error;
  if (r.ran_locally === 1) agent.ranLocally = true;
  return agent;
}

function rowsToRun(runRow: RunRow, agentRows: AgentRow[]): Run {
  const agents = {} as Record<AgentId, Agent>;
  for (const id of AGENT_IDS) {
    const row = agentRows.find((a) => a.agent_id === id);
    if (row) {
      agents[id] = rowToAgent(row);
    } else {
      const meta = AGENT_REGISTRY[id];
      agents[id] = {
        id,
        name: meta.name,
        emoji: meta.emoji,
        status: 'queued',
        streamedText: '',
        tools: [],
      };
    }
  }
  const run: Run = {
    run_id: runRow.run_id,
    idea: runRow.idea,
    startedAt: runRow.started_at,
    agents,
    privacy_mode: runRow.privacy_mode === 1,
  };
  if (runRow.finished_at !== null) run.finishedAt = runRow.finished_at;
  return run;
}

// ---- public API ------------------------------------------------------------

export function dbCreateRun(run: { run_id: string; idea: string; startedAt: number; privacy_mode: boolean }): void {
  const seedAgents = db.transaction(() => {
    stmtInsertRun.run({
      run_id: run.run_id,
      idea: run.idea,
      started_at: run.startedAt,
      finished_at: null,
      privacy_mode: run.privacy_mode ? 1 : 0,
    });
    for (const id of AGENT_IDS) {
      stmtInsertAgent.run({ run_id: run.run_id, agent_id: id, status: 'queued' as AgentStatus });
    }
  });
  seedAgents();
}

export function dbGetRun(runId: string): Run | undefined {
  const runRow = stmtGetRun.get(runId) as RunRow | undefined;
  if (!runRow) return undefined;
  const agentRows = stmtGetAgents.all(runId) as AgentRow[];
  return rowsToRun(runRow, agentRows);
}

export function dbDeleteRun(runId: string): boolean {
  const info = stmtDeleteRun.run(runId);
  return info.changes > 0;
}

export function dbAppendChunk(runId: string, agentId: AgentId, chunk: string): void {
  stmtAppendChunk.run({ run_id: runId, agent_id: agentId, chunk });
}

export function dbUpdateAgent(
  runId: string,
  agentId: AgentId,
  patch: Partial<Agent>,
): void {
  if (patch.status !== undefined || patch.startedAt !== undefined || patch.finishedAt !== undefined) {
    const existing = db
      .prepare(`SELECT status, started_at, finished_at FROM agents WHERE run_id = ? AND agent_id = ?`)
      .get(runId, agentId) as { status: AgentStatus; started_at: number | null; finished_at: number | null } | undefined;
    if (existing) {
      stmtUpdateAgentStatus.run({
        run_id: runId,
        agent_id: agentId,
        status: patch.status ?? existing.status,
        started_at: patch.startedAt ?? existing.started_at,
        finished_at: patch.finishedAt ?? existing.finished_at,
      });
    }
  }
  if (patch.finalArtifact !== undefined) {
    stmtUpdateAgentArtifact.run({
      run_id: runId,
      agent_id: agentId,
      final_artifact: JSON.stringify(patch.finalArtifact),
    });
  }
  if (patch.error !== undefined) {
    stmtUpdateAgentError.run({ run_id: runId, agent_id: agentId, error: patch.error });
  }
  if (patch.ranLocally === true) {
    stmtUpdateAgentRanLocally.run({ run_id: runId, agent_id: agentId });
  }
  if (patch.tools !== undefined) {
    stmtUpdateAgentTools.run({ run_id: runId, agent_id: agentId, tools: JSON.stringify(patch.tools) });
  }
}

export function dbStampRunFinished(runId: string, finishedAt: number): void {
  stmtUpdateRunFinished.run({ run_id: runId, finished_at: finishedAt });
}

export interface RawSummaryRow {
  run_id: string;
  idea: string;
  started_at: number;
  finished_at: number | null;
  privacy_mode: 0 | 1;
  queued: number;
  running: number;
  done: number;
  error: number;
  ran_locally: number;
  total: number;
}

export function dbListSummaries(): RawSummaryRow[] {
  return stmtListSummaries.all() as SummaryRow[] as RawSummaryRow[];
}

export function dbCountRuns(): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM runs`).get() as { n: number };
  return row.n;
}

// ---- media -----------------------------------------------------------------

export interface MediaRecord {
  id: string;
  run_id: string;
  agent_id: AgentId | null;
  slug: string;
  kind: string;
  mime: string;
  path: string;
  prompt: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  created_at: number;
}

const stmtInsertMedia = db.prepare(`
  INSERT INTO media (id, run_id, agent_id, slug, kind, mime, path, prompt, width, height, bytes, created_at)
  VALUES (@id, @run_id, @agent_id, @slug, @kind, @mime, @path, @prompt, @width, @height, @bytes, @created_at)
  ON CONFLICT(run_id, slug) DO UPDATE SET
    path       = excluded.path,
    mime       = excluded.mime,
    prompt     = excluded.prompt,
    width      = excluded.width,
    height     = excluded.height,
    bytes      = excluded.bytes,
    created_at = excluded.created_at
`);
const stmtListMediaByRun = db.prepare(`
  SELECT * FROM media WHERE run_id = ? ORDER BY created_at ASC
`);
const stmtGetMedia = db.prepare(`
  SELECT * FROM media WHERE run_id = ? AND slug = ?
`);

export function dbInsertMedia(record: Omit<MediaRecord, 'created_at'> & { created_at?: number }): MediaRecord {
  const ts = record.created_at ?? Date.now();
  stmtInsertMedia.run({
    id: record.id,
    run_id: record.run_id,
    agent_id: record.agent_id,
    slug: record.slug,
    kind: record.kind,
    mime: record.mime,
    path: record.path,
    prompt: record.prompt,
    width: record.width,
    height: record.height,
    bytes: record.bytes,
    created_at: ts,
  });
  return { ...record, created_at: ts };
}

export function dbListMediaByRun(runId: string): MediaRecord[] {
  return stmtListMediaByRun.all(runId) as MediaRecord[];
}

export function dbGetMedia(runId: string, slug: string): MediaRecord | undefined {
  return stmtGetMedia.get(runId, slug) as MediaRecord | undefined;
}

/**
 * Bind close on process exit so WAL is flushed cleanly. better-sqlite3 also
 * handles SIGTERM gracefully on its own but this is belt + suspenders.
 */
process.on('beforeExit', () => {
  try {
    db.close();
  } catch {
    /* already closed */
  }
});

export { db };
