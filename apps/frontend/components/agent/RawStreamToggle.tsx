'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-text-faint hover:text-text transition-colors duration-micro w-full text-left"
      >
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-state ${expanded ? 'rotate-180' : ''}`}
        />
        <span className="font-mono text-label-sm">{expanded ? 'Hide raw' : 'Show raw'}</span>
      </button>
      {expanded && (
        <div
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
