'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent } from '@studio/shared';
import {
  slideUpPanel,
  fadeIn,
  withReducedMotion,
  usePrefersReducedMotion,
  ErrorBoundary,
  Label,
} from '@studio/ui';
import { DirectorReveal } from './DirectorReveal.js';
import type { DirectorBriefingData } from './DirectorReveal.js';

interface DirectorModalProps {
  open: boolean;
  onClose: () => void;
  agent: Agent | undefined;
}

function extractBriefing(agent: Agent): DirectorBriefingData | null {
  const artifact = agent.finalArtifact as Record<string, unknown> | null | undefined;
  if (!artifact) return null;
  const briefing = artifact['briefing'];
  if (!briefing || typeof briefing !== 'object') return null;
  return briefing as DirectorBriefingData;
}

export function DirectorModal({ open, onClose, agent }: DirectorModalProps) {
  const prefersReduced = usePrefersReducedMotion();
  const panelVariants = withReducedMotion(slideUpPanel, prefersReduced);
  const contentVariants = withReducedMotion(fadeIn, prefersReduced);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const briefing = agent ? extractBriefing(agent) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div
            ref={backdropRef}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="director-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Executive Briefing"
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <motion.div
              className="pointer-events-auto w-full max-w-3xl max-h-[88vh] flex flex-col bg-surface-raised border border-border-accent rounded-xl shadow-elev-3 overflow-hidden"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <Label className="text-label-sm tracking-widest uppercase text-text-faint">
                    Director
                  </Label>
                  <span className="font-mono text-mono-sm text-text font-medium">
                    Executive Briefing
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close briefing"
                  className="rounded-sm p-1.5 text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <ErrorBoundary label="director-briefing" onReset={onClose}>
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.06 }}
                  className="overflow-y-auto px-6 py-6"
                >
                  {briefing ? (
                    <DirectorReveal briefing={briefing} />
                  ) : (
                    <div className="flex flex-col gap-2 py-8 items-center text-center">
                      <Label className="text-text-muted">Briefing not available</Label>
                      <p className="text-body-sm text-text-faint">
                        The director has not produced a structured briefing for this run.
                      </p>
                    </div>
                  )}
                </motion.div>
              </ErrorBoundary>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
