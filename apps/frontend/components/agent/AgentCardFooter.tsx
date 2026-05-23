'use client';

import { Sparkles, RotateCcw, ExternalLink } from 'lucide-react';
import { Button, Chip, Mono } from '@studio/ui';
import type { Agent } from '@studio/shared';
import { RawStreamToggle } from './RawStreamToggle';

interface AgentCardFooterProps {
  agent: Agent;
  text: string;
  stable: string;
  fading: string;
  rawScrollRef: React.RefObject<HTMLDivElement>;
  duration: string | null;
  refining: boolean;
  rerunning: boolean;
  onRefineOpen: () => void;
  onRerun: () => void;
  runId: string;
}

export function AgentCardFooter({
  agent,
  text,
  stable,
  fading,
  rawScrollRef,
  duration,
  refining,
  rerunning,
  onRefineOpen,
  onRerun,
  runId,
}: AgentCardFooterProps) {
  const showActions = (agent.status === 'done' || agent.status === 'error') && !!runId;
  const showDeployUrl =
    agent.id === 'developer' && agent.status === 'done' && !!agent.deploy_url;

  return (
    <>
      {agent.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {agent.tools.map((tool) => (
            <Chip key={tool} className="text-micro tracking-wide tabular-nums">{tool}</Chip>
          ))}
        </div>
      )}

      {(agent.finalArtifact !== undefined || text !== '') && (
        <RawStreamToggle text={text} stable={stable} fading={fading} scrollRef={rawScrollRef} />
      )}

      {showDeployUrl && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            onClick={() => window.open(agent.deploy_url, '_blank', 'noopener,noreferrer')}
            aria-label="Open live site"
          >
            Open live site
          </Button>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            onClick={onRefineOpen}
            disabled={refining}
            aria-label="Refine this agent"
          >
            Refine
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={
              rerunning
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-text-faint/30 border-t-text-faint animate-spin shrink-0" aria-hidden />
                : <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            }
            onClick={onRerun}
            disabled={rerunning}
            aria-label="Re-run this agent"
          >
            Re-run
          </Button>
        </div>
      )}

      {duration && (
        <Mono className="text-micro tabular-nums text-text-faint mt-1">{duration}</Mono>
      )}
    </>
  );
}
