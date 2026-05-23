'use client';

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Agent, AgentEvent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { Button, Label } from '@studio/ui';
import { subscribeRun } from '@/lib/sse-client';
import AgentCard from '@/components/AgentCard';
import FinalKitModal from '@/components/FinalKitModal';

// ─── State ────────────────────────────────────────────────────────────────────

type AgentsState = Record<AgentId, Agent>;

function buildInitialAgents(): AgentsState {
  return Object.fromEntries(
    AGENT_IDS.map((id) => {
      const meta = AGENT_REGISTRY[id];
      const agent: Agent = {
        id,
        name: meta.name,
        emoji: meta.emoji,
        status: 'queued',
        streamedText: '',
        tools: [],
      };
      return [id, agent];
    }),
  ) as AgentsState;
}

type AgentsAction = { event: AgentEvent };

function agentsReducer(state: AgentsState, { event }: AgentsAction): AgentsState {
  // Run-level events don't update agent state directly
  if (event.agent_id === '__run') return state;

  const id = event.agent_id;
  const prev = state[id];
  if (!prev) return state;

  switch (event.type) {
    case 'status': {
      const now = Date.now();
      const status = event.payload.status;
      return {
        ...state,
        [id]: {
          ...prev,
          status,
          startedAt: status === 'running' && !prev.startedAt ? now : prev.startedAt,
          finishedAt:
            status === 'done' || status === 'error' ? now : prev.finishedAt,
        },
      };
    }
    case 'chunk': {
      return {
        ...state,
        [id]: {
          ...prev,
          streamedText: prev.streamedText + event.payload.text,
        },
      };
    }
    case 'result': {
      return {
        ...state,
        [id]: {
          ...prev,
          finalArtifact: event.payload.artifact,
        },
      };
    }
    case 'error': {
      return {
        ...state,
        [id]: {
          ...prev,
          status: 'error',
          error: event.payload.message,
          finishedAt: Date.now(),
        },
      };
    }
    default:
      return state;
  }
}

// ─── Elapsed timer hook ───────────────────────────────────────────────────────

function useElapsed(startedAt: number) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 100);
    return () => clearInterval(interval);
  }, [startedAt]);

  const totalSec = Math.floor(elapsed / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return mins > 0
    ? `${mins}m ${secs.toString().padStart(2, '0')}s`
    : `${secs}s`;
}

// ─── Run page ─────────────────────────────────────────────────────────────────

interface RunPageProps {
  params: { id: string };
}

export default function RunPage({ params }: RunPageProps) {
  const runId = params.id;
  const mountedAt = useRef(Date.now());

  const [agents, dispatch] = useReducer(agentsReducer, undefined, buildInitialAgents);
  const [idea, setIdea] = useState<string>('');
  const [runComplete, setRunComplete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const elapsed = useElapsed(mountedAt.current);

  const doneCount = Object.values(agents).filter(
    (a) => a.status === 'done' || a.status === 'error',
  ).length;

  const handleEvent = useCallback((event: AgentEvent) => {
    dispatch({ event });
  }, []);

  const handleComplete = useCallback(() => {
    setRunComplete(true);
  }, []);

  // Fetch run metadata (idea) — best-effort
  useEffect(() => {
    async function fetchRun() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (res.ok) {
          const data = (await res.json()) as { idea?: string };
          if (data.idea) setIdea(data.idea);
        }
      } catch {
        // Non-critical; ignore
      }
    }
    void fetchRun();
  }, [runId]);

  // Subscribe to SSE stream
  useEffect(() => {
    const controller = subscribeRun(runId, handleEvent, handleComplete);
    return () => controller.abort();
  }, [runId, handleEvent, handleComplete]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-header border-b border-border bg-surface-glass backdrop-blur-glass">
        <div className="mx-auto max-w-page px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="flex-1 min-w-0">
            {idea ? (
              <p className="text-body-sm text-text truncate">
                <Label className="mr-2">Idea</Label>
                {idea}
              </p>
            ) : (
              <p className="text-body-sm text-text-faint italic">Loading…</p>
            )}
          </div>
          <div className="flex items-center gap-5 flex-shrink-0 font-mono text-mono-sm tabular-nums">
            <span className="text-text-faint">
              <Label className="mr-1.5">elapsed</Label>
              <span className="text-text">{elapsed}</span>
            </span>
            <span className="text-text-faint">
              <Label className="mr-1.5">progress</Label>
              <span className="text-text">{doneCount}</span>
              <span className="text-text-faint"> / 9</span>
            </span>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 mx-auto w-full max-w-page px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_IDS.map((id) => {
            const agent = agents[id];
            if (!agent) return null;
            return <AgentCard key={id} agent={agent} />;
          })}
        </div>
      </main>

      {/* Floating "View full kit" CTA */}
      <AnimatePresence>
        {runComplete && (
          <motion.div
            className="fixed bottom-6 left-0 right-0 z-overlay flex justify-center pointer-events-none"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              size="lg"
              onClick={() => setModalOpen(true)}
              className="pointer-events-auto shadow-glow-iris-lg"
              trailingIcon={<ArrowRight className="h-4 w-4" />}
            >
              View full kit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final kit modal */}
      <FinalKitModal
        run={{ agents }}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
