'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Link, Share2, Check } from 'lucide-react';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { Button, Chip, Heading, Label } from '@studio/ui';
import { BrandPreview } from './BrandPreview';
import ArtifactRenderer from './artifacts/ArtifactRenderer';

interface FinalKitModalProps {
  run: { agents: Record<AgentId, Agent> };
  open: boolean;
  onClose: () => void;
  runId?: string;
}

export default function FinalKitModal({ run, open, onClose, runId }: FinalKitModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const designer = run.agents['designer']?.finalArtifact;
  const developer = run.agents['developer']?.finalArtifact;
  const deployedUrl = getDeployedUrl(developer);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-overlay bg-bg/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div
            key="panel"
            className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="relative w-full max-w-page max-h-[90vh] overflow-y-auto pointer-events-auto bg-surface-raised border border-border rounded-xl"
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="overflow-hidden">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-raised">
                  <div className="flex items-center gap-3">
                    <Label>Launch kit</Label>
                    <Heading level="headline-md" as="h2">
                      Ready to ship
                    </Heading>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-md p-1.5 text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-micro"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-6 space-y-10">
                  {deployedUrl && (
                    <DeployedHero url={deployedUrl} runId={runId} />
                  )}

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
                        emoji={meta.emoji}
                        agent={agent}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function DeployedHero({ url, runId }: { url: string; runId?: string }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/run/${runId}` : `/run/${runId}`;
  const imageUrl = `/api/runs/${runId}/share.png`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl p-6 text-center bg-surface border border-border-accent shadow-glow-accent max-w-xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <Label className="text-accent uppercase tracking-widest text-[10px]">Your Startup is Live</Label>
        <span className="text-text-faint text-body-xs font-mono">{hostnameOf(url)}</span>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="md" trailingIcon={<ExternalLink className="h-4 w-4" />}>
            Visit Site
          </Button>
        </a>

        {runId && (
          <>
            <Button
              size="md"
              variant="secondary"
              onClick={handleCopyLink}
              leadingIcon={copiedLink ? <Check className="h-4 w-4 text-status-success" /> : <Link className="h-4 w-4" />}
            >
              {copiedLink ? 'Link Copied' : 'Copy Share Link'}
            </Button>

            <a href={imageUrl} target="_blank" rel="noopener noreferrer" download={`${runId}-share.png`}>
              <Button
                size="md"
                variant="secondary"
                leadingIcon={<Share2 className="h-4 w-4" />}
              >
                View Share Card
              </Button>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function AgentSection({
  title,
  description,
  emoji,
  agent,
}: {
  title: string;
  description: string;
  emoji: string;
  agent: Agent;
}) {
  const errored = agent.status === 'error';
  const hasFallback = errored && agent.finalArtifact !== undefined;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span aria-hidden className="text-xl">{emoji}</span>
        <Heading level="headline-md" as="h3">{title}</Heading>
        <span className="text-body-sm text-text-faint">· {description}</span>
        {hasFallback && <Chip tone="error">fallback</Chip>}
      </div>
      {errored && agent.error && (
        <p className="text-body-sm text-status-error font-mono">
          {agent.error}
        </p>
      )}
      {agent.finalArtifact !== undefined ? (
        <ArtifactRenderer agentId={agent.id} artifact={agent.finalArtifact} />
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
