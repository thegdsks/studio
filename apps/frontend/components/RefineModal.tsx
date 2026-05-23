'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';

interface RefineModalProps {
  open: boolean;
  onClose(): void;
  agentName: string;
  currentScore?: number;
  currentCritique?: string;
  onSubmit(feedback: string): Promise<void>;
}

const PRESETS = [
  'More specific',
  'Shorter and punchier',
  'Different angle',
  'More technical detail',
  'Less corporate',
] as const;

const PLACEHOLDERS = [
  'More specific to dentists',
  'Less corporate, more punchy',
  'Include pricing details',
] as const;

export default function RefineModal({
  open,
  onClose,
  agentName,
  currentScore: _currentScore,
  currentCritique,
  onSubmit,
}: RefineModalProps) {
  const [feedback, setFeedback] = useState('');
  const [inFlight, setInFlight] = useState(false);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setFeedback('');
      setInFlight(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !inFlight) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, inFlight, onClose]);

  if (!open) return null;

  async function handleSubmit() {
    if (!feedback.trim() || inFlight) return;
    setInFlight(true);
    try {
      await onSubmit(feedback.trim());
    } finally {
      setInFlight(false);
    }
  }

  function handlePreset(preset: string) {
    setFeedback(preset);
    textareaRef.current?.focus();
  }

  function handleBackdropClick() {
    if (!inFlight) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Refine ${agentName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[11px] text-text-faint tracking-widest">[ REFINE ]</span>
            <span className="text-text font-display text-sm font-medium truncate">{agentName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={inFlight}
            className="flex items-center justify-center h-7 w-7 rounded text-text-faint hover:text-text hover:bg-surface-raised transition-colors duration-75 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-4">
          {currentCritique && (
            <div className="border-l-2 border-status-warn pl-3">
              <p className="text-[12px] text-text-muted leading-relaxed">
                The editor said: &quot;{currentCritique}&quot;
              </p>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            disabled={inFlight}
            rows={4}
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm text-text placeholder:text-text-faint resize-none focus:outline-none focus:border-border-strong disabled:opacity-50 font-mono leading-relaxed"
            aria-label="What should the agent do differently?"
          />

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                disabled={inFlight}
                className="px-2.5 py-1 rounded-full border border-border text-[11px] font-mono text-text-muted hover:border-border-strong hover:text-text hover:bg-surface-raised transition-colors duration-75 disabled:opacity-40"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={inFlight}
            className="px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-75 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!feedback.trim() || inFlight}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-sm font-medium text-bg hover:opacity-90 transition-opacity duration-75 disabled:opacity-40"
          >
            {inFlight ? (
              <span
                className="h-3.5 w-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin shrink-0"
                aria-hidden
              />
            ) : (
              <Send className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            Re-run with feedback
          </button>
        </div>
      </div>
    </div>
  );
}
