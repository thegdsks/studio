'use client';

import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { StatusDot, cn } from '@studio/ui';

interface AgentRailProps {
  agents: Record<AgentId, Agent>;
}

export function AgentRail({ agents }: AgentRailProps) {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-surface flex flex-col py-4 gap-0.5 overflow-y-auto">
      <p
        className="px-4 pb-2 font-mono text-label-sm tracking-widest uppercase text-text-faint"
        style={{ letterSpacing: '0.1em' }}
      >
        Agents
      </p>
      {AGENT_IDS.map((id) => {
        const agent = agents[id];
        if (!agent) return null;
        const meta = AGENT_REGISTRY[id];
        return (
          <RailRow key={id} name={meta.name} status={agent.status} />
        );
      })}
    </aside>
  );
}

interface RailRowProps {
  name: string;
  status: Agent['status'];
}

function RailRow({ name, status }: RailRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-2 rounded-sm mx-2',
        'transition-colors duration-75',
        status === 'running' && 'bg-surface-raised',
      )}
    >
      <StatusDot status={status} />
      <span className="text-body-sm text-text truncate">{name}</span>
    </div>
  );
}
