'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Square, Pin, Copy, Check } from 'lucide-react';
import { Chip, Mono, StatusDot, cn } from '@studio/ui';
import { AGENT_REGISTRY } from '@studio/shared';
import type { Agent, AgentId } from '@studio/shared';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import { ViaGemmaPill } from '@/components/agent/ViaGemmaPill';
import QualityBadge from '@/components/QualityBadge';
import { refineAgentBody, stopAgent } from '@/lib/agentActions';

interface AgentMessageProps {
  agent: Agent;
  runId: string;
  pinned: boolean;
  onPin: () => void;
  messageRef?: React.RefObject<HTMLDivElement | null>;
}

export function AgentMessage({ agent, runId, pinned, onPin, messageRef }: AgentMessageProps) {
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = AGENT_REGISTRY[agent.id as AgentId];
  const isDone = agent.status === 'done' || agent.status === 'error';
  const isRunning = agent.status === 'running';
  const showIteration = (agent.iteration ?? 1) > 1;

  async function handleSendRefine() {
    if (!refineText.trim()) return;
    setSubmitting(true);
    try {
      await refineAgentBody(runId, agent.id, refineText.trim());
      setRefineOpen(false);
      setRefineText('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStop() {
    await stopAgent(runId, agent.id);
  }

  function handleCopy() {
    void navigator.clipboard.writeText(JSON.stringify(agent.finalArtifact, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <motion.div
      ref={messageRef as React.RefObject<HTMLDivElement> | undefined}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-sm border bg-surface-raised',
        pinned ? 'border-accent' : 'border-border',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <span className="text-body-sm select-none" aria-hidden>{meta.emoji}</span>
        <span className="text-title-md text-text flex-1">{agent.name}</span>
        {showIteration && (
          <Mono className="text-[10px] text-text-faint">v{agent.iteration}</Mono>
        )}
        {agent.ranLocally && <ViaGemmaPill />}
        {agent.quality_score !== undefined && (
          <QualityBadge score={agent.quality_score} critique={agent.quality_critique} />
        )}
        <StatusDot status={agent.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3 min-h-[60px]">
        {agent.status === 'queued' && (
          <p className="font-mono text-body-sm text-text-faint italic">Waiting…</p>
        )}
        {isRunning && agent.streamedText && (
          <p className="font-mono text-mono-sm text-text-muted whitespace-pre-wrap break-all">
            {agent.streamedText}
          </p>
        )}
        {isRunning && !agent.streamedText && (
          <p className="font-mono text-body-sm text-text-faint italic">Running…</p>
        )}
        {agent.finalArtifact !== undefined && (
          <ArtifactRenderer agentId={agent.id as AgentId} artifact={agent.finalArtifact} />
        )}
        {agent.status === 'error' && agent.error && (
          <p className="text-body-sm text-status-error mt-1">{agent.error}</p>
        )}
      </div>

      {/* Footer toolbar */}
      {(isDone || isRunning) && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border">
          {isDone && (
            <button
              type="button"
              onClick={() => setRefineOpen((o) => !o)}
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] font-mono text-text-muted hover:text-text hover:border-border-strong hover:bg-surface transition-colors"
            >
              <RefreshCw className="h-3 w-3 shrink-0" aria-hidden />
              Re-run
            </button>
          )}
          {isRunning && (
            <button
              type="button"
              onClick={() => void handleStop()}
              title="Stop and skip ahead — does not cancel the in-flight request"
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] font-mono text-text-muted hover:text-status-error hover:border-status-error transition-colors"
            >
              <Square className="h-3 w-3 shrink-0" aria-hidden />
              Stop
            </button>
          )}
          {isDone && (
            <>
              <button
                type="button"
                onClick={onPin}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-mono transition-colors',
                  pinned
                    ? 'border-accent text-accent bg-accent-soft'
                    : 'border-border text-text-muted hover:text-text hover:border-border-strong hover:bg-surface',
                )}
              >
                <Pin className="h-3 w-3 shrink-0" aria-hidden />
                {pinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] font-mono text-text-muted hover:text-text hover:border-border-strong hover:bg-surface transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 shrink-0 text-status-done" aria-hidden />
                ) : (
                  <Copy className="h-3 w-3 shrink-0" aria-hidden />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Inline refine input */}
      <AnimatePresence>
        {refineOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-2">
              <textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={`Feedback for ${agent.name}…`}
                rows={2}
                className="w-full bg-surface-sunken border border-border rounded-sm font-mono text-mono-sm text-text placeholder:text-text-faint px-3 py-2 focus:outline-none focus:border-accent resize-none transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSendRefine()}
                  disabled={submitting || !refineText.trim()}
                  className="px-3 py-1 rounded-sm bg-accent text-text-on-accent font-mono text-label-sm uppercase hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {submitting ? 'Sending…' : 'Send refine'}
                </button>
                <button
                  type="button"
                  onClick={() => { setRefineOpen(false); setRefineText(''); }}
                  className="px-3 py-1 font-mono text-label-sm text-text-faint hover:text-text transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
