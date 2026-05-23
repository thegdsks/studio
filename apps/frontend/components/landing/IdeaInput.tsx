'use client';

import { useState, type FormEvent, type RefObject } from 'react';
import { Button } from '@studio/ui';
import { PrivacyToggle } from '@/components/PrivacyToggle';

const EXAMPLES = [
  'dentist referral tool',
  'indie gamedev co-pilot',
  'ceramic studio rentals',
  'standup summariser bot',
  'creator payment rails',
] as const;

const PLACEHOLDER = 'describe an idea, a frustration, or a feature you want explored';

interface IdeaInputProps {
  idea: string;
  onIdeaChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  privacyMode: boolean;
  onTogglePrivacy: (v: boolean) => void;
  onSubmit: (e: FormEvent) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

export function IdeaInput({
  idea,
  onIdeaChange,
  loading,
  error,
  privacyMode,
  onTogglePrivacy,
  onSubmit,
  textareaRef,
}: IdeaInputProps) {
  const [focused, setFocused] = useState(false);
  const hasText = idea.trim().length > 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      onIdeaChange('');
      return;
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void onSubmit(e as unknown as FormEvent);
    }
  }

  function fillChip(example: string) {
    onIdeaChange(example);
    textareaRef.current?.focus();
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      {/* Ambient radial glow — absolutely positioned, still */}
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Input card */}
        <form onSubmit={onSubmit} className="w-full">
          <div
            className={[
              'relative w-full rounded-lg bg-surface-raised border',
              'transition-[border-color] duration-[80ms] ease-linear',
              focused ? 'border-border-accent' : 'border-border',
            ].join(' ')}
          >
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => onIdeaChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={PLACEHOLDER}
              rows={4}
              autoFocus
              disabled={loading}
              className="
                w-full resize-none bg-transparent
                text-text text-body-md leading-relaxed
                placeholder:text-text-faint font-mono text-mono-md
                px-5 pt-5 pb-16
                focus:outline-none
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />

            {/* Bottom strip: chips left, button right */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-3.5 flex items-end justify-between gap-3">
              {/* Example chips */}
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => fillChip(ex)}
                    className="
                      font-mono text-label-sm text-text-faint uppercase tracking-[0.4px]
                      border border-border rounded-sm px-2 py-0.5
                      hover:border-border-strong hover:text-text-muted
                      transition-[border-color,color] duration-[80ms] ease-linear
                    "
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Launch button */}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!hasText || loading}
                loading={loading}
                glow={hasText}
                kbd="⌘ ↵"
                className="shrink-0"
              >
                LAUNCH
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Inline error */}
      {error && (
        <p className="font-mono text-label-sm text-status-error">{error}</p>
      )}

      {/* Privacy toggle */}
      <div className="flex justify-center">
        <PrivacyToggle value={privacyMode} onChange={onTogglePrivacy} />
      </div>
    </div>
  );
}
