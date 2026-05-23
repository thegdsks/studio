'use client';

/**
 * Shared SSE + hydration hook consumed by both the grid run page and the
 * workspace page. Returns the live agents map, run metadata, and helpers.
 *
 * Extracted from apps/frontend/components/run/useRunState.ts so the two
 * page-level routes can share the same reducer without duplicating SSE logic.
 */

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import type { Agent, AgentEvent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { subscribeRun } from '@/lib/sse-client';

// ─── Re-export deps map (used by run page) ────────────────────────────────────

export const AGENT_DEPENDENCIES: Record<AgentId, AgentId[]> = {
  strategist: [],
  namer: [],
  analyst: [],
  legal: ['namer'],
  copywriter: ['strategist'],
  designer: ['namer'],
  developer: ['designer', 'copywriter'],
  marketer: ['strategist', 'copywriter'],
  growth: ['strategist'],
  director: [
    'strategist', 'namer', 'analyst', 'legal',
    'copywriter', 'designer', 'developer', 'marketer', 'growth',
  ],
};

// ─── State + reducer ──────────────────────────────────────────────────────────

export type AgentsState = Record<AgentId, Agent>;

function buildInitialAgents(): AgentsState {
  return Object.fromEntries(
    AGENT_IDS.map((id) => {
      const meta = AGENT_REGISTRY[id];
      return [
        id,
        {
          id,
          name: meta.name,
          emoji: meta.emoji,
          status: 'queued',
          streamedText: '',
          tools: [],
        } satisfies Agent,
      ];
    }),
  ) as unknown as AgentsState;
}

type AgentsAction = { event: AgentEvent } | { hydrate: AgentsState };

function agentsReducer(state: AgentsState, action: AgentsAction): AgentsState {
  if ('hydrate' in action) return { ...state, ...action.hydrate };
  const { event } = action;
  if (event.agent_id === '__run') return state;
  const id = event.agent_id;
  const prev = state[id];
  if (!prev) return state;
  switch (event.type) {
    case 'status': {
      const now = Date.now();
      const { status } = event.payload;
      return {
        ...state,
        [id]: {
          ...prev,
          status,
          startedAt:
            status === 'running' && !prev.startedAt ? now : prev.startedAt,
          finishedAt:
            status === 'done' || status === 'error' ? now : prev.finishedAt,
        },
      };
    }
    case 'chunk':
      return { ...state, [id]: { ...prev, streamedText: prev.streamedText + event.payload.text } };
    case 'result':
      return { ...state, [id]: { ...prev, finalArtifact: event.payload.artifact } };
    case 'meta':
      return {
        ...state,
        [id]: {
          ...prev,
          ranLocally: event.payload.ranLocally ?? prev.ranLocally,
          quality_score: event.payload.quality_score ?? prev.quality_score,
          quality_critique: event.payload.quality_critique ?? prev.quality_critique,
        },
      };
    case 'error':
      return {
        ...state,
        [id]: {
          ...prev,
          status: 'error',
          error: event.payload.message,
          finishedAt: Date.now(),
        },
      };
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface RunStreamState {
  agents: AgentsState;
  idea: string;
  runComplete: boolean;
  privacyMode: boolean;
  error: string | null;
  runStartedAt: number;
  runFinishedAt: number | undefined;
}

export function useRunStream(runId: string): RunStreamState {
  const mountedAt = useRef(Date.now());
  const [agents, dispatch] = useReducer(agentsReducer, undefined, buildInitialAgents);
  const [runComplete, setRunComplete] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number>(mountedAt.current);
  const [runFinishedAt, setRunFinishedAt] = useState<number | undefined>(undefined);
  const [idea, setIdea] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: AgentEvent) => { dispatch({ event }); }, []);
  const handleComplete = useCallback(() => { setRunComplete(true); }, []);

  // Snapshot hydration + polling
  useEffect(() => {
    let cancelled = false;
    async function fetchRun() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (!res.ok) { setError(`HTTP ${res.status}`); return; }
        const data = (await res.json()) as {
          startedAt?: number;
          finishedAt?: number;
          agents?: Record<string, Agent>;
          idea?: string;
          privacy_mode?: boolean;
        };
        if (cancelled) return;
        if (typeof data.startedAt === 'number') setRunStartedAt(data.startedAt);
        if (typeof data.finishedAt === 'number') {
          setRunFinishedAt(data.finishedAt);
          setRunComplete(true);
        }
        if (typeof data.idea === 'string') setIdea(data.idea);
        if (typeof data.privacy_mode === 'boolean') setPrivacyMode(data.privacy_mode);
        if (data.agents) dispatch({ hydrate: data.agents as AgentsState });
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Fetch failed');
      }
    }
    void fetchRun();
    const id = setInterval(() => void fetchRun(), 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [runId]);

  // SSE subscription
  useEffect(() => {
    const controller = subscribeRun(runId, handleEvent, handleComplete);
    return () => controller.abort();
  }, [runId, handleEvent, handleComplete]);

  return { agents, idea, runComplete, privacyMode, error, runStartedAt, runFinishedAt };
}
