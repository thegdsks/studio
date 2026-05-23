'use client';

import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  StatusDot,
  staggerChildren,
  cardEnter,
  withReducedMotion,
  usePrefersReducedMotion,
} from '@studio/ui';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { AGENT_ICON } from '@/lib/agentIcons';

// 9 agents — director is the synthesiser, not shown in the pre-run roster
const ROSTER_IDS = AGENT_IDS.filter((id) => id !== 'director');

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
        {ROSTER_IDS.map((id) => {
          const Icon = AGENT_ICON[id];
          const meta = AGENT_REGISTRY[id];

          return (
            <motion.div key={id} variants={enter} className="opacity-30 hover:opacity-100 transition-opacity duration-[80ms] ease-linear group">
              <Card tone="idle" hover className="p-0">
                <CardHeader divided={false} className="px-3 py-2.5 flex-col items-start gap-1.5">
                  {/* Icon badge + status dot row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-label-sm text-text-faint">[</span>
                      <Icon className="h-3 w-3 text-text-muted" aria-hidden="true" />
                      <span className="font-mono text-label-sm text-text-faint">]</span>
                    </div>
                    <StatusDot status="queued" size={6} />
                  </div>

                  {/* Agent name */}
                  <span className="font-mono text-mono-sm text-text-muted uppercase tracking-[0.06em] leading-none">
                    {meta.name.toUpperCase()}
                  </span>

                  {/* Role description */}
                  <span className="text-body-sm text-text-faint leading-tight">
                    {meta.description}
                  </span>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
