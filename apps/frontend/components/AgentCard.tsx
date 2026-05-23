'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AGENT_REGISTRY, type Agent, type AgentId } from '@studio/shared';
import {
  Card,
  CardBody,
  CardFooter,
  Mono,
  requireProp,
  usePrefersReducedMotion,
  type CardTone,
  type CardSurface,
} from '@studio/ui';
import ArtifactRenderer from './artifacts/ArtifactRenderer';
import { AgentCardHeader } from './agent/AgentCardHeader';
import { AgentCardError, type AgentErrorDetail } from './agent/AgentCardError';
import { AgentCardFooter } from './agent/AgentCardFooter';
import { StepTrace } from './agent/StepTrace';
import RefineModal from './RefineModal';
import { refineAgent, rerunAgent } from '@/lib/agentActions';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DepItem {
  name: string;
  emoji: string;
  done: boolean;
}

export interface AgentCardProps {
  agent: Agent;
  dependencies?: DepItem[];
  currentStep?: string;
  /** 1-based grid position for bracket badge [01]-[09]. */
  index?: number;
  onOpen?: () => void;
  /** Structured error detail — overrides raw agent.error string. */
  errorDetail?: AgentErrorDetail;
  onRetry?: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const FADE_LEN = 60;

const toneByStatus: Record<Agent['status'], CardTone> = {
  queued:  'resting',
  running: 'active',
  done:    'resting',
  error:   'error',
};

const surfaceByStatus: Record<Agent['status'], CardSurface> = {
  queued:  'flat',
  running: 'lifted',
  done:    'flat',
  error:   'glass',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${(s % 60).toString().padStart(2, '0')}s` : `${s}s`;
}

function useRunId(): string {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/');
  const idx = parts.indexOf('run');
  return idx !== -1 ? (parts[idx + 1] ?? '') : '';
}

// ─── AgentCard ─────────────────────────────────────────────────────────────────

export default function AgentCard({
  agent, dependencies, currentStep, index, onOpen, errorDetail, onRetry,
}: AgentCardProps) {
  // Hard guards — fail loudly; no silent fallbacks
  requireProp(agent.id, 'agent.id');
  requireProp(agent.name, 'agent.name');
  requireProp(agent.status, 'agent.status');

  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const rawScrollRef  = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevStatusRef = useRef<Agent['status']>(agent.status);
  const hasEverStreamedRef = useRef(agent.streamedText.length > 0);

  const [flashDone, setFlashDone]   = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refining, setRefining]     = useState(false);
  const [rerunning, setRerunning]   = useState(false);
  const [retrying, setRetrying]     = useState(false);

  const runId = useRunId();
  const reducedMotion = usePrefersReducedMotion();

  if (agent.streamedText.length > 0) hasEverStreamedRef.current = true;

  const handleScroll = useCallback(() => {
    const el = bodyScrollRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
  }, []);

  useEffect(() => {
    const el = bodyScrollRef.current;
    if (el && isAtBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [agent.streamedText]);

  useEffect(() => {
    if (prevStatusRef.current !== 'done' && agent.status === 'done') {
      if (!reducedMotion) setFlashDone(true);
      const t = setTimeout(() => setFlashDone(false), 600);
      prevStatusRef.current = agent.status;
      return () => clearTimeout(t);
    }
    prevStatusRef.current = agent.status;
    return undefined;
  }, [agent.status, reducedMotion]);

  const tone: CardTone    = flashDone ? 'success' : toneByStatus[agent.status];
  const surface: CardSurface = surfaceByStatus[agent.status];
  const text = agent.streamedText;

  const { stable, fading } = useMemo(() => ({
    stable: text.length > FADE_LEN ? text.slice(0, text.length - FADE_LEN) : '',
    fading: text.length > FADE_LEN ? text.slice(text.length - FADE_LEN) : text,
  }), [text]);

  const showCaret = !reducedMotion && agent.status === 'running' && hasEverStreamedRef.current;

  const duration = agent.startedAt && agent.finishedAt
    ? formatDuration(agent.finishedAt - agent.startedAt) : null;

  const resolvedError: AgentErrorDetail | null = errorDetail ??
    (agent.status === 'error' && agent.error
      ? { code: 'AGENT_ERROR', message: agent.error, retryable: !!onRetry }
      : null);

  async function handleRefineSubmit(feedback: string) {
    setRefining(true);
    try { await refineAgent(runId, agent.id, feedback); setRefineOpen(false); }
    finally { setRefining(false); }
  }

  async function handleRerun() {
    setRerunning(true);
    try { await rerunAgent(runId, agent.id); }
    finally { setTimeout(() => setRerunning(false), 1200); }
  }

  function handleRetry() {
    if (!onRetry) return;
    setRetrying(true);
    onRetry();
    setTimeout(() => setRetrying(false), 1200);
  }

  return (
    <>
      <Card
        as={onOpen ? 'button' : 'div'}
        tone={tone}
        surface={surface}
        lift={agent.status === 'running' && !reducedMotion}
        hover
        interactive={!!onOpen}
        className={`h-agent-card w-full text-left${flashDone ? ' animate-ring-flash' : ''}`}
        onClick={onOpen}
        {...(onOpen ? ({ type: 'button' } as Record<string, string>) : {})}
      >
        <AgentCardHeader agent={agent} index={index ?? 1} interactive={!!onOpen} />

        {currentStep && (
          <div className="px-4 pt-1.5">
            <Mono className="text-micro text-text-faint truncate">{currentStep}</Mono>
          </div>
        )}

        <CardBody ref={bodyScrollRef} onScroll={handleScroll} className="relative overflow-y-auto">
          {/* Fade masks — inline style allowed: runtime CSS var references */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-4 z-10"
            style={{ background: 'linear-gradient(to bottom, var(--color-surface-raised), transparent)' }}
            aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 z-10"
            style={{ background: 'linear-gradient(to top, var(--color-surface-raised), transparent)' }}
            aria-hidden />

          {resolvedError && (
            <AgentCardError
              error={resolvedError}
              onRetry={resolvedError.retryable ? handleRetry : undefined}
              retrying={retrying}
            />
          )}

          {!resolvedError && agent.status === 'queued' && (
            <StepTrace agentId={agent.id} status={agent.status} hasChunks={hasEverStreamedRef.current} dependencies={dependencies} />
          )}

          {!resolvedError && agent.status === 'running' && agent.finalArtifact === undefined && (
            !hasEverStreamedRef.current
              ? <StepTrace agentId={agent.id} status={agent.status} hasChunks={false} dependencies={dependencies} />
              : (
                <div className="font-mono text-mono-sm text-text-muted whitespace-pre-wrap break-all">
                  <span>{stable}</span>
                  <span>{fading}</span>
                  {showCaret && <span className="animate-blink-caret" aria-hidden>&#x258C;</span>}
                </div>
              )
          )}

          {agent.finalArtifact !== undefined && (
            <ArtifactRenderer agentId={agent.id} artifact={agent.finalArtifact} />
          )}
        </CardBody>

        <CardFooter className="flex flex-col gap-2">
          <AgentCardFooter
            agent={agent}
            text={text}
            stable={stable}
            fading={fading}
            rawScrollRef={rawScrollRef}
            duration={duration}
            refining={refining}
            rerunning={rerunning}
            onRefineOpen={() => setRefineOpen(true)}
            onRerun={handleRerun}
            runId={runId}
          />
        </CardFooter>
      </Card>

      <RefineModal
        open={refineOpen}
        onClose={() => !refining && setRefineOpen(false)}
        agentName={agent.name}
        currentScore={agent.quality_score}
        currentCritique={agent.quality_critique}
        onSubmit={handleRefineSubmit}
      />
    </>
  );
}
