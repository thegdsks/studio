'use client';

import { useState, useCallback, useEffect, type RefObject, type KeyboardEvent } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button, Card, ErrorBoundary, useRetry, usePrefersReducedMotion } from '@studio/ui';
import { createRun } from '@/lib/api';
import { useRouter } from 'next/navigation';

const SUGGESTIONS = [
  'dentist referral tool that books appointments via AI',
  'indie gamedev co-pilot for level design feedback',
  'ceramic studio rental marketplace with waitlist',
  'standup summariser bot that posts to Slack',
  'creator payment rails with auto invoicing',
  'neighbourhood noise complaint tracker with analytics',
  'meal-prep planner based on fridge contents photo',
  'voice-memo to structured meeting notes converter',
  'dog-walking route optimiser for small teams',
  'coding interview prep coach with real-time hints',
] as const;

const CHIP_EXAMPLES = SUGGESTIONS.slice(0, 5);

const CYCLING_PLACEHOLDERS = [
  'describe an idea, a frustration, or a feature to ship',
  'what problem keeps you up at night?',
  'what would you build if you had nine specialists?',
] as const;

function getBestSuggestion(input: string): string | null {
  const trimmed = input.trimStart();
  if (!trimmed) return null;
  const match = SUGGESTIONS.find((s) => s.toLowerCase().startsWith(trimmed.toLowerCase()));
  return match ? match.slice(trimmed.length) : null;
}

function useCyclingPlaceholder(active: boolean): string {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active || reduced) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % CYCLING_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [active, reduced]);

  return CYCLING_PLACEHOLDERS[idx] as string;
}

export interface IdeaInputProps {
  idea: string;
  onIdeaChange: (v: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: (v: boolean) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

function IdeaInputInner({ idea, onIdeaChange, textareaRef }: Pick<IdeaInputProps, 'idea' | 'onIdeaChange' | 'textareaRef'>) {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const hasText = idea.trim().length > 0;
  const ghost = getBestSuggestion(idea);
  const placeholder = useCyclingPlaceholder(!hasText);

  const { run, state: retryState, error: retryError, reset: resetRetry } = useRetry(
    useCallback(() => createRun(idea.trim()), [idea]),
    { maxAttempts: 2, backoffMs: 600 },
  );

  const isLoading = retryState === 'pending';

  async function handleSubmit() {
    if (!idea.trim() || isLoading) return;
    resetRetry();
    try {
      const { run_id } = await run();
      router.push(`/run/${run_id}`);
    } catch {
      // retryError state already surfaced in UI below
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') { onIdeaChange(''); return; }
    if (e.key === 'Tab' && ghost) { e.preventDefault(); onIdeaChange(idea + ghost); return; }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSubmit(); }
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="relative">
        {/* Ambient glow — runtime-computed radial, cannot be Tailwind */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none -z-10"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '640px', height: '420px', background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
        />

        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
          <Card
            surface="glass"
            lift
            className={['min-h-[176px] relative overflow-hidden transition-[border-color] duration-[80ms] ease-linear', focused ? 'border-accent/40' : ''].join(' ')}
          >
            {/* Ghost-text overlay (aria-hidden mirror of textarea + suffix) */}
            <div
              aria-hidden="true"
              className="absolute top-0 inset-x-0 pointer-events-none select-none font-mono text-mono-md leading-relaxed px-5 pt-5 pb-16 whitespace-pre-wrap break-words"
            >
              <span className="invisible">{idea}</span>
              {ghost && <span className="text-text-faint opacity-50">{ghost}</span>}
            </div>

            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => { resetRetry(); onIdeaChange(e.target.value); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              rows={4}
              autoFocus
              disabled={isLoading}
              aria-label="Describe your idea"
              className="relative z-10 w-full resize-none bg-transparent font-mono text-mono-md leading-relaxed text-text placeholder:text-text-faint px-5 pt-5 pb-16 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />

            <div className="absolute bottom-0 inset-x-0 px-4 pb-3.5 flex items-end justify-between gap-3 z-10">
              <div className="flex flex-wrap gap-1.5">
                {CHIP_EXAMPLES.map((ex) => (
                  <Button key={ex} type="button" variant="ghost" size="sm"
                    onClick={() => { onIdeaChange(ex); textareaRef.current?.focus(); }}
                    className="font-mono text-label-sm uppercase tracking-[0.4px] h-7 px-2"
                  >
                    {ex}
                  </Button>
                ))}
              </div>
              <Button
                type="submit" variant="primary" size="xl"
                disabled={!hasText || isLoading} loading={isLoading} glow={hasText}
                kbd="⌘ ↵" iconRight={!isLoading ? <ArrowRight size={18} /> : undefined}
                className="shrink-0"
              >
                Launch run
              </Button>
            </div>
          </Card>
        </form>
      </div>

      {retryState === 'error' && retryError && (
        <Card surface="lifted" tone="error" className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-mono-sm text-status-error break-words">{retryError.message}</span>
            <Button variant="secondary" size="sm" iconLeft={<RotateCcw size={14} />} onClick={() => void handleSubmit()}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {ghost && focused && (
        <p className="font-mono text-label-sm text-text-faint text-center tracking-[0.3em] uppercase">
          Tab to accept suggestion
        </p>
      )}
    </div>
  );
}

export function IdeaInput(props: IdeaInputProps) {
  return (
    <ErrorBoundary label="IdeaInput">
      <IdeaInputInner idea={props.idea} onIdeaChange={props.onIdeaChange} textareaRef={props.textareaRef} />
    </ErrorBoundary>
  );
}
