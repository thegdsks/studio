'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Agent } from '@studio/shared';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Label,
  Mono,
  StatusBadge,
  StatusDot,
  type CardTone,
} from '@studio/ui';

interface AgentCardProps {
  agent: Agent;
}

const cardToneByStatus: Record<Agent['status'], CardTone> = {
  queued: 'resting',
  running: 'active',
  done: 'resting',
  error: 'error',
};

export default function AgentCard({ agent }: AgentCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [flashDone, setFlashDone] = useState(false);
  const prevStatusRef = useRef<Agent['status']>(agent.status);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [agent.streamedText]);

  useEffect(() => {
    if (prevStatusRef.current !== 'done' && agent.status === 'done') {
      setFlashDone(true);
      const timer = setTimeout(() => setFlashDone(false), 600);
      prevStatusRef.current = agent.status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = agent.status;
    return undefined;
  }, [agent.status]);

  const tone: CardTone = flashDone ? 'success' : cardToneByStatus[agent.status];

  const FADE_LEN = 60;
  const text = agent.streamedText;
  const { stable, fading } = useMemo(
    () => ({
      stable: text.length > FADE_LEN ? text.slice(0, text.length - FADE_LEN) : '',
      fading: text.length > FADE_LEN ? text.slice(text.length - FADE_LEN) : text,
    }),
    [text],
  );

  return (
    <Card tone={tone} className="h-agent-card">
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="text-base leading-none select-none">{agent.emoji}</span>
          <span className="text-title-md text-text truncate">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusDot status={agent.status} />
          <StatusBadge status={agent.status} />
        </div>
      </CardHeader>

      <CardBody className="streamfade">
        {text === '' && agent.status === 'queued' && (
          <Mono className="italic">Waiting to start…</Mono>
        )}
        {text === '' && agent.status === 'running' && (
          <Mono className="italic">Thinking…</Mono>
        )}
        {text !== '' && (
          <div ref={scrollRef} className="font-mono text-mono-md text-text-muted">
            <span>{stable}</span>
            <motion.span
              key={fading}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {fading}
            </motion.span>
          </div>
        )}
        {agent.status === 'error' && agent.error && (
          <p className="text-body-sm text-error mt-2">{agent.error}</p>
        )}
      </CardBody>

      {(agent.tools.length > 0 || agent.finalArtifact !== undefined) && (
        <CardFooter className="flex flex-col gap-2">
          {agent.tools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agent.tools.map((tool) => (
                <Chip key={tool}>{tool}</Chip>
              ))}
            </div>
          )}
          {agent.finalArtifact !== undefined && (
            <ArtifactPreview artifact={agent.finalArtifact} />
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function ArtifactPreview({ artifact }: { artifact: unknown }) {
  const [expanded, setExpanded] = useState(false);

  const summary = summarise(artifact);
  if (summary === null) return null;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-text-faint hover:text-secondary transition-colors duration-micro w-full text-left"
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 transition-transform duration-state ${expanded ? 'rotate-90' : ''}`}
        />
        <Label className="truncate">{summary}</Label>
      </button>
      {expanded && (
        <pre className="mt-2 text-mono-sm font-mono text-text-muted bg-surface-sunken rounded-md p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all border border-border">
          {JSON.stringify(artifact, null, 2)}
        </pre>
      )}
    </div>
  );
}

function summarise(a: unknown): string | null {
  if (a === null || a === undefined) return null;
  if (typeof a === 'string') return a.length > 60 ? a.slice(0, 60) + '…' : a;
  if (Array.isArray(a)) return `${a.length} item${a.length !== 1 ? 's' : ''}`;
  if (typeof a === 'object') {
    const keys = Object.keys(a as object);
    return keys.slice(0, 3).join(', ') + (keys.length > 3 ? '…' : '');
  }
  return String(a);
}
