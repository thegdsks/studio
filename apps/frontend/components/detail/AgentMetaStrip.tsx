'use client';

/**
 * AgentMetaStrip — 4-column metadata row below the hero.
 *
 * Columns: Provider · Cost · Iteration · Duration
 * Responsive: 2×2 on mobile, 4-col on md+.
 *
 * Provider renders a placeholder text "Google · Gemini 3.5 Flash".
 * TODO: swap Provider cell for <ProviderBadge agentId={agentId} /> when
 * the parallel thesvg+provider agent ships packages/ui/src/ProviderBadge.tsx
 * and apps/frontend/lib/providers.ts.
 */

import type { Agent } from '@studio/shared';

interface CostData {
  cost_usd?: number;
  input_tokens?: number;
  output_tokens?: number;
}

function formatUsd(v: number | undefined): string {
  if (v === undefined || v <= 0) return '—';
  if (v < 0.001) return `$${v.toFixed(5)}`;
  if (v < 0.01)  return `$${v.toFixed(4)}`;
  if (v < 1)     return `$${v.toFixed(3)}`;
  return `$${v.toFixed(2)}`;
}

function formatDuration(start: number | undefined, end: number | undefined): string {
  if (!start) return '—';
  const ms = (end ?? Date.now()) - start;
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s / 60);
  return m > 0 ? `${m}m ${(s % 60).toString().padStart(2, '0')}s` : `${s}s`;
}

interface MetaCell {
  label: string;
  value: string;
  caption?: string;
}

function MetaCard({ label, value, caption }: MetaCell) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 border border-border rounded-sm bg-surface">
      <span className="font-mono text-label-xs text-text-faint uppercase tracking-[0.35em]">
        {label}
      </span>
      <span className="font-mono text-mono-sm text-text tabular-nums leading-tight">
        {value}
      </span>
      {caption && (
        <span className="font-mono text-[10px] text-text-faint leading-tight">
          {caption}
        </span>
      )}
    </div>
  );
}

interface AgentMetaStripProps {
  agent: Agent;
  costData: CostData | null;
}

export function AgentMetaStrip({ agent, costData }: AgentMetaStripProps) {
  const providerLabel = agent.ranLocally
    ? 'Ollama · Gemma 4'
    : 'Google · Gemini 3.5 Flash';
  // TODO: ProviderBadge — when parallel thesvg+provider agent ships
  // apps/frontend/lib/providers.ts + packages/ui/src/ProviderBadge.tsx,
  // replace the text above with:
  //   <ProviderBadge agentId={agent.id} />

  const costValue = formatUsd(costData?.cost_usd);
  const costCaption =
    costData?.input_tokens != null && costData?.output_tokens != null
      ? `${costData.input_tokens.toLocaleString()} in · ${costData.output_tokens.toLocaleString()} out`
      : undefined;

  const iteration = agent.iteration ?? 1;
  const iterationCaption = agent.refined_with
    ? `Refined: "${agent.refined_with.slice(0, 40)}${agent.refined_with.length > 40 ? '…' : ''}"`
    : undefined;

  const duration = formatDuration(agent.startedAt, agent.finishedAt);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-border pb-6">
      <MetaCard label="Provider" value={providerLabel} />
      <MetaCard label="Cost" value={costValue} caption={costCaption} />
      <MetaCard
        label="Iteration"
        value={`#${iteration}`}
        caption={iterationCaption}
      />
      <MetaCard label="Duration" value={duration} />
    </div>
  );
}
