'use client';

import type { ReactNode } from 'react';
import {
  Target, CreditCard, Palette, PenLine, Code2, Megaphone,
  Sprout, Scale, BarChart2, Clapperboard, Grid2X2, Clock,
} from 'lucide-react';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { Label, cn } from '@studio/ui';

// ─── Per-agent Lucide icon map ────────────────────────────────────────────────

const AGENT_ICONS: Record<AgentId, ReactNode> = {
  strategist: <Target size={16} aria-hidden />,
  namer:      <CreditCard size={16} aria-hidden />,
  designer:   <Palette size={16} aria-hidden />,
  copywriter: <PenLine size={16} aria-hidden />,
  developer:  <Code2 size={16} aria-hidden />,
  marketer:   <Megaphone size={16} aria-hidden />,
  growth:     <Sprout size={16} aria-hidden />,
  legal:      <Scale size={16} aria-hidden />,
  analyst:    <BarChart2 size={16} aria-hidden />,
  director:   <Clapperboard size={16} aria-hidden />,
};

// ─── Status dot badge ─────────────────────────────────────────────────────────

const STATUS_DOT_CLASS: Record<Agent['status'], string> = {
  queued:  'bg-text-faint',
  running: 'bg-accent animate-pulse-dot',
  done:    'bg-status-done',
  error:   'bg-status-error',
};

function statusDot(status: Agent['status']): string {
  return cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT_CLASS[status]);
}

// ─── View toggle ─────────────────────────────────────────────────────────────

type View = 'grid' | 'timeline';

interface ViewToggleProps {
  view: View;
  onViewChange: (v: View) => void;
}

function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1">
      <Label className="font-mono text-label-xs tracking-[0.08em] uppercase text-text-faint mr-2">
        [VIEW]
      </Label>
      <button
        type="button"
        aria-pressed={view === 'grid'}
        onClick={() => onViewChange('grid')}
        className={cn(
          'inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors',
          view === 'grid'
            ? 'bg-accent-soft text-accent'
            : 'text-text-faint hover:text-text hover:bg-surface-raised',
        )}
        aria-label="Grid view"
      >
        <Grid2X2 size={14} aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={view === 'timeline'}
        onClick={() => onViewChange('timeline')}
        className={cn(
          'inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors',
          view === 'timeline'
            ? 'bg-accent-soft text-accent'
            : 'text-text-faint hover:text-text hover:bg-surface-raised',
        )}
        aria-label="Timeline view"
      >
        <Clock size={14} aria-hidden />
      </button>
    </div>
  );
}

// ─── AgentRail ────────────────────────────────────────────────────────────────

interface AgentRailProps {
  agents: Record<AgentId, Agent>;
  activeAgentId?: AgentId;
  view?: View;
  onViewChange?: (v: View) => void;
}

export function AgentRail({
  agents,
  activeAgentId,
  view = 'grid',
  onViewChange,
}: AgentRailProps) {
  const displayIds = AGENT_IDS.filter((id) => id !== 'director');
  const agentCount = displayIds.length;

  const sidebarHeader = (
    <div className="flex items-center justify-between">
      <Label className="font-mono text-label-xs tracking-[0.08em] uppercase text-text-faint">
        [AGENTS]
      </Label>
      <span className="font-mono text-label-xs tabular-nums text-text-faint border border-border rounded-sm px-1.5 py-0.5">
        {agentCount}
      </span>
    </div>
  );

  const sidebarFooter = onViewChange ? (
    <ViewToggle view={view} onViewChange={onViewChange} />
  ) : null;

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-border shrink-0">
        {sidebarHeader}
      </div>

      <ul role="list" className="flex-1 py-2 px-2 flex flex-col gap-0.5">
        {displayIds.map((id) => {
          const agent = agents[id];
          const meta = AGENT_REGISTRY[id];
          const status = agent?.status ?? 'queued';
          const isActive = id === activeAgentId;

          return (
            <li key={id}>
              <div
                className={cn(
                  'flex items-center gap-2.5 w-full min-h-11 px-3 rounded-md',
                  'text-body-sm font-medium',
                  'transition-[background-color,border-color,color] duration-75',
                  'text-text-muted',
                  'hover:text-text hover:bg-surface-raised',
                  isActive && [
                    'border-l-2 border-l-accent pl-[10px]',
                    'bg-accent-soft text-text',
                  ],
                )}
              >
                <span className="shrink-0 text-current" aria-hidden>
                  {AGENT_ICONS[id]}
                </span>
                <span className="flex-1 truncate">{meta.name}</span>
                <span className={statusDot(status)} aria-label={status} />
              </div>
            </li>
          );
        })}
      </ul>

      {sidebarFooter && (
        <div className="px-4 py-3 border-t border-border shrink-0">
          {sidebarFooter}
        </div>
      )}
    </aside>
  );
}
