'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AgentId, Agent } from '@studio/shared';
import { AGENT_REGISTRY } from '@studio/shared';
import { iconFor } from '@/lib/agentIcons';
import AgentDetailLayout from '@/components/detail/AgentDetailLayout';
import StrategistDetail from '@/components/detail/StrategistDetail';
import NamerDetail from '@/components/detail/NamerDetail';
import DesignerDetail from '@/components/detail/DesignerDetail';
import CopywriterDetail from '@/components/detail/CopywriterDetail';
import DeveloperDetail from '@/components/detail/DeveloperDetail';
import MarketerDetail from '@/components/detail/MarketerDetail';
import GrowthDetail from '@/components/detail/GrowthDetail';
import LegalDetail from '@/components/detail/LegalDetail';
import AnalystDetail from '@/components/detail/AnalystDetail';
import RawFallback from '@/components/artifacts/RawFallback';
import ActionPanel from '@/components/detail/ActionPanel';
import type { MetadataItem } from '@/components/detail/ActionPanel';

const DETAIL_AGENT_IDS = new Set<AgentId>([
  'strategist', 'namer', 'designer', 'copywriter', 'developer',
  'marketer', 'growth', 'legal', 'analyst',
]);

function isDetailAgentId(id: string): id is AgentId {
  return DETAIL_AGENT_IDS.has(id as AgentId);
}

interface RunApiResponse {
  idea?: string;
  agents?: Record<string, unknown>;
  privacy_mode?: boolean;
}

function formatTs(ts: number | undefined): string {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleString();
}

function formatDuration(start: number | undefined, end: number | undefined): string {
  if (!start) return 'N/A';
  const ms = (end ?? Date.now()) - start;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function isAgent(x: unknown): x is Agent {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.status === 'string';
}

interface DetailContentProps {
  agentId: AgentId;
  agent: Agent;
  metadata: MetadataItem[];
}

/**
 * Each detail component renders two sibling elements:
 *   1. <div class="flex-1 ..."> - main content
 *   2. <div class="w-80 ..."> - sticky ActionPanel sidebar
 * AgentDetailLayout wraps them in a flex-row container.
 */
function DetailContent({ agentId, agent, metadata }: DetailContentProps) {
  switch (agentId) {
    case 'strategist': return <StrategistDetail agent={agent} metadata={metadata} />;
    case 'namer':      return <NamerDetail      agent={agent} metadata={metadata} />;
    case 'designer':   return <DesignerDetail   agent={agent} metadata={metadata} />;
    case 'copywriter': return <CopywriterDetail agent={agent} metadata={metadata} />;
    case 'developer':  return <DeveloperDetail  agent={agent} metadata={metadata} />;
    case 'marketer':   return <MarketerDetail   agent={agent} metadata={metadata} />;
    case 'growth':     return <GrowthDetail     agent={agent} metadata={metadata} />;
    case 'legal':      return <LegalDetail      agent={agent} metadata={metadata} />;
    case 'analyst':    return <AnalystDetail    agent={agent} metadata={metadata} />;
    default:
      return (
        <>
          <div className="flex-1 min-w-0">
            <RawFallback artifact={agent.finalArtifact} />
          </div>
          <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
            <ActionPanel buttons={[]} metadata={metadata} nextSteps={[]} />
          </div>
        </>
      );
  }
}

export default function AgentDetailPage() {
  const params = useParams();
  const runId = typeof params.id === 'string' ? params.id : '';
  const agentIdParam = typeof params.agentId === 'string' ? params.agentId : '';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [runData, setRunData] = useState<RunApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function fetchRun() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as RunApiResponse;
        setRunData(data);

        const raw = (data.agents as Record<string, unknown> | undefined)?.[agentIdParam];
        if (isAgent(raw)) {
          setAgent(raw);
        } else {
          setError('Agent not found in this run.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    void fetchRun();
  }, [runId, agentIdParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-mono-sm text-text-faint animate-pulse">Loading agent...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-mono-sm text-status-error">{error ?? 'Agent not found.'}</p>
      </div>
    );
  }

  // Unknown agentId: minimal raw fallback
  if (!isDetailAgentId(agentIdParam)) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <p className="font-mono text-mono-sm text-text-faint">{agentIdParam}</p>
        <RawFallback artifact={agent.finalArtifact} />
      </div>
    );
  }

  const meta = AGENT_REGISTRY[agentIdParam];
  const AgentIcon = iconFor(agentIdParam);

  const metadata: MetadataItem[] = [
    { label: 'Run ID', value: runId.slice(0, 8) },
    { label: 'Status', value: agent.status },
    { label: 'Started', value: formatTs(agent.startedAt) },
    { label: 'Finished', value: formatTs(agent.finishedAt) },
    { label: 'Duration', value: formatDuration(agent.startedAt, agent.finishedAt) },
    { label: 'Source', value: agent.ranLocally ? 'Gemma (local)' : 'Gemini (cloud)' },
    ...(runData?.idea ? [{ label: 'Idea', value: runData.idea }] : []),
  ];

  return (
    <AgentDetailLayout
      runId={runId}
      agentName={meta.name}
      agentDescription={meta.description}
      agentIcon={AgentIcon}
      status={agent.status}
      ranLocally={agent.ranLocally}
    >
      <DetailContent agentId={agentIdParam} agent={agent} metadata={metadata} />
    </AgentDetailLayout>
  );
}
