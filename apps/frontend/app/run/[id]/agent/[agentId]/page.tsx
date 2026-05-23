'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { AgentId, Agent } from '@studio/shared';
import { AGENT_REGISTRY } from '@studio/shared';
import { StatusBadge } from '@studio/ui';
import { iconFor } from '@/lib/agentIcons';
import { useRunStream } from '@/lib/useRunStream';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import RawFallback from '@/components/artifacts/RawFallback';
import { AgentTimeline } from '@/components/detail/AgentTimeline';
import { AgentMetaStrip } from '@/components/detail/AgentMetaStrip';
import { AgentDetailFooter } from '@/components/detail/AgentDetailFooter';

// ─── Types ────────────────────────────────────────────────────────────────────

const DETAIL_AGENT_IDS = new Set<AgentId>([
  'strategist', 'namer', 'designer', 'copywriter', 'developer',
  'marketer', 'growth', 'legal', 'analyst',
]);

function isDetailAgentId(id: string): id is AgentId {
  return DETAIL_AGENT_IDS.has(id as AgentId);
}

interface CostApiResponse {
  cost_usd?: number;
  input_tokens?: number;
  output_tokens?: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const params = useParams();
  const runId = typeof params.id === 'string' ? params.id : '';
  const agentIdParam = typeof params.agentId === 'string' ? params.agentId : '';

  // Live SSE subscription — same hook as the run grid page
  const { agents, idea, error: streamError } = useRunStream(runId);

  // Cost data fetched separately from /api/runs/:id/cost
  const [costData, setCostData] = useState<CostApiResponse | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;

    async function fetchCost() {
      try {
        const res = await fetch(`/api/runs/${runId}/cost`);
        if (!res.ok) return; // cost is informational — no throw on 404
        const data = (await res.json()) as CostApiResponse;
        if (!cancelled) setCostData(data);
      } catch {
        // cost is informational — no loud failure
      }
    }

    void fetchCost();
    return () => { cancelled = true; };
  }, [runId]);

  // Resolve agent from live stream
  const agent: Agent | null =
    isDetailAgentId(agentIdParam) ? (agents[agentIdParam as AgentId] ?? null) : null;

  // ── Loading / error states ───────────────────────────────────────────────────

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        {streamError ? (
          <p className="font-mono text-mono-sm text-status-error">[stream] {streamError}</p>
        ) : (
          <p className="font-mono text-mono-sm text-text-faint animate-pulse">
            Loading agent...
          </p>
        )}
      </div>
    );
  }

  if (!isDetailAgentId(agentIdParam)) {
    return (
      <div className="min-h-screen p-8 space-y-4 bg-bg">
        <p className="font-mono text-mono-sm text-text-faint">{agentIdParam}</p>
        <RawFallback artifact={agent.finalArtifact} />
      </div>
    );
  }

  const meta = AGENT_REGISTRY[agentIdParam];
  const AgentIcon = iconFor(agentIdParam);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-header border-b border-border bg-surface">
        <div className="mx-auto max-w-page px-4 py-3 flex items-center gap-4">
          <Link
            href={`/run/${runId}`}
            className="inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text transition-colors duration-micro"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to run
          </Link>
          <span className="text-text-faint">/</span>
          <span className="font-mono text-mono-sm text-text-faint truncate">
            {runId.slice(0, 8)} / {meta.name}
          </span>
          {agent.ranLocally && (
            <span className="ml-auto font-mono text-label-sm text-accent border border-border-accent bg-accent-soft px-2 py-0.5 rounded">
              via Gemma
            </span>
          )}
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface-raised">
        <div className="mx-auto max-w-page px-4 py-8 flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface">
            <AgentIcon className="h-7 w-7 text-text-muted" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-display-md font-display text-text">{meta.name}</h1>
              <StatusBadge status={agent.status} />
              {/* TODO: ProviderBadge — swap in when parallel agent ships */}
            </div>
            <p className="text-body-md text-text-muted max-w-2xl">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-page w-full px-4 py-8 flex flex-col gap-8">
        {/* 4-col metadata strip */}
        <AgentMetaStrip agent={agent} costData={costData} />

        {/* Two-col body: artifact 60% + timeline 40% */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Artifact column */}
          <div className="flex-1 min-w-0">
            {agent.finalArtifact !== undefined ? (
              <ArtifactRenderer agentId={agentIdParam} artifact={agent.finalArtifact} />
            ) : (
              <div className="font-mono text-mono-sm text-text-muted whitespace-pre-wrap break-all bg-surface-sunken rounded-sm p-4">
                {agent.streamedText || (
                  <span className="text-text-faint italic">No content yet.</span>
                )}
              </div>
            )}
          </div>

          {/* Timeline column — "show your work" */}
          <aside className="w-full lg:w-[38%] shrink-0 lg:sticky lg:top-24 space-y-3">
            <p className="font-mono text-label-xs text-text-faint uppercase tracking-[0.35em]">
              Show your work
            </p>
            <AgentTimeline agent={agent} />
          </aside>
        </div>

        {idea && (
          <p className="font-mono text-mono-sm text-text-faint">
            Idea: {idea}
          </p>
        )}
      </main>

      {/* ── Footer toolbar ─────────────────────────────────────────────── */}
      <AgentDetailFooter
        runId={runId}
        agentId={agentIdParam}
        artifact={agent.finalArtifact}
      />
    </div>
  );
}
