import type { CreateRunRequest, CreateRunResponse } from '@studio/shared';

export async function createRun(
  idea: string,
  opts: { privacy_mode?: boolean } = {},
): Promise<CreateRunResponse> {
  const body: CreateRunRequest = { idea };
  if (opts.privacy_mode) body.privacy_mode = true;

  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to create run (${res.status}): ${text}`);
  }

  return (await res.json()) as CreateRunResponse;
}

/**
 * Trigger the demo replay. POSTs to /api/runs/demo and returns a run_id
 * that can be used identically to a real run (same SSE endpoint, same page).
 *
 * Throws if the fixture is missing (404) — fail loudly, no silent fallback.
 */
export async function startDemoRun(fixture?: string): Promise<CreateRunResponse> {
  const body = fixture ? { fixture } : {};
  const res = await fetch('/api/runs/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Demo run failed (${res.status}): ${text}`);
  }

  return (await res.json()) as CreateRunResponse;
}
