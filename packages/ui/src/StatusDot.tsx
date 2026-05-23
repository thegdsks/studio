import { cn } from './cn.js';

export type StatusKind = 'queued' | 'running' | 'done' | 'error';

interface StatusDotProps {
  status: StatusKind;
  size?: number;
  className?: string;
}

const fg: Record<StatusKind, string> = {
  queued:  'bg-transparent border border-status-queued',
  running: 'bg-status-running animate-pulse-dot',
  done:    'bg-status-done',
  error:   'bg-status-error',
};

export function StatusDot({ status, size = 8, className }: StatusDotProps) {
  return (
    <span
      role="status"
      aria-label={status}
      className={cn('inline-block rounded-full shrink-0', fg[status], className)}
      style={{ width: size, height: size }}
    />
  );
}
