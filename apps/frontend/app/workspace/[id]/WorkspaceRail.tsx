'use client';

import { motion } from 'framer-motion';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { StatusDot, Mono } from '@studio/ui';
import type { AgentsState } from '@/lib/useRunStream';

interface WorkspaceRailProps {
  agents: AgentsState;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function WorkspaceRail({ agents, activeId, onSelect }: WorkspaceRailProps) {
  return (
    <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col border-r border-border bg-surface overflow-y-auto py-3">
      <p
        className="px-4 pb-2 font-mono text-label-sm text-text-faint uppercase"
        style={{ letterSpacing: '0.1em' }}
      >
        Agents
      </p>
      <ul>
        {AGENT_IDS.map((id) => {
          const agent = agents[id];
          const meta = AGENT_REGISTRY[id];
          if (!agent) return null;
          const isActive = id === activeId;
          const showIteration = (agent.iteration ?? 1) > 1;
          return (
            <li key={id}>
              <motion.button
                type="button"
                onClick={() => onSelect(id)}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.1 }}
                className={[
                  'w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors',
                  isActive
                    ? 'border-l-2 border-accent bg-accent-soft text-text'
                    : 'border-l-2 border-transparent text-text-muted hover:text-text hover:bg-surface-raised',
                ].join(' ')}
              >
                <StatusDot status={agent.status} />
                <span className="text-body-sm flex-1 truncate">{meta.name}</span>
                {showIteration && (
                  <Mono className="text-[10px] text-text-faint shrink-0">
                    v{agent.iteration}
                  </Mono>
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
