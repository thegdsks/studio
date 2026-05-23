'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Clock,
} from '@phosphor-icons/react';
import type { Agent } from '@studio/shared';

interface AgentCardProps {
  agent: Agent;
}

function StatusIcon({ status }: { status: Agent['status'] }) {
  switch (status) {
    case 'running':
      return (
        <CircleNotch
          className="h-4 w-4 text-sky-400 animate-spin"
          weight="bold"
        />
      );
    case 'done':
      return (
        <CheckCircle
          className="h-4 w-4 text-emerald-400"
          weight="fill"
        />
      );
    case 'error':
      return (
        <WarningCircle
          className="h-4 w-4 text-red-400"
          weight="fill"
        />
      );
    case 'queued':
    default:
      return (
        <Clock
          className="h-4 w-4 text-slate-500"
          weight="regular"
        />
      );
  }
}

function StatusLabel({ status }: { status: Agent['status'] }) {
  const labels: Record<Agent['status'], string> = {
    queued: 'Queued',
    running: 'Running',
    done: 'Done',
    error: 'Error',
  };

  const colors: Record<Agent['status'], string> = {
    queued: 'text-slate-500',
    running: 'text-sky-400',
    done: 'text-emerald-400',
    error: 'text-red-400',
  };

  return (
    <motion.span
      className={`text-xs font-medium ${colors[status]}`}
      animate={
        status === 'running'
          ? { scale: [1, 1.02, 1] }
          : { scale: 1 }
      }
      transition={
        status === 'running'
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : {}
      }
    >
      {labels[status]}
    </motion.span>
  );
}

function ArtifactPreview({ artifact }: { artifact: unknown }) {
  const [expanded, setExpanded] = useState(false);

  if (artifact === null || artifact === undefined) return null;

  const summary = (() => {
    if (typeof artifact === 'string') {
      return artifact.slice(0, 120) + (artifact.length > 120 ? '…' : '');
    }
    if (Array.isArray(artifact)) {
      return `${artifact.length} item${artifact.length !== 1 ? 's' : ''}`;
    }
    if (typeof artifact === 'object') {
      const keys = Object.keys(artifact as object);
      return keys.slice(0, 3).join(', ') + (keys.length > 3 ? '…' : '');
    }
    return String(artifact);
  })();

  return (
    <div className="mt-2 border-t border-slate-800 pt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"
      >
        <span>{expanded ? '▾' : '▸'}</span>
        <span className="truncate">{summary}</span>
      </button>
      {expanded && (
        <pre className="mt-2 text-xs text-slate-400 bg-slate-950 rounded-lg p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all">
          {JSON.stringify(artifact, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AgentCard({ agent }: AgentCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [flashDone, setFlashDone] = useState(false);
  const prevStatusRef = useRef<Agent['status']>(agent.status);

  // Auto-scroll streaming text to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [agent.streamedText]);

  // Flash green border when status flips to done
  useEffect(() => {
    if (prevStatusRef.current !== 'done' && agent.status === 'done') {
      setFlashDone(true);
      const timer = setTimeout(() => setFlashDone(false), 1000);
      prevStatusRef.current = agent.status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = agent.status;
    return undefined;
  }, [agent.status]);

  const borderColor = flashDone
    ? 'border-emerald-500'
    : agent.status === 'error'
    ? 'border-red-900/60'
    : agent.status === 'running'
    ? 'border-sky-900/60'
    : 'border-slate-800';

  // Fade-in effect: wrap only the last 60 chars of streamedText
  const text = agent.streamedText;
  const FADE_LEN = 60;
  const stableText = text.length > FADE_LEN ? text.slice(0, text.length - FADE_LEN) : '';
  const fadingText = text.length > FADE_LEN ? text.slice(text.length - FADE_LEN) : text;

  return (
    <div
      className={`
        flex flex-col rounded-xl border bg-slate-900 transition-colors duration-300
        ${borderColor}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none select-none">{agent.emoji}</span>
          <span className="text-sm font-semibold text-slate-100 truncate">
            {agent.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <StatusIcon status={agent.status} />
          <StatusLabel status={agent.status} />
        </div>
      </div>

      {/* Streaming text body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-44 px-4 py-3 text-xs text-slate-400 leading-relaxed font-mono"
      >
        {text === '' && agent.status === 'queued' && (
          <span className="text-slate-600 italic">Waiting to start…</span>
        )}
        {text === '' && agent.status === 'running' && (
          <span className="text-slate-600 italic">Thinking…</span>
        )}
        {text !== '' && (
          <>
            <span>{stableText}</span>
            <motion.span
              key={fadingText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {fadingText}
            </motion.span>
          </>
        )}
        {agent.status === 'error' && agent.error && (
          <p className="text-red-400 mt-1">{agent.error}</p>
        )}
      </div>

      {/* Tool trace */}
      {agent.tools.length > 0 && (
        <div className="px-4 pb-1">
          <div className="flex flex-wrap gap-1">
            {agent.tools.map((tool) => (
              <span
                key={tool}
                className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-500"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Artifact footer */}
      {agent.finalArtifact !== undefined && (
        <div className="px-4 pb-3">
          <ArtifactPreview artifact={agent.finalArtifact} />
        </div>
      )}
    </div>
  );
}
