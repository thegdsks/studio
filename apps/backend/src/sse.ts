import type { Request, Response } from 'express';
import type { AgentEvent } from '@studio/shared';
import { getEmitter, getBuffer, getRun } from './store.js';

export function sseHandler(req: Request, res: Response): void {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Missing run id' });
    return;
  }

  const run = getRun(id);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Replay buffered events for late-joiners
  const buffered = getBuffer(id);
  for (const event of buffered) {
    res.write(`event: agent\ndata: ${JSON.stringify(event)}\n\n`);
  }

  const emitter = getEmitter(id);
  if (!emitter) {
    res.end();
    return;
  }

  const onEvent = (event: AgentEvent) => {
    res.write(`event: agent\ndata: ${JSON.stringify(event)}\n\n`);
  };

  emitter.on('event', onEvent);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    emitter.off('event', onEvent);
  });
}
