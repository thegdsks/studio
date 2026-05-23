'use client';

/**
 * AgentDetailFooter — toolbar row at the bottom of the agent detail page.
 *
 * Actions:
 *   - Re-run: POST /api/runs/:runId/refine  { agent_id }
 *   - Copy JSON: copies finalArtifact to clipboard
 *   - Pin to workspace: writes a record to localStorage under "studio:workspace:pins"
 */

import { useState } from 'react';
import { RotateCcw, Copy, Check, Pin } from 'lucide-react';
import type { AgentId } from '@studio/shared';

interface AgentDetailFooterProps {
  runId: string;
  agentId: AgentId;
  artifact: unknown;
}

interface PinRecord {
  runId: string;
  agentId: AgentId;
  pinnedAt: number;
}

const PINS_KEY = 'studio:workspace:pins';

function readPins(): PinRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PINS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PinRecord[];
  } catch {
    return [];
  }
}

function writePin(runId: string, agentId: AgentId): void {
  const pins = readPins();
  const exists = pins.some((p) => p.runId === runId && p.agentId === agentId);
  if (exists) return;
  pins.push({ runId, agentId, pinnedAt: Date.now() });
  window.localStorage.setItem(PINS_KEY, JSON.stringify(pins));
}

export function AgentDetailFooter({ runId, agentId, artifact }: AgentDetailFooterProps) {
  const [rerunning, setRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pinned, setPinned] = useState(false);

  async function handleRerun() {
    setRerunning(true);
    setRerunError(null);
    try {
      const res = await fetch(`/api/runs/${runId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      setRerunError(err instanceof Error ? err.message : 'Rerun failed');
    } finally {
      setRerunning(false);
    }
  }

  function handleCopyJson() {
    const text = JSON.stringify(artifact ?? null, null, 2);
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePin() {
    writePin(runId, agentId);
    setPinned(true);
    setTimeout(() => setPinned(false), 2000);
  }

  return (
    <div className="border-t border-border bg-surface">
      <div className="mx-auto max-w-page px-4 py-3 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={rerunning}
          onClick={() => void handleRerun()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-surface-raised font-mono text-label-sm uppercase tracking-wider text-text-muted hover:border-border-strong hover:text-text disabled:opacity-50 disabled:pointer-events-none transition-colors duration-micro"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {rerunning ? 'Re-running...' : 'Re-run'}
        </button>

        <button
          type="button"
          onClick={handleCopyJson}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-surface-raised font-mono text-label-sm uppercase tracking-wider text-text-muted hover:border-border-strong hover:text-text transition-colors duration-micro"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-status-done" aria-hidden />
            : <Copy className="h-3.5 w-3.5" aria-hidden />
          }
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>

        <button
          type="button"
          onClick={handlePin}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-surface-raised font-mono text-label-sm uppercase tracking-wider text-text-muted hover:border-border-strong hover:text-text transition-colors duration-micro"
        >
          <Pin className="h-3.5 w-3.5" aria-hidden />
          {pinned ? 'Pinned!' : 'Pin to workspace'}
        </button>

        {rerunError && (
          <span className="font-mono text-mono-sm text-status-error">
            {rerunError}
          </span>
        )}
      </div>
    </div>
  );
}
