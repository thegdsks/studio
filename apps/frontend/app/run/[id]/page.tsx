'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy } from 'lucide-react';
import Link from 'next/link';
import type { AgentId } from '@studio/shared';
import { AGENT_IDS } from '@studio/shared';
import {
  StatusBar,
  PageHeader,
  Button,
  ErrorBoundary,
  staggerChildren,
  cardEnter,
  withReducedMotion,
  usePrefersReducedMotion,
} from '@studio/ui';
import { RunTopBarComposed } from '@/components/run/RunTopBarComposed';
import { AgentRail } from '@/components/run/AgentRail';
import { DirectorPanel } from '@/components/run/DirectorPanel';
import { FinalKitPanel } from '@/components/run/FinalKitPanel';
import { DagCanvas } from '@/components/run/DagCanvas';
import { useRunState } from '@/components/run/useRunState';
import AgentCard from '@/components/AgentCard';
import { AGENT_DEPENDENCIES } from '@/lib/useRunStream';

// ─── 9-segment progress stepper ──────────────────────────────────────────────

type StepStatus = 'done' | 'running' | 'error' | 'idle';

interface AgentStepperProps {
  statuses: StepStatus[];
}

function AgentStepper({ statuses }: AgentStepperProps) {
  return (
    <div className="flex items-center gap-1" aria-label="Agent progress">
      {statuses.map((status, i) => (
        <div
          key={i}
          className={
            status === 'done'
              ? 'h-1.5 w-5 rounded-full bg-status-done'
              : status === 'running'
              ? 'h-1.5 w-5 rounded-full bg-accent animate-pulse'
              : status === 'error'
              ? 'h-1.5 w-5 rounded-full bg-status-error'
              : 'h-1.5 w-5 rounded-full bg-border'
          }
          aria-label={`Agent ${i + 1}: ${status}`}
        />
      ))}
    </div>
  );
}

// ─── Copy run link button ─────────────────────────────────────────────────────

function CopyRunLink({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/run/${runId}`
        : `/run/${runId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button
      variant="ghost"
      size="md"
      iconLeft={<Copy className="h-4 w-4" />}
      onClick={handleCopy}
    >
      {copied ? 'Copied' : 'Copy run link'}
    </Button>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface RunPageProps {
  params: { id: string };
}

export default function RunPage({ params }: RunPageProps) {
  const runId = params.id;
  const {
    agents,
    runComplete,
    panelOpen,
    setPanelOpen,
    runStartedAt,
    runFinishedAt,
  } = useRunState(runId);

  const prefersReduced = usePrefersReducedMotion();

  const displayIds = AGENT_IDS.filter((id) => id !== 'director');
  const agentStatuses = Object.values(agents).map((a) => a.status);

  const doneCount = displayIds.filter((id) => agents[id]?.status === 'done').length;
  const totalCount = displayIds.length;
  const progress = totalCount > 0 ? doneCount / totalCount : 0;

  const stepperStatuses: StepStatus[] = displayIds.map((id) => {
    const s = agents[id]?.status;
    if (s === 'done') return 'done';
    if (s === 'running') return 'running';
    if (s === 'error') return 'error';
    return 'idle';
  });

  // Start time formatted for subtitle
  const startedTime = runStartedAt
    ? new Date(runStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const staggerVariants = withReducedMotion(staggerChildren, prefersReduced);
  const cardVariants = withReducedMotion(cardEnter, prefersReduced);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top bar */}
      <RunTopBarComposed
        runHash={runId}
        startedAt={runStartedAt}
        finishedAt={runFinishedAt}
        agentStatuses={agentStatuses}
        runComplete={runComplete}
        doneCount={doneCount}
        totalCount={totalCount}
      />

      {/* Three-column shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: agent rail */}
        <AgentRail agents={agents} />

        {/* Center: grid + header */}
        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <PageHeader
            eyebrow="[RUN]"
            title={runId.slice(0, 20)}
            subtitle={startedTime ? `Started ${startedTime} · Owner you` : 'Starting...'}
            actions={<CopyRunLink runId={runId} />}
          />

          {/* 3x3 agent grid with stagger entry */}
          <ErrorBoundary label="grid">
            <motion.div
              className="grid grid-cols-3 gap-4"
              variants={staggerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayIds.map((id, i) => {
                const agent = agents[id];
                if (!agent) return null;
                const deps = AGENT_DEPENDENCIES[id]?.map((depId: AgentId) => ({
                  name: agents[depId]?.name ?? depId,
                  emoji: agents[depId]?.emoji ?? '',
                  done: agents[depId]?.status === 'done',
                }));

                return (
                  <motion.div key={id} variants={cardVariants}>
                    <AgentCard
                      agent={agent}
                      dependencies={deps}
                      index={i + 1}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </ErrorBoundary>
        </main>

        {/* Right: Director panel */}
        <aside className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4">
          {agents.director && agents.director.status !== 'queued' ? (
            <DirectorPanel agent={agents.director} />
          ) : (
            <div className="flex flex-col gap-2 py-4">
              <p className="font-mono text-label-xs tracking-[0.08em] uppercase text-text-faint">
                Director
              </p>
              <p className="text-body-sm text-text-faint italic">Waiting for all agents...</p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom status bar */}
      <StatusBar
        progress={progress}
        left={
          <span className="font-mono text-mono-sm tabular-nums text-text-muted">
            {doneCount} of {totalCount} agents done
          </span>
        }
        center={<AgentStepper statuses={stepperStatuses} />}
        right={
          runComplete ? (
            <Button
              size="md"
              variant="secondary"
              iconRight={<ArrowRight className="h-4 w-4" />}
              onClick={() => setPanelOpen(true)}
            >
              Open full kit
            </Button>
          ) : (
            <Button
              size="md"
              variant="secondary"
              iconRight={<ArrowRight className="h-4 w-4" />}
              disabled
            >
              Open full kit
            </Button>
          )
        }
      />

      {/* Final kit slide-up panel */}
      <FinalKitPanel
        run={{ agents }}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        runId={runId}
      />
    </div>
  );
}
