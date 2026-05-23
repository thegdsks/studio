'use client';

import { motion } from 'framer-motion';
import type { AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { staggerChildren, cardEnter, withReducedMotion, usePrefersReducedMotion } from '@studio/ui';
import AgentCard from '@/components/AgentCard';
import { RunTopBar } from '@/components/run/RunTopBar';
import { AgentRail } from '@/components/run/AgentRail';
import { DirectorPanel } from '@/components/run/DirectorPanel';
import { FinalKitPanel } from '@/components/run/FinalKitPanel';
import { useRunState, AGENT_DEPENDENCIES } from '@/components/run/useRunState';

const GRID_AGENT_IDS = AGENT_IDS.filter((id) => id !== 'director');

interface RunPageProps {
  params: { id: string };
}

export default function RunPage({ params }: RunPageProps) {
  const runId = params.id;
  const { agents, runComplete, panelOpen, setPanelOpen, runStartedAt, runFinishedAt } = useRunState(runId);
  const prefersReduced = usePrefersReducedMotion();

  const agentStatuses = Object.values(agents).map((a) => a.status);
  const staggerVariants = withReducedMotion(staggerChildren, prefersReduced);
  const cardVariants = withReducedMotion(cardEnter, prefersReduced);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <RunTopBar
        runHash={runId}
        startedAt={runStartedAt}
        finishedAt={runFinishedAt}
        agentStatuses={agentStatuses}
        runComplete={runComplete}
      />

      {/* Three-column shell */}
      <div className="flex flex-1 overflow-hidden">
        <AgentRail agents={agents} />

        {/* Center: 3x3 staggered grid */}
        <main className="flex-1 overflow-y-auto p-4">
          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
          >
            {GRID_AGENT_IDS.map((id) => {
              const agent = agents[id];
              if (!agent) return null;
              const depIds = AGENT_DEPENDENCIES[id] ?? ([] as AgentId[]);
              const dependencies = depIds.map((depId) => ({
                name: AGENT_REGISTRY[depId].name,
                emoji: AGENT_REGISTRY[depId].emoji,
                done: agents[depId]
                  ? agents[depId].status === 'done' || agents[depId].status === 'error'
                  : false,
              }));
              return (
                <motion.div key={id} variants={cardVariants}>
                  <AgentCard agent={agent} dependencies={dependencies} />
                </motion.div>
              );
            })}
          </motion.div>
        </main>

        {/* Right: Director panel */}
        <aside className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4">
          {agents.director && agents.director.status !== 'queued' ? (
            <DirectorPanel agent={agents.director} />
          ) : (
            <div className="flex flex-col gap-2 py-4">
              <p className="font-mono text-label-sm uppercase text-text-faint" style={{ letterSpacing: '0.1em' }}>
                Director
              </p>
              <p className="text-body-sm text-text-faint italic">Waiting for all agents...</p>
            </div>
          )}
        </aside>
      </div>

      <FinalKitPanel
        run={{ agents }}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        runId={runId}
      />
    </div>
  );
}
