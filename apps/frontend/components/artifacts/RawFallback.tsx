'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function RawFallback({ artifact }: Props): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-body-sm text-text-muted italic">
        Output ready but in an unexpected format.
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-mono text-label-sm text-text-faint hover:text-text transition-colors duration-micro"
      >
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-state ${open ? 'rotate-180' : ''}`}
        />
        {open ? 'Hide raw' : 'Show raw'}
      </button>
      {open && (
        <pre className="font-mono text-mono-sm text-text-muted bg-surface-sunken rounded-md p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all border border-border">
          {JSON.stringify(artifact, null, 2)}
        </pre>
      )}
    </div>
  );
}
