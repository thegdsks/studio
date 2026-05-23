'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  StatusDot,
  staggerChildren,
  cardEnter,
  withReducedMotion,
  usePrefersReducedMotion,
} from '@studio/ui';
import { AGENT_IDS, AGENT_REGISTRY, type AgentId } from '@studio/shared';
import { AGENT_ICON } from '@/lib/agentIcons';

// ─── Constants ────────────────────────────────────────────────────────────────

// Director is the synthesiser — not shown in pre-run roster
const ROSTER_IDS = AGENT_IDS.filter((id) => id !== 'director');

// Zero-padded bracket badge e.g. [01]
function ordinalBadge(n: number): string {
  return `[${String(n + 1).padStart(2, '0')}]`;
}

// ─── Agent tile ───────────────────────────────────────────────────────────────

interface AgentTileProps {
  id: AgentId;
  ordinal: number;
}

function AgentTile({ id, ordinal }: AgentTileProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_REGISTRY[id];
  const Icon = AGENT_ICON[id];

  if (!meta) return null;

  return (
    <div className="flex flex-col">
      <Card
        as="button"
        surface="glass"
        lift
        interactive
        affordance={expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${meta.name} — ${meta.description}. ${expanded ? 'Collapse' : 'Expand'} details.`}
        className="p-0 text-left opacity-40 hover:opacity-100 transition-opacity duration-[80ms] ease-linear w-full"
      >
        <CardHeader divided={false} className="px-3 py-2.5 flex-col items-start gap-1.5">
          {/* Badge + icon row */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-label-sm text-text-faint">{ordinalBadge(ordinal)}</span>
              <Icon className="h-3 w-3 text-text-muted" aria-hidden="true" />
            </div>
            <StatusDot status="queued" />
          </div>

          {/* Agent name */}
          <span className="font-mono text-mono-sm text-text-muted uppercase tracking-[0.06em] leading-none">
            {meta.name.toUpperCase()}
          </span>

          {/* Role blurb */}
          <span className="text-body-sm text-text-faint leading-tight">
            {meta.description}
          </span>
        </CardHeader>
      </Card>

      {/* Inline expanded detail strip — slides down, stays in place */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <Card surface="lifted" className="rounded-t-none border-t-0 px-3 py-2.5">
              <CardBody className="px-0 py-0">
                <p className="text-body-sm text-text-muted">
                  {meta.description}
                </p>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

export function AgentRosterPreview() {
  const reducedMotion = usePrefersReducedMotion();
  const stagger = withReducedMotion(staggerChildren, reducedMotion);
  const enter = withReducedMotion(cardEnter, reducedMotion);

  return (
    <div className="w-full max-w-2xl">
      {/* Section label */}
      <div className="mb-3 px-1">
        <span className="font-mono text-label-sm text-text-faint uppercase tracking-[0.4em]">
          SPECIALISTS
        </span>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-3"
      >
        {ROSTER_IDS.map((id, i) => (
          <motion.div key={id} variants={enter}>
            <AgentTile id={id} ordinal={i} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
