'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@studio/ui';

interface RawStreamToggleProps {
  text: string;
  stable: string;
  fading: string;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function RawStreamToggle({ text, stable, fading, scrollRef }: RawStreamToggleProps) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconLeft={
          expanded
            ? <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
            : <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
        }
        onClick={() => setExpanded((v) => !v)}
        className="w-full justify-start text-text-faint hover:text-text"
        aria-expanded={expanded}
        aria-controls="raw-stream-panel"
      >
        {expanded ? 'Hide raw' : 'Show raw'}
      </Button>

      {expanded && (
        <div
          id="raw-stream-panel"
          ref={scrollRef}
          className="mt-2 font-mono text-mono-sm text-text-muted bg-surface-sunken rounded-md p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all border border-border"
        >
          <span>{stable}</span>
          <motion.span
            key={fading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {fading}
          </motion.span>
        </div>
      )}
    </div>
  );
}
