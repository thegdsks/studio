export async function refineAgent(
  runId: string,
  agentId: string,
  feedback: string,
): Promise<{ iteration: number }> {
  const res = await fetch(`/api/runs/${runId}/agents/${agentId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error(`Refine failed: ${res.status}`);
  return (await res.json()) as { iteration: number };
}

export async function rerunAgent(
  runId: string,
  agentId: string,
): Promise<{ iteration: number }> {
  const res = await fetch(`/api/runs/${runId}/agents/${agentId}/rerun`, { method: 'POST' });
  if (!res.ok) throw new Error(`Rerun failed: ${res.status}`);
  return (await res.json()) as { iteration: number };
}

export async function stopAgent(runId: string, agentId: string): Promise<void> {
  const res = await fetch(`/api/runs/${runId}/agents/${agentId}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Stop failed: ${res.status}`);
}

export async function refineAgentBody(
  runId: string,
  agentId: string,
  feedback?: string,
): Promise<{ iteration: number }> {
  const res = await fetch(`/api/runs/${runId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, feedback }),
  });
  if (!res.ok) throw new Error(`Refine failed: ${res.status}`);
  return (await res.json()) as { iteration: number };
}
