'use client';

/**
 * Global refine bar — type `@agentname feedback` or select agent from the
 * dropdown and submit. Posts to POST /api/runs/:runId/refine.
 */

import { useState } from 'react';
import { Send } from 'lucide-react';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import type { AgentId } from '@studio/shared';
import { refineAgentBody } from '@/lib/agentActions';

const AGENT_PREFIXES: Record<string, AgentId> = Object.fromEntries(
  AGENT_IDS.map((id) => [AGENT_REGISTRY[id].name.toLowerCase(), id]),
);

function parseAtMention(text: string): { agentId: AgentId | null; feedback: string } {
  const match = /^@(\w+)\s+(.+)$/is.exec(text.trim());
  if (!match) return { agentId: null, feedback: text.trim() };
  const name = (match[1] ?? '').toLowerCase();
  const agentId = AGENT_PREFIXES[name] ?? null;
  return { agentId, feedback: (match[2] ?? '').trim() };
}

interface RefineBarProps {
  runId: string;
}

export function RefineBar({ runId }: RefineBarProps) {
  const [text, setText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentId | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const { agentId: mentioned, feedback } = parseAtMention(text);
    const agentId = mentioned ?? (selectedAgent || null);
    if (!agentId) {
      setError('Specify an agent: @designer or use the dropdown');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await refineAgentBody(runId, agentId, feedback);
      setText('');
      setSelectedAgent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-border bg-surface px-4 py-3">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex items-end gap-2">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value as AgentId | '')}
          className="flex-shrink-0 bg-surface-sunken border border-border rounded-sm font-mono text-mono-sm text-text px-2 py-2 focus:outline-none focus:border-accent transition-colors"
          aria-label="Select agent"
        >
          <option value="">@agent</option>
          {AGENT_IDS.map((id) => (
            <option key={id} value={id}>
              {AGENT_REGISTRY[id].name}
            </option>
          ))}
        </select>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder="@designer make the palette warmer…"
            className="w-full bg-surface-sunken border border-border rounded-sm font-mono text-mono-sm text-text placeholder:text-text-faint px-3 py-2 focus:outline-none focus:border-accent transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
          {error && (
            <p className="font-mono text-[11px] text-status-error">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-accent text-text-on-accent font-mono text-label-sm uppercase hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
        >
          <Send className="h-3 w-3" aria-hidden />
          {submitting ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
