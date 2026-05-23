'use client';

import type { Agent, AgentId } from '@studio/shared';
import { Mono } from '@studio/ui';

interface DepItem {
  name: string;
  emoji: string;
  done: boolean;
}

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

interface StepTraceProps {
  agentId: AgentId;
  status: Agent['status'];
  hasChunks: boolean;
  dependencies?: DepItem[];
}

export function StepTrace({ agentId, status, hasChunks, dependencies }: StepTraceProps) {
  const purpose = AGENT_PURPOSE[agentId];

  if (status === 'queued') {
    const pendingDeps = dependencies?.filter((d) => !d.done) ?? [];
    if (pendingDeps.length > 0) {
      return (
        <Mono className="italic text-text-faint flex flex-col gap-1.5">
          <span className="text-[11px]">Waiting for upstream:</span>
          <span className="flex flex-wrap gap-1.5 mt-0.5">
            {pendingDeps.map((dep) => (
              <span
                key={dep.name}
                className="inline-flex items-center gap-1 bg-surface-raised px-2 py-0.5 rounded border border-border/50 text-[10px] not-italic text-text-muted select-none font-mono uppercase tracking-[0.4px]"
              >
                {dep.name}
              </span>
            ))}
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
