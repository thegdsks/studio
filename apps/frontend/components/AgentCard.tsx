'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, RotateCcw } from 'lucide-react';
import type { Agent, AgentId } from '@studio/shared';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Mono,
  StatusDot,
  usePrefersReducedMotion,
  type CardTone,
} from '@studio/ui';
import { iconFor } from '@/lib/agentIcons';
import ArtifactRenderer from './artifacts/ArtifactRenderer';
import { ViaGemmaPill } from './agent/ViaGemmaPill';
import { RawStreamToggle } from './agent/RawStreamToggle';
import { StepTrace } from './agent/StepTrace';
import QualityBadge from './QualityBadge';
import RefineModal from './RefineModal';
import { refineAgent, rerunAgent } from '@/lib/agentActions';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DepItem {
  name: string;
  /** emoji from AGENT_REGISTRY — contract compat only; we render label instead */
  emoji: string;
  done: boolean;
}

export interface AgentCardProps {
  agent: Agent;
  /** Upstream dependency items (name + done flag). */
  dependencies?: DepItem[];
  /** Current tool or step description; replaces on each tool-call boundary. */
  currentStep?: string;
  /** Card index in the 3x3 grid — used by parent for stagger composition. */
  index?: number;
  /** Open agent detail view. */
  onOpen?: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const cardToneByStatus: Record<Agent['status'], CardTone> = {
  queued:  'resting',
  running: 'active',
  done:    'resting',
  error:   'error',
};

const DIRECTOR_ID: AgentId = 'director';
const FADE_LEN = 60;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${s}s`;
}

function useRunId(): string {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/');
  const idx = parts.indexOf('run');
  return idx !== -1 ? (parts[idx + 1] ?? '') : '';
}

// ─── AgentCard ─────────────────────────────────────────────────────────────────

export default function AgentCard({ agent, dependencies, currentStep, onOpen }: AgentCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [flashDone, setFlashDone] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refining, setRefining] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const runId = useRunId();
  const prevStatusRef = useRef<Agent['status']>(agent.status);
  const hasEverStreamedRef = useRef(agent.streamedText.length > 0);
  const reducedMotion = usePrefersReducedMotion();

  if (agent.streamedText.length > 0) hasEverStreamedRef.current = true;

  // Auto-scroll streaming body when expanded
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [agent.streamedText]);

  // Ring-flash once on running → done transition
  useEffect(() => {
    if (prevStatusRef.current !== 'done' && agent.status === 'done') {
      if (!reducedMotion) setFlashDone(true);
      const timer = setTimeout(() => setFlashDone(false), 600);
      prevStatusRef.current = agent.status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = agent.status;
    return undefined;
  }, [agent.status, reducedMotion]);

  const tone: CardTone = flashDone ? 'success' : cardToneByStatus[agent.status];

  const text = agent.streamedText;
  const { stable, fading } = useMemo(
    () => ({
      stable: text.length > FADE_LEN ? text.slice(0, text.length - FADE_LEN) : '',
      fading: text.length > FADE_LEN ? text.slice(text.length - FADE_LEN) : text,
    }),
    [text],
  );

  // Terminal caret: only when running + streaming + motion allowed
  const showCaret = !reducedMotion && agent.status === 'running' && hasEverStreamedRef.current;

  async function handleRefineSubmit(feedback: string) {
    setRefining(true);
    try {
      await refineAgent(runId, agent.id, feedback);
      setRefineOpen(false);
    } finally {
      setRefining(false);
    }
  }

  async function handleRerun() {
    setRerunning(true);
    try {
      await rerunAgent(runId, agent.id);
    } finally {
      setTimeout(() => setRerunning(false), 1200);
    }
  }

  const AgentIcon = iconFor(agent.id);

  const duration =
    agent.startedAt && agent.finishedAt
      ? formatDuration(agent.finishedAt - agent.startedAt)
      : null;

  return (
    <Card
      tone={tone}
      glow="off"
      hover
      interactive={!!onOpen}
      className={`h-agent-card${flashDone ? ' animate-ring-flash' : ''}`}
      onClick={onOpen}
    >
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0">
          <AgentIcon className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
          <span className="text-title-md text-text truncate">{agent.name}</span>
          {agent.iteration !== undefined && agent.iteration > 1 && (
            <Mono className="text-[10px] text-text-faint shrink-0">[ V{agent.iteration} ]</Mono>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {agent.status === 'done' && (
            <QualityBadge
              score={agent.quality_score}
              critique={agent.quality_critique}
            />
          )}
          {agent.ranLocally && <ViaGemmaPill />}
          <StatusDot status={agent.status} />
        </div>
      </CardHeader>

      {/* "What it is doing right now" — replaces on each tool-call boundary */}
      {currentStep && (
        <div className="px-4 pt-2">
          <Mono className="text-[11px] text-text-faint truncate">{currentStep}</Mono>
        </div>
      )}

      <CardBody className="streamfade">
        {agent.status === 'queued' && (
          <StepTrace
            agentId={agent.id}
            status={agent.status}
            hasChunks={hasEverStreamedRef.current}
            dependencies={dependencies}
          />
        )}
        {agent.status === 'running' && agent.finalArtifact === undefined && (
          <>
            {!hasEverStreamedRef.current ? (
              <StepTrace
                agentId={agent.id}
                status={agent.status}
                hasChunks={false}
                dependencies={dependencies}
              />
            ) : (
              <div className="font-mono text-mono-sm text-text-muted whitespace-pre-wrap break-all">
                <span>{stable}</span>
                <span>{fading}</span>
                {showCaret && (
                  <span className="animate-blink-caret" aria-hidden>&#x258C;</span>
                )}
              </div>
            )}
          </>
        )}
        {agent.finalArtifact !== undefined && (
          <ArtifactRenderer agentId={agent.id} artifact={agent.finalArtifact} />
        )}
        {agent.status === 'error' && agent.error && (
          <p className="text-body-sm text-status-error mt-2">{agent.error}</p>
        )}
      </CardBody>

      <CardFooter className="flex flex-col gap-2">
        {agent.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.tools.map((tool) => (
              <Chip key={tool} className="text-[10.5px] tracking-[0.4px]">{tool}</Chip>
            ))}
          </div>
        )}
        {(agent.finalArtifact !== undefined || text !== '') && (
          <RawStreamToggle text={text} stable={stable} fading={fading} scrollRef={scrollRef} />
        )}

        {/* Refine / Re-run controls */}
        {(agent.status === 'done' || agent.status === 'error') && runId && (
          <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setRefineOpen(true)}
              disabled={refining}
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] font-mono text-text-muted hover:text-text hover:border-border-strong hover:bg-surface-raised transition-colors duration-75 disabled:opacity-40"
              aria-label="Refine this agent"
            >
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
              Refine
            </button>
            <button
              type="button"
              onClick={handleRerun}
              disabled={rerunning}
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] font-mono text-text-muted hover:text-text hover:border-border-strong hover:bg-surface-raised transition-colors duration-75 disabled:opacity-40"
              aria-label="Re-run this agent"
            >
              {rerunning ? (
                <span
                  className="h-3 w-3 rounded-full border-2 border-text-faint/30 border-t-text-faint animate-spin shrink-0"
                  aria-hidden
                />
              ) : (
                <RotateCcw className="h-3 w-3 shrink-0" aria-hidden />
              )}
              Re-run
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          {duration && (
            <Mono className="text-[11px] tabular-nums text-text-faint">{duration}</Mono>
          )}
          {agent.status === 'done' && agent.id !== DIRECTOR_ID && runId && (
            <Link
              href={`/run/${runId}/agent/${agent.id}`}
              className="flex items-center gap-1 font-mono text-label-sm text-text-faint hover:text-text transition-colors duration-micro ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              View details
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardFooter>

      <RefineModal
        open={refineOpen}
        onClose={() => !refining && setRefineOpen(false)}
        agentName={agent.name}
        currentScore={agent.quality_score}
        currentCritique={agent.quality_critique}
        onSubmit={handleRefineSubmit}
      />
    </Card>
  );
}
