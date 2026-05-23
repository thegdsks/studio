import express from 'express';
import cors from 'cors';
import { createRun, getRun, findCachedRun, listRunSummaries, deleteRun } from './store.js';
import { listMedia, readMediaFile } from './media.js';
import { sseHandler } from './sse.js';
import { startRun } from './orchestrator.js';
import { MOCK_ONLY } from './runners.js';

const app = express();
const PORT = process.env['PORT'] ? Number(process.env['PORT']) : 4000;

// Guardrail: sliding-window rate limit on POST /api/runs
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX_RUNS_PER_HOUR = Number(process.env['MAX_RUNS_PER_HOUR'] ?? 20);
const runTimestamps: number[] = [];

function dropExpired(now: number): void {
  while (runTimestamps.length > 0 && now - (runTimestamps[0] ?? 0) > RATE_WINDOW_MS) {
    runTimestamps.shift();
  }
}

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

// Usage snapshot — for frontend cost indicator
app.get('/api/usage', (_req, res) => {
  dropExpired(Date.now());
  res.json({
    runsInWindow: runTimestamps.length,
    maxPerHour: MAX_RUNS_PER_HOUR,
    mockOnly: MOCK_ONLY,
    windowMs: RATE_WINDOW_MS,
  });
});

// Create a new run
app.post('/api/runs', (req, res) => {
  const body = req.body as { idea?: string; privacy_mode?: boolean };
  const idea = typeof body.idea === 'string' ? body.idea.trim() : '';
  const privacy_mode = body.privacy_mode === true;

  if (!idea) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }

  // Idempotency: same (idea, privacy_mode) within 5min returns the existing run_id (no cost).
  const cached = findCachedRun(idea, privacy_mode);
  if (cached) {
    res.status(200).json({ run_id: cached.run_id, cached: true });
    return;
  }

  // Rate limit
  const now = Date.now();
  dropExpired(now);
  if (runTimestamps.length >= MAX_RUNS_PER_HOUR) {
    const oldest = runTimestamps[0] ?? now;
    res.status(429).json({
      error: 'rate limit exceeded',
      retryAfterMs: RATE_WINDOW_MS - (now - oldest),
      maxPerHour: MAX_RUNS_PER_HOUR,
    });
    return;
  }
  runTimestamps.push(now);

  const run = createRun(idea, { privacy_mode });

  // Kick off orchestrator without awaiting — fire and forget
  startRun(run.run_id).catch((err: unknown) => {
    console.error(`[server] orchestrator error for run ${run.run_id}:`, err);
  });

  res.status(201).json({ run_id: run.run_id });
});

// List all runs (summaries — no per-agent artifacts). Newest first.
app.get('/api/runs', (_req, res) => {
  res.json({ runs: listRunSummaries() });
});

// SSE stream for a run
app.get('/api/runs/:id/events', sseHandler);

// JSON snapshot of a run
app.get('/api/runs/:id', (req, res) => {
  const run = getRun(req.params['id'] ?? '');
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.json(run);
});

// Media — list assets for a run
app.get('/api/media/:runId', (req, res) => {
  const runId = req.params['runId'] ?? '';
  const items = listMedia(runId);
  res.json({ media: items });
});

// Media — serve a single asset file
app.get('/api/media/file/:runId/:slug', (req, res) => {
  const runId = req.params['runId'] ?? '';
  const slug = req.params['slug'] ?? '';
  const file = readMediaFile(runId, slug);
  if (!file) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }
  res.setHeader('Content-Type', file.mime);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(file.bytes);
});

// Delete a run (and cascade its agents). Used by dashboard row delete.
app.delete('/api/runs/:id', (req, res) => {
  const id = req.params['id'] ?? '';
  const removed = deleteRun(id);
  if (!removed) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.status(204).end();
});

// Share card generator (runs/:id/share.png)
app.get('/api/runs/:id/share.png', (req, res) => {
  const run = getRun(req.params['id'] ?? '');
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  const strategistOut = run.agents.strategist?.finalArtifact as any;
  const namerOut = run.agents.namer?.finalArtifact as any;
  const designerOut = run.agents.designer?.finalArtifact as any;
  const copywriterOut = run.agents.copywriter?.finalArtifact as any;
  const directorOut = run.agents.director?.finalArtifact as any;

  const brandName = namerOut?.names?.[0]?.name ?? 'Studio Startup';
  const positioning = strategistOut?.positioning ?? run.idea;
  const primaryColor = designerOut?.palette?.primary ?? '#6366f1';
  const accentColor = designerOut?.palette?.accent ?? '#38bdf8';
  const headline = copywriterOut?.hero?.headline ?? 'Launch Strategic Blueprint';
  const coherenceScore = directorOut?.coherence_score ?? 90;
  const oneLiner = directorOut?.one_line_pitch ?? positioning;

  const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  const truncateText = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <path d="M 0 100 L 1200 100 M 0 200 L 1200 200 M 0 300 L 1200 300 M 0 400 L 1200 400 M 0 500 L 1200 500 M 100 0 L 100 630 M 200 0 L 200 630 M 300 0 L 300 630 M 400 0 L 400 630 M 500 0 L 500 630 M 600 0 L 600 630 M 700 0 L 700 630 M 800 0 L 800 630 M 900 0 L 900 630 M 1000 0 L 1000 630 M 1100 0 L 1100 630" stroke="#1f2937" stroke-opacity="0.2" stroke-width="1" />

  <foreignObject x="40" y="40" width="1120" height="550">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      width: 100%;
      height: 100%;
      background: rgba(17, 24, 39, 0.6);
      border: 2px solid ${primaryColor}40;
      border-radius: 24px;
      padding: 60px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-family: system-ui, -apple-system, sans-serif;
      color: #ffffff;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: ${accentColor}; font-family: monospace;">🚀 STARTUP DECK</span>
          <h1 style="margin: 8px 0 0 0; font-size: 56px; font-weight: 950; letter-spacing: -1.5px; text-transform: uppercase;">
            ${escapeXml(brandName)}
          </h1>
        </div>
        <div style="
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 40px;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
          <span style="font-size: 13px; font-weight: 700; color: #10b981; font-family: monospace;">LIVE ON VERCEL</span>
        </div>
      </div>

      <div style="margin-top: -20px;">
        <h2 style="margin: 0; font-size: 40px; font-weight: 800; line-height: 1.25; color: #f3f4f6;">
          ${escapeXml(headline)}
        </h2>
        <p style="margin: 16px 0 0 0; font-size: 20px; font-weight: 400; line-height: 1.5; color: #9ca3af; max-width: 950px;">
          ${escapeXml(truncateText(oneLiner, 180))}
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 30px;">
        <div style="display: flex; gap: 24px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #6b7280; font-family: monospace; text-transform: uppercase;">Coherence</div>
            <div style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 4px;">${coherenceScore}%</div>
          </div>
          <div style="width: 1px; background: rgba(255,255,255,0.1); height: 40px;"></div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #6b7280; font-family: monospace; text-transform: uppercase;">Confidence</div>
            <div style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 4px;">High</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 11px; font-weight: 700; color: #6b7280; font-family: monospace; text-transform: uppercase;">ORCHESTRATED BY</span>
          <span style="font-size: 22px; font-weight: 900; background: linear-gradient(to right, ${accentColor}, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 4px; letter-spacing: -0.5px;">STUDIO AI</span>
        </div>
      </div>
    </div>
  </foreignObject>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

app.listen(PORT, () => {
  console.log(`[server] Studio backend listening on http://localhost:${PORT}`);
});
