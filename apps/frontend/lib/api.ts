import type { CreateRunRequest, CreateRunResponse } from '@studio/shared';

export async function createRun(idea: string): Promise<CreateRunResponse> {
  const body: CreateRunRequest = { idea };

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
