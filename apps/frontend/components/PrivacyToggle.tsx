'use client';

import { Info, ShieldCheck } from 'lucide-react';
import { useId, useState } from 'react';
import { Label } from '@studio/ui';

interface PrivacyToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
}

/**
 * Subtle "Privacy Mode" toggle for the landing page. Power-user option —
 * styled small + muted so it doesn't compete with the primary CTA.
 *
 * When ON, the orchestrator routes Strategist + Legal to local Gemma 4
 * (`gemma4:e4b` via Ollama) before falling back to cloud Gemini.
 */
export function PrivacyToggle({ value, onChange }: PrivacyToggleProps) {
  const tooltipId = useId();
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 text-text-muted">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={[
            'relative inline-flex h-5 w-9 shrink-0 rounded-full',
            'border border-border transition-colors duration-state',
            value ? 'bg-accent' : 'bg-surface-sunken',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 inline-block h-3.5 w-3.5 rounded-full bg-text',
              'transition-transform duration-state',
              value ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')}
          />
        </button>

        <span className="text-body-sm flex items-center gap-1.5">
          Privacy mode
          <button
            type="button"
            aria-describedby={tooltipId}
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
            className="text-text-faint hover:text-text-muted transition-colors duration-micro"
          >
            <Info className="h-3.5 w-3.5" />
            <span className="sr-only">What is privacy mode?</span>
          </button>
        </span>
      </div>

      {showTip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="max-w-sm text-center text-body-sm text-text-faint"
        >
          Legal docs and strategy run on Gemma&nbsp;4 locally. Your sensitive
          data never leaves your machine.
        </div>
      )}

      {value && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-accent bg-accent-soft text-accent">
          <ShieldCheck className="h-3.5 w-3.5" />
          <Label className="text-accent">Strategist + Legal · local Gemma 4</Label>
        </div>
      )}
    </div>
  );
}
