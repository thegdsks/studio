'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_REGISTRY } from '@studio/shared';
import { Card, CardBody, CardHeader, Chip, Label, Button, useRetry } from '@studio/ui';
import { DirectorReveal } from './DirectorReveal.js';
import type { DirectorBriefingData } from './DirectorReveal.js';

interface Inconsistency {
  severity: 'low' | 'medium' | 'high';
  issue: string;
  resolution: string;
}

interface DirectorArtifact {
  one_line_pitch: string;
  coherence_score: number;
  hot_take: string;
  unified_narrative: string;
  next_7_days: string[];
  inconsistencies: Inconsistency[];
  confidence_by_agent: Record<string, number>;
  briefing?: DirectorBriefingData;
}

function parseDirectorData(agent: Agent): DirectorArtifact | null {
  if (agent.finalArtifact) {
    return agent.finalArtifact as DirectorArtifact;
  }
  if (agent.streamedText) {
    try {
      const match = agent.streamedText.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as DirectorArtifact;
    } catch {
      // not yet fully streamed
    }
  }
  return null;
}

interface DirectorPanelProps {
  agent: Agent;
}

export function DirectorPanel({ agent }: DirectorPanelProps) {
  const data = parseDirectorData(agent);
  const retryOp = useRetry(async () => {
    // Director retry: surface error so user can act. No silent swallow.
    throw new Error(`Director agent failed: ${agent.error ?? 'unknown error'}`);
  }, { maxAttempts: 1 });

  if (agent.status === 'queued') return null;

  // Running but no parsed data yet: explicit idle/waiting state
  if (agent.status === 'running' && !data) {
    return (
      <Card surface="glass" tone="active" className="w-full shadow-elev-2">
        <CardBody className="p-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label>Director</Label>
            <span className="text-body-sm text-text-muted">Synthesizing launch kit...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Error with no parsed data
  if (agent.status === 'error' && !data) {
    return (
      <Card surface="glass" tone="error" className="w-full shadow-elev-2">
        <CardBody className="p-4 flex flex-col gap-3">
          <p className="text-body-sm text-status-error font-mono">
            {agent.error ?? 'Director synthesis failed.'}
          </p>
          {retryOp.state !== 'pending' && (
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={() => { void retryOp.run(); }}
            >
              Retry director
            </Button>
          )}
          {retryOp.state === 'pending' && (
            <Loader2 className="h-4 w-4 animate-spin text-text-faint" aria-hidden />
          )}
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  // Done with structured briefing
  if (agent.status === 'done' && data.briefing) {
    return (
      <div className="w-full flex flex-col gap-6">
        <DirectorReveal briefing={data.briefing} />
        <DirectorSynthesisDetail data={data} />
      </div>
    );
  }

  // Fallback: streaming or old artifact without briefing
  return <DirectorSynthesisDetail data={data} />;
}

// ── Synthesis detail ──────────────────────────────────────────────────────────

interface DirectorSynthesisDetailProps {
  data: DirectorArtifact;
}

function DirectorSynthesisDetail({ data }: DirectorSynthesisDetailProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (data?.inconsistencies?.some((inc) => inc.severity === 'high')) {
      setExpanded(true);
    }
  }, [data]);

  return (
    <Card surface="glass" tone="active" className="w-full shadow-elev-2">
      <CardHeader>
        <Label>Director</Label>
        <span className="text-body-sm text-text-muted font-mono tabular-nums">
          coherence: <span className="text-display-md text-accent tabular-nums">{data.coherence_score}</span>
        </span>
      </CardHeader>
      <CardBody className="p-4 flex flex-col gap-4">
        {/* Pitch */}
        <blockquote className="text-title-md text-text leading-tight border-l border-border-accent pl-3 italic">
          &ldquo;{data.one_line_pitch}&rdquo;
        </blockquote>

        {/* Hot take */}
        <div className="rounded-md border border-border-accent bg-accent-soft p-3 flex flex-col gap-1">
          <Label className="text-accent">Hot take</Label>
          <p className="text-body-sm text-text italic">{data.hot_take}</p>
        </div>

        {/* Narrative */}
        <div className="flex flex-col gap-1">
          <Label>Strategic narrative</Label>
          <p className="text-body-sm text-text-muted leading-relaxed whitespace-pre-line">
            {data.unified_narrative}
          </p>
        </div>

        {/* 7-day plan */}
        {data.next_7_days.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Next 7 days</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {data.next_7_days.map((item, idx) => {
                const parts = item.split(/:\s*(.*)/);
                const title = parts[0] ?? `Day ${idx + 1}`;
                const desc = parts[1] ?? item;
                return (
                  <div key={idx} className="bg-surface-sunken border border-border rounded-sm p-2 flex flex-col gap-0.5">
                    <Label className="truncate text-label-xs">{title}</Label>
                    <p className="text-label-xs text-text-muted leading-tight">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inconsistencies */}
        {data.inconsistencies && data.inconsistencies.length > 0 && (
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center justify-between w-full py-1 text-left"
            >
              <div className="flex items-center gap-2">
                <Label>Misalignments</Label>
                <Chip>{data.inconsistencies.length} found</Chip>
              </div>
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-text-muted" />}
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 flex flex-col gap-2">
                    {data.inconsistencies.map((inc, idx) => {
                      const tone: 'error' | 'accent' | 'neutral' =
                        inc.severity === 'high' ? 'error'
                        : inc.severity === 'medium' ? 'accent'
                        : 'neutral';
                      return (
                        <div key={idx} className="bg-surface-sunken border border-border rounded-sm p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Chip tone={tone}>{inc.severity}</Chip>
                            <p className="text-body-sm text-text">{inc.issue}</p>
                          </div>
                          <p className="text-body-sm text-text-muted">Fix: {inc.resolution}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Confidence grid */}
        {data.confidence_by_agent && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Label>Specialist confidence</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(data.confidence_by_agent).map(([id, confidence]) => {
                const meta = AGENT_REGISTRY[id as AgentId] ?? { name: id, emoji: '.' };
                return (
                  <div key={id} className="bg-surface-sunken border border-border rounded-sm p-2 flex flex-col items-center text-center">
                    <span className="text-body-sm text-text-muted truncate max-w-full">{meta.name}</span>
                    <span className="font-mono text-mono-sm text-text tabular-nums">{confidence}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
