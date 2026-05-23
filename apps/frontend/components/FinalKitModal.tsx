'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowSquareOut } from '@phosphor-icons/react';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';

interface FinalKitModalProps {
  run: { agents: Record<AgentId, Agent> };
  open: boolean;
  onClose: () => void;
}

function renderArtifact(artifact: unknown): React.ReactNode {
  if (artifact === null || artifact === undefined) {
    return <span className="text-slate-600 italic">No artifact</span>;
  }

  if (typeof artifact === 'string') {
    // Render markdown-ish: split on double newlines for paragraphs
    return (
      <div className="space-y-2">
        {artifact.split(/\n\n+/).map((para, i) => (
          <p key={i} className="text-sm text-slate-300 whitespace-pre-wrap">
            {para}
          </p>
        ))}
      </div>
    );
  }

  if (Array.isArray(artifact)) {
    return (
      <ul className="space-y-1 list-none">
        {artifact.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex gap-2">
            <span className="text-slate-600 flex-shrink-0">—</span>
            <span>
              {typeof item === 'string'
                ? item
                : JSON.stringify(item, null, 2)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  // Object: pretty-print JSON
  return (
    <pre className="text-xs text-slate-400 bg-slate-950 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all">
      {JSON.stringify(artifact, null, 2)}
    </pre>
  );
}

function getDeployedUrl(artifact: unknown): string | null {
  if (typeof artifact !== 'object' || artifact === null) return null;
  const obj = artifact as Record<string, unknown>;
  if (typeof obj['liveUrl'] === 'string') return obj['liveUrl'];
  if (typeof obj['deployedUrl'] === 'string') return obj['deployedUrl'];
  return null;
}

export default function FinalKitModal({ run, open, onClose }: FinalKitModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const developerArtifact = run.agents['developer']?.finalArtifact;
  const deployedUrl = getDeployedUrl(developerArtifact);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="
              fixed inset-0 z-50 flex items-center justify-center p-4
              pointer-events-none
            "
          >
            <motion.div
              className="
                relative w-full max-w-4xl max-h-[90vh] overflow-y-auto
                rounded-2xl border border-slate-800 bg-slate-900
                pointer-events-auto
              "
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
                <h2 className="text-lg font-bold text-slate-100">
                  Your launch kit
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    rounded-lg p-1.5 text-slate-400 hover:text-slate-100
                    hover:bg-slate-800 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-sky-400/40
                  "
                >
                  <X className="h-5 w-5" weight="bold" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-8">
                {/* Hero CTA: deployed site */}
                {deployedUrl && (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-6">
                    <p className="text-sm text-sky-300 font-medium">
                      Your site is live
                    </p>
                    <a
                      href={deployedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400
                        px-6 py-3 text-sm font-semibold text-slate-950
                        transition-colors
                      "
                    >
                      Open deployed site
                      <ArrowSquareOut className="h-4 w-4" weight="bold" />
                    </a>
                  </div>
                )}

                {/* Agent sections */}
                {AGENT_IDS.map((agentId) => {
                  const agent = run.agents[agentId];
                  const meta = AGENT_REGISTRY[agentId];
                  if (!agent) return null;

                  return (
                    <section key={agentId} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.emoji}</span>
                        <h3 className="text-base font-semibold text-slate-100">
                          {meta.name}
                        </h3>
                        <span className="text-xs text-slate-500">
                          — {meta.description}
                        </span>
                      </div>

                      {agent.status === 'error' ? (
                        <p className="text-sm text-red-400">
                          {agent.error ?? 'Agent encountered an error.'}
                        </p>
                      ) : agent.finalArtifact !== undefined ? (
                        renderArtifact(agent.finalArtifact)
                      ) : (
                        <p className="text-sm text-slate-600 italic">
                          No artifact produced.
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
