import express from 'express';
import cors from 'cors';
import { createRun, getRun } from './store.js';
import { sseHandler } from './sse.js';
import { startRun } from './orchestrator.js';

const app = express();
const PORT = process.env['PORT'] ? Number(process.env['PORT']) : 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

// Create a new run
app.post('/api/runs', (req, res) => {
  const body = req.body as { idea?: string };
  const idea = typeof body.idea === 'string' ? body.idea.trim() : '';

  if (!idea) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }

  const run = createRun(idea);

  // Kick off orchestrator without awaiting — fire and forget
  startRun(run.run_id).catch((err: unknown) => {
    console.error(`[server] orchestrator error for run ${run.run_id}:`, err);
  });

  res.status(201).json({ run_id: run.run_id });
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

app.listen(PORT, () => {
  console.log(`[server] Studio backend listening on http://localhost:${PORT}`);
});
