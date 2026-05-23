'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AGENT_IDS } from '@studio/shared';
import type { AgentId } from '@studio/shared';
import { useRunStream } from '@/lib/useRunStream';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceRail } from './WorkspaceRail';
import { AgentMessage } from './AgentMessage';
import { RefineBar } from './RefineBar';

interface WorkspacePageProps {
  params: { id: string };
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const runId = params.id;
  const { agents, idea, runComplete, error } = useRunStream(runId);
  const [pinnedIds, setPinnedIds] = useState<Set<AgentId>>(new Set());
  const [activeId, setActiveId] = useState<AgentId | null>(null);
  const messageRefs = useRef<Partial<Record<AgentId, React.RefObject<HTMLDivElement | null>>>>({});

  const agentStatuses = Object.values(agents).map((a) => a.status);

  // Ensure each agent has a stable ref
  for (const id of AGENT_IDS) {
    if (!messageRefs.current[id]) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      messageRefs.current[id] = { current: null };
    }
  }

  const handleRailSelect = useCallback((id: string) => {
    const agentId = id as AgentId;
    setActiveId(agentId);
    const ref = messageRefs.current[agentId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handlePin = useCallback((id: AgentId) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Pinned messages float to top, rest in canonical order
  const orderedIds = [
    ...AGENT_IDS.filter((id) => pinnedIds.has(id)),
    ...AGENT_IDS.filter((id) => !pinnedIds.has(id)),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <WorkspaceHeader
        runId={runId}
        agentStatuses={agentStatuses}
        runComplete={runComplete}
      />

      <div className="flex flex-1 overflow-hidden">
        <WorkspaceRail
          agents={agents}
          activeId={activeId}
          onSelect={handleRailSelect}
        />

        {/* Centre conversation feed */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-prose py-6 px-4 flex flex-col gap-4">
            {/* User bubble — original idea */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="self-end max-w-[80%] bg-accent text-text-on-accent rounded-sm px-4 py-2.5 font-mono text-mono-sm"
            >
              {idea || <span className="opacity-50 italic">Loading idea…</span>}
            </motion.div>

            {error && (
              <p className="font-mono text-body-sm text-status-error">[workspace] {error}</p>
            )}

            {/* Agent messages */}
            {orderedIds.map((id) => {
              const agent = agents[id];
              if (!agent) return null;
              return (
                <AgentMessage
                  key={id}
                  agent={agent}
                  runId={runId}
                  pinned={pinnedIds.has(id)}
                  onPin={() => handlePin(id)}
                  messageRef={messageRefs.current[id]}
                />
              );
            })}
          </div>
        </main>
      </div>

      {/* Global refine bar */}
      <RefineBar runId={runId} />
    </div>
  );
}
