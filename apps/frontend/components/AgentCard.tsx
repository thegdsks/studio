'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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

// ─── Per-agent purpose strings ─────────────────────────────────────────────────

const AGENT_PURPOSE: Record<AgentId, string> = {
  strategist: 'Drafting positioning',
  namer:      'Generating names',
  designer:   'Designing brand visuals',
  copywriter: 'Writing launch copy',
  developer:  'Building the site',
  marketer:   'Crafting launch posts',
  growth:     'Finding prospects',
  legal:      'Drafting legal docs',
  analyst:    'Analysing competitors',
  director:   'Synthesising the launch story',
};

// ─── Dependency dep shape ──────────────────────────────────────────────────────

interface DepItem {
  name: string;
  /** emoji from AGENT_REGISTRY — kept for contract compat; we prefer Lucide icon */
  emoji: string;
  done: boolean;
}

// ─── StepTrace ─────────────────────────────────────────────────────────────────

interface StepTraceProps {
  agentId: AgentId;
  status: Agent['status'];
  hasChunks: boolean;
  dependencies?: DepItem[];
}

function StepTrace({ agentId, status, hasChunks, dependencies }: StepTraceProps) {
  const purpose = AGENT_PURPOSE[agentId];

  if (status === 'queued') {
    const pendingDeps = dependencies?.filter((d) => !d.done) ?? [];
    if (pendingDeps.length > 0) {
      return (
        <Mono className="italic text-text-faint flex flex-col gap-1.5">
          <span className="text-[11px]">Waiting for upstream:</span>
          <span className="flex flex-wrap gap-1.5 mt-0.5">
            {pendingDeps.map((dep) => {
              return (
                <span
                  key={dep.name}
                  className="inline-flex items-center gap-1 bg-surface-raised px-2 py-0.5 rounded border border-border/50 text-[10px] not-italic text-text-muted select-none font-mono uppercase tracking-[0.4px]"
                >
                  <span>{dep.name}</span>
                </span>
              );
            })}
          </span>
        </Mono>
      );
    }
    return (
      <Mono className="italic text-text-faint">
        Queued. Will be {purpose.toLowerCase()}
      </Mono>
    );
  }

  const label = hasChunks ? 'Streaming…' : 'Starting…';
  return <Mono className="italic">{label}</Mono>;
}

// ─── Elapsed formatter ─────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${s}s`;
}

// ─── AgentCard ─────────────────────────────────────────────────────────────────

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

const cardToneByStatus: Record<Agent['status'], CardTone> = {
  queued:  'resting',
  running: 'active',
  done:    'resting',
  error:   'error',
};

const DIRECTOR_ID: AgentId = 'director';
const FADE_LEN = 60;

function useRunId(): string {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/');
  const runIndex = parts.indexOf('run');
  return runIndex !== -1 ? (parts[runIndex + 1] ?? '') : '';
}

export default function AgentCard({ agent, dependencies, currentStep, onOpen }: AgentCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [flashDone, setFlashDone] = useState(false);
  const runId = useRunId();
  const prevStatusRef = useRef<Agent['status']>(agent.status);
  const hasEverStreamedRef = useRef(agent.streamedText.length > 0);
  const reducedMotion = usePrefersReducedMotion();

  if (agent.streamedText.length > 0) hasEverStreamedRef.current = true;

  // Auto-scroll streaming text
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [agent.streamedText]);

  // Ring-flash on running → done transition
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

  // Terminal caret: visible only when running and text is streaming
  const showCaret =
    !reducedMotion && agent.status === 'running' && hasEverStreamedRef.current;

  // Lucide icon for this agent
  const AgentIcon = iconFor(agent.id);

  // Duration display
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
      className={`h-agent-card ${flashDone ? 'animate-ring-flash' : ''}`}
      onClick={onOpen}
    >
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0">
          <AgentIcon className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
          <span className="text-title-md text-text truncate">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {agent.ranLocally && <ViaGemmaPill />}
          <StatusDot status={agent.status} />
        </div>
      </CardHeader>

      {/* Current step subline — one mono line, replaces on each tool-call boundary */}
      {currentStep && (
        <div className="px-4 pt-2 pb-0">
          <Mono className="text-[11px] text-text-faint truncate tabular-nums">
            {currentStep}
          </Mono>
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
        <div className="flex items-center justify-between mt-1">
          {duration && (
            <Mono className="text-[11px] tabular-nums" style={{ opacity: 0.6 }}>
              {duration}
            </Mono>
          )}
          {agent.status === 'done' && agent.id !== DIRECTOR_ID && runId && (
            <Link
              href={`/run/${runId}/agent/${agent.id}`}
              className="flex items-center gap-1 self-end font-mono text-label-sm text-text-faint hover:text-text transition-colors duration-micro ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              View details
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
