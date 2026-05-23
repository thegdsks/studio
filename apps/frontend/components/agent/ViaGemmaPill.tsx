'use client';

import { ShieldCheck } from 'lucide-react';

export function ViaGemmaPill() {
  return (
    <span
      title="This agent ran locally on Gemma 4 E4B, not in the cloud."
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-border-accent bg-accent-soft text-accent font-mono text-label-sm uppercase tracking-wider"
    >
      <ShieldCheck className="h-3 w-3" />
      via Gemma
    </span>
  );
}
