import { Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from './cn.js';
import type { StatusKind } from './StatusDot.js';

const labels: Record<StatusKind, string> = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  error: 'Error',
};

const colors: Record<StatusKind, string> = {
  queued: 'text-text-faint',
  running: 'text-primary',
  done: 'text-success',
  error: 'text-error',
};

interface StatusBadgeProps {
  status: StatusKind;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-label-sm font-mono uppercase tracking-wider', colors[status], className)}>
      <StatusIcon status={status} />
      <span>{labels[status]}</span>
    </span>
  );
}

function StatusIcon({ status }: { status: StatusKind }) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case 'done':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'error':
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case 'queued':
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}
