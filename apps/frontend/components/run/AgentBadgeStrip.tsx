'use client';

import { CheckCheck } from 'lucide-react';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { cn } from '@studio/ui';

interface AgentBadgeStripProps {
  agents: Record<AgentId, Agent>;
}

/**
 * The "9→1 convergence" badge strip shown when the run completes.
 * 9 compact squares with bracket badge + check icon.
 */
export function AgentBadgeStrip({ agents }: AgentBadgeStripProps) {
  const displayIds = AGENT_IDS.filter((id) => id !== 'director');

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {displayIds.map((id) => {
        const agent = agents[id];
        const meta = AGENT_REGISTRY[id];
        const isError = agent?.status === 'error';

        return (
          <div
            key={id}
            title={meta.name}
            className={cn(
              'flex flex-col items-center justify-center gap-1',
              'w-8 h-8 rounded-sm border',
              'font-mono text-label-xs tabular-nums tracking-wide',
              isError
                ? 'border-status-error/40 bg-status-error/10 text-status-error'
                : 'border-status-done/40 bg-status-done/10 text-status-done',
            )}
            aria-label={meta.name}
          >
            <CheckCheck
              className={cn(
                'h-3 w-3',
                isError ? 'text-status-error' : 'text-status-done',
              )}
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
}
