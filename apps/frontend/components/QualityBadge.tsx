'use client';

import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface QualityBadgeProps {
  score?: number;
  critique?: string;
}

export default function QualityBadge({ score, critique }: QualityBadgeProps) {
  if (score === undefined) {
    return (
      <span
        className="inline-flex items-center h-5 w-8 rounded animate-pulse bg-surface-raised"
        aria-hidden
      />
    );
  }

  if (score === 0) {
    return (
      <span
        className="inline-flex items-center h-5 font-mono text-[11px] text-text-faint"
        title={critique}
      >
        [ N/A ]
      </span>
    );
  }

  if (score >= 80) {
    return (
      <span
        className="inline-flex items-center gap-1 h-5 font-mono text-[11px] text-status-done"
        title={critique}
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
        [ {score} ]
      </span>
    );
  }

  if (score >= 60) {
    return (
      <span
        className="inline-flex items-center gap-1 h-5 font-mono text-[11px] text-status-warn"
        title={critique}
      >
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
        [ {score} ]
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 h-5 font-mono text-[11px] text-status-error"
      title={critique}
    >
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
      [ {score} ]
    </span>
  );
}
