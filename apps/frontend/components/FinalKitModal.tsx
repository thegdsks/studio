'use client';

import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import type { Agent, AgentId } from '@studio/shared';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { Button, GlassPanel, Heading, Label } from '@studio/ui';
import { BrandPreview } from './BrandPreview';

interface FinalKitModalProps {
  run: { agents: Record<AgentId, Agent> };
  open: boolean;
  onClose: () => void;
}

export default function FinalKitModal({ run, open, onClose }: FinalKitModalProps) {
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
            className="fixed inset-0 z-overlay bg-bg/70 backdrop-blur-sm"
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
              className="relative w-full max-w-page max-h-[90vh] overflow-y-auto pointer-events-auto"
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassPanel className="overflow-hidden">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-glass backdrop-blur-glass">
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
                    <DeployedHero url={deployedUrl} />
                  )}

                  <BrandPreview artifact={designer} />

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
              </GlassPanel>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function DeployedHero({ url }: { url: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl p-6 text-center"
      style={{ backgroundImage: 'var(--gradient-bloom)' }}
    >
      <Label className="text-primary">Live site</Label>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <Button
          size="lg"
          trailingIcon={<ExternalLink className="h-4 w-4" />}
        >
          Open {hostnameOf(url)}
        </Button>
      </a>
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
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span aria-hidden className="text-xl">{emoji}</span>
        <Heading level="headline-md" as="h3">{title}</Heading>
        <span className="text-body-sm text-text-faint">— {description}</span>
      </div>
      {agent.status === 'error' ? (
        <p className="text-body-sm text-error">
          {agent.error ?? 'Agent encountered an error.'}
        </p>
      ) : agent.finalArtifact !== undefined ? (
        renderArtifact(agent.finalArtifact)
      ) : (
        <p className="text-body-sm text-text-faint italic">No artifact produced.</p>
      )}
    </section>
  );
}

function renderArtifact(artifact: unknown): ReactNode {
  if (artifact === null || artifact === undefined) {
    return <span className="text-text-faint italic">No artifact</span>;
  }
  if (typeof artifact === 'string') {
    return (
      <div className="space-y-2">
        {artifact.split(/\n\n+/).map((para, i) => (
          <p key={i} className="text-body-md text-text whitespace-pre-wrap">
            {para}
          </p>
        ))}
      </div>
    );
  }
  if (Array.isArray(artifact)) {
    return (
      <ul className="space-y-1">
        {artifact.map((item, i) => (
          <li key={i} className="text-body-md text-text flex gap-2">
            <span className="text-text-faint flex-shrink-0">—</span>
            <span>{typeof item === 'string' ? item : JSON.stringify(item, null, 2)}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <pre className="font-mono text-mono-sm text-text-muted bg-surface-sunken rounded-md p-3 overflow-auto whitespace-pre-wrap break-all border border-border">
      {JSON.stringify(artifact, null, 2)}
    </pre>
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
