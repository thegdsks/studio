'use client';

/**
 * Run-page state hook. Delegates SSE + agent state to the shared
 * `useRunStream` hook and adds the panel-open UI state that only the
 * grid run page needs.
 */

import { useState } from 'react';
import { useRunStream } from '@/lib/useRunStream';
import type { AgentsState } from '@/lib/useRunStream';

// Re-export so run page and workspace can import from a single location.
export { AGENT_DEPENDENCIES } from '@/lib/useRunStream';
export type { AgentsState };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface RunState {
  agents: AgentsState;
  runComplete: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  runStartedAt: number;
  runFinishedAt: number | undefined;
}

export function useRunState(runId: string): RunState {
  const { agents, runComplete, runStartedAt, runFinishedAt } = useRunStream(runId);
  const [panelOpen, setPanelOpen] = useState(false);

  return { agents, runComplete, panelOpen, setPanelOpen, runStartedAt, runFinishedAt };
}
