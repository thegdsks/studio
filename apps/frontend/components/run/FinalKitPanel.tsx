'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, X, ExternalLink, Share2, Check, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import {
  Button, Chip, Heading, Label,
  slideUpPanel, fadeIn, withReducedMotion, usePrefersReducedMotion,
  ErrorBoundary,
} from '@studio/ui';
import { BrandPreview } from '../BrandPreview';
import ArtifactRenderer from '../artifacts/ArtifactRenderer';
import { AgentBadgeStrip } from './AgentBadgeStrip';

interface FinalKitPanelProps {
  run: { agents: Record<AgentId, Agent> };
  open: boolean;
  onClose: () => void;
  runId?: string;
}

export function FinalKitPanel({ run, open, onClose, runId }: FinalKitPanelProps) {
  const prefersReduced = usePrefersReducedMotion();
  const panelVariants = withReducedMotion(slideUpPanel, prefersReduced);
  const contentVariants = withReducedMotion(fadeIn, prefersReduced);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Escape key close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const designer = run.agents['designer']?.finalArtifact;
  const developer = run.agents['developer']?.finalArtifact;
  const deployedUrl = getDeployedUrl(developer);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Click-outside backdrop */}
          <div
            ref={backdropRef}
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            key="final-kit-panel"
            className="fixed bottom-0 right-0 z-50 bg-surface-raised border-t border-border-accent rounded-t-xl overflow-hidden backdrop-blur-glass"
            style={{ left: 'var(--sidebar-width, 0px)' }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Badge strip - 9 to 1 convergence. Max-h-[40vh] keeps the grid visible. */}
            <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-surface">
              <AgentBadgeStrip agents={run.agents} />
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="font-mono text-label-sm text-text-faint">Final kit ready</p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close kit panel"
                  className="rounded-sm p-1 text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content — capped at 40vh so the 3x3 grid stays visible above */}
            <ErrorBoundary label="final-kit-content" onReset={onClose}>
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.08 }}
                className="overflow-y-auto overflow-x-hidden px-6 py-6 space-y-10 max-h-[70vh]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heading level="headline-md" as="h2">Launch kit</Heading>
                    <Chip tone="success">Ready to ship</Chip>
                  </div>
                  {/* Primary CTA: outlined accent, no fill, fill on hover */}
                  <a
                    href={deployedUrl ?? `/run/${runId}`}
                    target={deployedUrl ? '_blank' : undefined}
                    rel={deployedUrl ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 rounded-md border border-accent px-4 py-2 font-medium text-body-sm text-accent transition-colors hover:bg-accent hover:text-text-on-accent"
                  >
                    Open full kit
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>

                {deployedUrl && <DeployedHero url={deployedUrl} runId={runId} />}
                <BrandPreview artifact={designer} runId={runId} />

                {AGENT_IDS.map((agentId) => {
                  const agent = run.agents[agentId];
                  const meta = AGENT_REGISTRY[agentId];
                  if (!agent) return null;
                  return (
                    <AgentSection
                      key={agentId}
                      title={meta.name}
                      description={meta.description}
                      agent={agent}
                    />
                  );
                })}
              </motion.div>
            </ErrorBoundary>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Re-export stub so old import path still resolves ─────────────────────────
export { FinalKitPanel as default };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DeployedHero({ url, runId }: { url: string; runId?: string }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/run/${runId}` : `/run/${runId}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl p-6 text-center bg-surface border border-border-accent shadow-glow-accent max-w-xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <Label className="text-accent uppercase tracking-widest text-label-xs">Your startup is live</Label>
        <span className="text-text-faint text-body-xs font-mono">{hostnameOf(url)}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="md" iconRight={<ExternalLink className="h-4 w-4" />}>
            Visit site
          </Button>
        </a>
        {runId && (
          <Button
            size="md"
            variant="secondary"
            onClick={handleCopyLink}
            iconLeft={
              copiedLink ? (
                <Check className="h-4 w-4 text-status-done" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )
            }
          >
            {copiedLink ? 'Link copied' : 'Copy share link'}
          </Button>
        )}
        {runId && (
          <a
            href={`/api/runs/${runId}/share.png`}
            target="_blank"
            rel="noopener noreferrer"
            download={`${runId}-share.png`}
          >
            <Button size="md" variant="secondary" iconLeft={<Share2 className="h-4 w-4" />}>
              Share card
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function AgentSection({
  title,
  description,
  agent,
}: {
  title: string;
  description: string;
  agent: Agent;
}) {
  const errored = agent.status === 'error';
  const hasFallback = errored && agent.finalArtifact !== undefined;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3 flex-wrap">
        <Heading level="headline-md" as="h3">{title}</Heading>
        <span className="text-body-sm text-text-faint">{description}</span>
        {hasFallback && <Chip tone="error">fallback</Chip>}
      </div>
      {errored && agent.error && (
        <p className="text-body-sm text-status-error font-mono">{agent.error}</p>
      )}
      {agent.finalArtifact !== undefined ? (
        <ArtifactRenderer agentId={agent.id} artifact={agent.finalArtifact} variant="detail" />
      ) : !errored ? (
        <p className="text-body-sm text-text-faint italic">No artifact produced.</p>
      ) : null}
    </section>
  );
}

function getDeployedUrl(artifact: unknown): string | null {
  if (typeof artifact !== 'object' || artifact === null) return null;
  const obj = artifact as Record<string, unknown>;
  if (typeof obj.liveUrl === 'string') return obj.liveUrl;
  if (typeof obj.deployedUrl === 'string') return obj.deployedUrl;
  return null;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'deployed site';
  }
}
