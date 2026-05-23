'use client';

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { ArrowRight, Copy, Check, ChevronDown, ChevronUp, ShieldCheck, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, AgentEvent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { Button, Card, CardBody, CardHeader, Chip, Label, Mono } from '@studio/ui';
import { subscribeRun } from '@/lib/sse-client';
import AgentCard from '@/components/AgentCard';
import FinalKitModal from '@/components/FinalKitModal';

// ─── Dependencies Map ──────────────────────────────────────────────────────────

const AGENT_DEPENDENCIES: Record<AgentId, AgentId[]> = {
  strategist: [],
  namer: [],
  analyst: [],
  legal: ['namer'],
  copywriter: ['strategist'],
  designer: ['namer'],
  developer: ['designer', 'copywriter'],
  marketer: ['strategist', 'copywriter'],
  growth: ['strategist'],
  director: ['strategist', 'namer', 'analyst', 'legal', 'copywriter', 'designer', 'developer', 'marketer', 'growth']
};

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

type AgentsAction =
  | { event: AgentEvent }
  | { hydrate: AgentsState };

function agentsReducer(state: AgentsState, action: AgentsAction): AgentsState {
  // Snapshot hydration: replace state with backend-authoritative version
  if ('hydrate' in action) {
    // Merge: keep frontend's queued shells for any agent missing from backend
    return { ...state, ...action.hydrate };
  }

  const { event } = action;
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
    case 'meta': {
      return {
        ...state,
        [id]: {
          ...prev,
          ranLocally: event.payload.ranLocally ?? prev.ranLocally,
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

// ─── PrivacyHeaderBadge ──────────────────────────────────────────────────────

const PRIVACY_AGENT_IDS: AgentId[] = ['strategist', 'legal'];

function PrivacyHeaderBadge({ agents }: { agents: AgentsState }) {
  const localCount = PRIVACY_AGENT_IDS.filter((id) => agents[id]?.ranLocally).length;
  return (
    <div className="flex items-center justify-center gap-3 rounded-md border border-border-accent bg-accent-soft px-4 py-2">
      <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
      <span className="text-body-sm text-text">
        <Label className="text-accent mr-2">Privacy mode</Label>
        Strategist + Legal run locally on Gemma&nbsp;4
        {localCount > 0 && (
          <span className="text-text-faint">
            {' '}
            · <span className="font-mono text-mono-sm text-text">{localCount}/{PRIVACY_AGENT_IDS.length}</span> on device
          </span>
        )}
      </span>
    </div>
  );
}

// ─── RunIdBreadcrumb ──────────────────────────────────────────────────────────

function RunIdBreadcrumb({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(runId).then(() => {
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(timer);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 font-mono text-mono-sm tabular-nums text-text-faint hover:text-text-muted transition-colors duration-micro"
      aria-label="Copy run ID"
    >
      {copied ? (
        <Check className="h-3 w-3 text-status-done" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <Label className="normal-case tracking-normal">{copied ? 'copied' : 'run'}</Label>
      <span className="text-text-muted">{runId.slice(0, 8)}</span>
    </button>
  );
}

// ─── Elapsed timer hook ───────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return mins > 0
    ? `${mins}m ${secs.toString().padStart(2, '0')}s`
    : `${secs}s`;
}

function useElapsed(startedAt: number) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 100);
    return () => clearInterval(interval);
  }, [startedAt]);

  return formatElapsed(elapsed);
}

// ─── Director Panel ───────────────────────────────────────────────────────────

interface Inconsistency {
  severity: 'low' | 'medium' | 'high';
  issue: string;
  resolution: string;
}

interface DirectorArtifact {
  one_line_pitch: string;
  coherence_score: number;
  hot_take: string;
  unified_narrative: string;
  next_7_days: string[];
  inconsistencies: Inconsistency[];
  confidence_by_agent: Record<string, number>;
}

function DirectorPanel({ agent }: { agent: Agent }) {
  const [inconsistenciesExpanded, setInconsistenciesExpanded] = useState(false);

  // Parse structured artifact from finalArtifact or try to parse streamedText
  let data: DirectorArtifact | null = null;
  if (agent.finalArtifact) {
    data = agent.finalArtifact as DirectorArtifact;
  } else if (agent.streamedText) {
    try {
      const jsonMatch = agent.streamedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]) as DirectorArtifact;
      }
    } catch {
      // not yet fully streamed or invalid JSON
    }
  }

  // Auto-expand inconsistencies if any 'high' severity exists
  useEffect(() => {
    if (data?.inconsistencies?.some((inc) => inc.severity === 'high')) {
      setInconsistenciesExpanded(true);
    }
  }, [data]);

  if (agent.status === 'queued') {
    return null;
  }

  if (agent.status === 'running' && !data) {
    return (
      <Card tone="active" className="w-full">
        <CardBody className="p-6 md:p-8 flex flex-col gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <Label className="text-headline-sm font-display text-text">Director</Label>
            <span className="text-body-sm text-text-muted">Synthesizing launch kit...</span>
          </div>
          <div className="h-4 bg-surface-sunken rounded w-3/4 mt-2"></div>
          <div className="h-4 bg-surface-sunken rounded w-1/2"></div>
        </CardBody>
      </Card>
    );
  }

  if (agent.status === 'error' && !data) {
    return (
      <Card tone="error" className="w-full">
        <CardBody className="p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl text-error">🎬</span>
            <Label className="text-headline-sm font-display text-error">Director Error</Label>
          </div>
          <p className="text-body-sm text-error">{agent.error || 'Failed to synthesize.'}</p>
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card tone="active" className="w-full">
      <CardBody className="p-6 md:p-8 flex flex-col gap-6">
        {/* Header & Hero */}
        <div className="relative border-b border-border pb-6 flex flex-col md:flex-row gap-6 justify-between items-start w-full">
          <div className="flex-1 pr-4">
            <Label>🎬 Director · executive summary</Label>
            <blockquote className="mt-3 text-headline-lg font-display text-text leading-tight max-w-prose">
              “{data.one_line_pitch}”
            </blockquote>
          </div>

          {/* Coherence Score */}
          <div className="flex flex-col items-center justify-center bg-surface-sunken rounded-lg p-4 border border-border min-w-[100px] aspect-square select-none md:self-center">
            <span className="text-display-md font-mono text-accent">
              {data.coherence_score}
            </span>
            <Label className="mt-1">Coherence</Label>
          </div>
        </div>

        {/* Hot Take Callout */}
        <div className="rounded-lg border border-border-accent bg-surface-raised p-4 md:p-5 flex flex-col gap-1.5 shadow-glow-accent">
          <Label className="text-accent">🔥 Director’s hot take</Label>
          <p className="text-body-md italic text-text leading-relaxed">
            {data.hot_take}
          </p>
        </div>

        {/* Unified Narrative */}
        <div className="flex flex-col gap-2">
          <Label>Strategic roadmap</Label>
          <div className="text-body-md text-text-muted leading-relaxed space-y-4 whitespace-pre-line">
            {data.unified_narrative}
          </div>
        </div>

        {/* Next 7 Days Timeline */}
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <Label>Execution plan · next 7 days</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-1">
            {data.next_7_days.map((item, idx) => {
              const parts = item.split(/:\s*(.*)/);
              const title = parts[0] || `Day ${idx + 1}`;
              const desc = parts[1] || item;
              return (
                <div key={idx} className="bg-surface-sunken border border-border rounded-md p-3 flex flex-col gap-1">
                  <Label className="truncate">{title}</Label>
                  <p className="text-body-sm text-text-muted leading-snug">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inconsistencies */}
        {data.inconsistencies && data.inconsistencies.length > 0 && (
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setInconsistenciesExpanded(!inconsistenciesExpanded)}
              className="w-full flex items-center justify-between py-2 text-text hover:text-text-muted transition-colors duration-micro text-left"
            >
              <div className="flex items-center gap-2">
                <Label>🔍 Misalignments &amp; remediation</Label>
                <Chip>{data.inconsistencies.length} found</Chip>
              </div>
              {inconsistenciesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <AnimatePresence initial={false}>
              {inconsistenciesExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex flex-col gap-3">
                    {data.inconsistencies.map((inc, idx) => {
                      const tone: 'error' | 'accent' | 'neutral' =
                        inc.severity === 'high' ? 'error'
                        : inc.severity === 'medium' ? 'accent'
                        : 'neutral';
                      return (
                        <div key={idx} className="bg-surface-sunken border border-border rounded-md p-4 flex flex-col sm:flex-row gap-3 items-start">
                          <Chip tone={tone}>{inc.severity}</Chip>
                          <div className="flex-1 flex flex-col gap-1">
                            <p className="text-body-md text-text leading-tight">{inc.issue}</p>
                            <p className="text-body-sm text-text-muted leading-relaxed mt-1">
                              <span className="text-text">Fix: </span>{inc.resolution}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Confidence by Agent Grid */}
        {data.confidence_by_agent && (
          <div className="border-t border-border pt-6 flex flex-col gap-3">
            <Label>Specialist confidence</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {Object.entries(data.confidence_by_agent).map(([id, confidence]) => {
                const meta = AGENT_REGISTRY[id as AgentId] ?? { name: id, emoji: '·' };
                return (
                  <div key={id} className="bg-surface-sunken border border-border rounded-md p-2 flex flex-col items-center justify-center text-center">
                    <span className="text-sm" title={meta.name}>{meta.emoji}</span>
                    <span className="text-body-sm text-text-muted truncate max-w-full mt-1">{meta.name}</span>
                    <span className="text-mono-md font-mono text-text mt-1">{confidence}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
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
  const [privacyMode, setPrivacyMode] = useState(false);
  const [runComplete, setRunComplete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number>(mountedAt.current);
  const [runFinishedAt, setRunFinishedAt] = useState<number | undefined>(undefined);

  // Elapsed: live ticks from run.startedAt while running; freezes at finishedAt when done
  const elapsedFrom = useElapsed(runStartedAt);
  const elapsed = runFinishedAt
    ? formatElapsed(runFinishedAt - runStartedAt)
    : elapsedFrom;

  const doneCount = Object.values(agents).filter(
    (a) => a.id !== 'director' && (a.status === 'done' || a.status === 'error'),
  ).length;

  const handleEvent = useCallback((event: AgentEvent) => {
    dispatch({ event });
  }, []);

  const handleComplete = useCallback(() => {
    setRunComplete(true);
  }, []);

  // Hydrate from snapshot on mount, and re-hydrate every 5s as a safety net
  // for cases where SSE drops events or the user opens a run that's already
  // mostly done. The SSE stream still drives live updates between polls.
  useEffect(() => {
    let cancelled = false;
    async function fetchRun() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          idea?: string;
          privacy_mode?: boolean;
          startedAt?: number;
          finishedAt?: number;
          agents?: Record<string, Agent>;
        };
        if (cancelled) return;
        if (data.idea) setIdea(data.idea);
        if (data.privacy_mode) setPrivacyMode(true);
        if (typeof data.startedAt === 'number') setRunStartedAt(data.startedAt);
        if (typeof data.finishedAt === 'number') {
          setRunFinishedAt(data.finishedAt);
          setRunComplete(true);
        }
        if (data.agents) {
          dispatch({ hydrate: data.agents as AgentsState });
        }
      } catch {
        // Non-critical; SSE will fill in
      }
    }
    void fetchRun();
    const id = setInterval(() => void fetchRun(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [runId]);

  // Subscribe to SSE stream
  useEffect(() => {
    const controller = subscribeRun(runId, handleEvent, handleComplete);
    return () => controller.abort();
  }, [runId, handleEvent, handleComplete]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-header border-b border-border bg-surface">
        <div className="mx-auto max-w-page pl-20 pr-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
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
          <RunIdBreadcrumb runId={runId} />
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
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              title="Dashboard"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-text-muted hover:border-border-strong hover:text-text transition-colors duration-micro"
            >
              <LayoutDashboard className="h-3 w-3" />
              <Label>Dashboard</Label>
            </Link>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 mx-auto w-full max-w-page px-4 py-6 flex flex-col gap-6">
        {privacyMode && <PrivacyHeaderBadge agents={agents} />}

        {agents.director && agents.director.status !== 'queued' && (
          <DirectorPanel agent={agents.director} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_IDS.filter((id) => id !== 'director').map((id) => {
            const agent = agents[id];
            if (!agent) return null;

            const depIds = AGENT_DEPENDENCIES[id] || [];
            const dependencies = depIds.map((depId) => {
              const depAgent = agents[depId];
              return {
                name: AGENT_REGISTRY[depId].name,
                emoji: AGENT_REGISTRY[depId].emoji,
                done: depAgent ? depAgent.status === 'done' || depAgent.status === 'error' : false,
              };
            });

            return <AgentCard key={id} agent={agent} dependencies={dependencies} />;
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
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Button
              size="lg"
              onClick={() => setModalOpen(true)}
              className="pointer-events-auto shadow-glow-accent-lg"
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
        runId={runId}
      />
    </div>
  );
}
