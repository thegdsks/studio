'use client';

import { ChevronRight } from 'lucide-react';
import type { Agent } from '@studio/shared';
import { AGENT_REGISTRY } from '@studio/shared';
import { StatusDot, Mono } from '@studio/ui';
import { iconFor } from '@/lib/agentIcons';
import QualityBadge from '../QualityBadge';
import { ViaGemmaPill } from './ViaGemmaPill';

interface AgentCardHeaderProps {
  agent: Agent;
  index: number;
  /** When true the whole card is clickable; show chevron affordance hint */
  interactive: boolean;
}

/** Zero-padded bracket badge: 1 → "[01]" */
function bracketIndex(n: number): string {
  return `[${String(n).padStart(2, '0')}]`;
}

interface RefinedChipProps {
  originalScore: number;
  refinedScore: number;
}

/** Subtle chip shown when the orchestrator auto-improved the agent output. */
function RefinedChip({ originalScore, refinedScore }: RefinedChipProps) {
  return (
    <span
      className="inline-flex items-center h-5 font-mono text-[11px] text-text-faint border border-border rounded px-1 bg-surface-raised"
      title={`Auto-improved from ${originalScore} to ${refinedScore}`}
    >
      [ refined ]
    </span>
  );
}

export function AgentCardHeader({ agent, index, interactive }: AgentCardHeaderProps) {
  const AgentIcon = iconFor(agent.id);
  const meta = AGENT_REGISTRY[agent.id];

  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 border-b border-white/[0.04]">
      {/* Left: badge + icon + name stack */}
      <div className="flex items-start gap-2 min-w-0">
        <Mono className="text-micro text-text-faint shrink-0 tabular-nums select-none mt-0.5">
          {bracketIndex(index)}
        </Mono>
        <AgentIcon className="h-3.5 w-3.5 shrink-0 text-text-muted mt-0.5" aria-hidden />
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-title-md font-semibold text-text truncate leading-tight">
            {agent.name}
          </span>
          <Mono className="text-micro text-text-faint truncate">
            {meta.description}
          </Mono>
          {agent.iteration !== undefined && agent.iteration > 1 && (
            <Mono className="text-micro text-text-faint shrink-0">
              V{agent.iteration}
            </Mono>
          )}
        </div>
      </div>

      {/* Right: badges + status dot + interactive hint */}
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {agent.status === 'done' && (
          <QualityBadge
            score={agent.quality_score}
            critique={agent.quality_critique}
          />
        )}
        {agent.status === 'done' && agent.auto_refined === true && agent.original_score !== undefined && agent.quality_score !== undefined && (
          <RefinedChip
            originalScore={agent.original_score}
            refinedScore={agent.quality_score}
          />
        )}
        {agent.ranLocally && <ViaGemmaPill />}
        <StatusDot status={agent.status} />
        {interactive && (
          <ChevronRight
            className="h-3.5 w-3.5 text-text-faint transition-transform duration-micro group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
