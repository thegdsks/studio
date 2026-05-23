'use client';

/**
 * AgentTimeline — "show your work" panel.
 *
 * Parses streamedText for tool-call markers (lines starting with 🔧)
 * and result markers (lines starting with ↩️), plus start/done events
 * derived from the Agent status. Renders a vertical timeline.
 */

import { useMemo } from 'react';
import type { Agent } from '@studio/shared';

interface TimelineEvent {
  kind: 'start' | 'tool' | 'result' | 'chunk' | 'done';
  label: string;
  ts?: number;
}

function parseEvents(agent: Agent): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (agent.startedAt) {
    events.push({ kind: 'start', label: 'Started', ts: agent.startedAt });
  }

  // Split streamedText into lines and classify
  const lines = agent.streamedText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('🔧')) {
      events.push({ kind: 'tool', label: trimmed.slice(2).trim() });
    } else if (trimmed.startsWith('↩️')) {
      events.push({ kind: 'result', label: trimmed.slice(2).trim() });
    }
  }

  if (agent.status === 'done' && agent.finishedAt) {
    events.push({ kind: 'done', label: 'Done', ts: agent.finishedAt });
  } else if (agent.status === 'error' && agent.finishedAt) {
    events.push({ kind: 'done', label: agent.error ?? 'Error', ts: agent.finishedAt });
  }

  return events;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const KIND_DOT: Record<TimelineEvent['kind'], string> = {
  start:  'bg-accent',
  tool:   'bg-status-warn',
  result: 'bg-status-done',
  chunk:  'bg-border',
  done:   'bg-status-done',
};

const KIND_LABEL: Record<TimelineEvent['kind'], string> = {
  start:  'text-text-muted',
  tool:   'text-text-muted',
  result: 'text-text-faint',
  chunk:  'text-text-faint',
  done:   'text-text-muted',
};

interface AgentTimelineProps {
  agent: Agent;
}

export function AgentTimeline({ agent }: AgentTimelineProps) {
  const events = useMemo(() => parseEvents(agent), [agent]);

  if (events.length === 0) {
    return (
      <p className="font-mono text-mono-sm text-text-faint italic">
        No events yet.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {events.map((ev, i) => (
        <li key={i} className="flex gap-3 pb-4 last:pb-0 relative">
          {/* Connector line */}
          {i < events.length - 1 && (
            <span
              className="absolute left-[5px] top-3 bottom-0 w-px bg-border"
              aria-hidden
            />
          )}

          {/* Dot */}
          <span
            className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-bg ${KIND_DOT[ev.kind]}`}
            aria-hidden
          />

          {/* Content */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className={`font-mono text-mono-sm leading-tight break-words ${KIND_LABEL[ev.kind]}`}>
              {ev.label}
            </span>
            {ev.ts && (
              <span className="font-mono text-[10px] text-text-faint tabular-nums">
                {formatTime(ev.ts)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
