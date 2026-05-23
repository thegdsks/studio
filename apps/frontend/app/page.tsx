'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Settings, Terminal, Command } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { AGENT_IDS, AGENT_REGISTRY } from '@studio/shared';
import { AGENT_ICON } from '@/lib/agentIcons';
import { createRun } from '@/lib/api';

const PLACEHOLDERS = [
  'a tool for dentists to manage referrals',
  'AI co-pilot for indie game devs',
  'marketplace for ceramic studio rentals',
  'a Slack bot that summarises engineering standups',
  'Stripe alternative for content creators',
];

const EXAMPLES = [
  'a tool for dentists to manage referrals',
  'AI co-pilot for indie game devs',
  'marketplace for ceramic studio rentals',
];

// Show 9 agents (exclude director from landing roster)
const ROSTER_IDS = AGENT_IDS.filter((id) => id !== 'director').slice(0, 9);

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder every 3 s, freeze when focused or typing
  useEffect(() => {
    if (isFocused || idea) return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [isFocused, idea]);

  // Global "/" shortcut focuses textarea
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/') return;
      const target = e.target as Element;
      if (
        target === textareaRef.current ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.hasAttribute('contenteditable')
      )
        return;
      e.preventDefault();
      textareaRef.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed) {
      textareaRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { run_id } = await createRun(trimmed, { privacy_mode: privacyMode });
      router.push(`/run/${run_id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      );
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      setIdea('');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as FormEvent);
    }
  }

  const placeholder = `Describe your startup idea. Like ${PLACEHOLDERS[placeholderIdx]}`;

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* ── Sticky top bar ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-11 flex items-center justify-between px-4 bg-surface border-b border-border">
        {/* Left: wordmark */}
        <span className="font-mono text-mono-sm text-text uppercase tracking-wider">
          STUDIO · MISSION CONTROL
        </span>

        {/* Right: chips + icons */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-label-sm text-text-muted border border-border rounded-sm px-2 py-0.5">
            [ 9 AGENTS · IDLE ]
          </span>
          <span className="font-mono text-label-sm text-text-muted border border-border rounded-sm px-2 py-0.5">
            [ COST $0.00 ]
          </span>
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Settings"
              className="p-1 rounded-sm hover:bg-surface-raised transition-colors"
            >
              <Settings className="h-4 w-4 text-text-muted hover:text-text" />
            </button>
            <button
              type="button"
              aria-label="Terminal"
              className="p-1 rounded-sm hover:bg-surface-raised transition-colors"
            >
              <Terminal className="h-4 w-4 text-text-muted hover:text-text" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4">
        <div className="w-full max-w-page flex flex-col items-center gap-12">

          {/* Hero section */}
          <div className="w-full max-w-prose flex flex-col gap-6">
            {/* Mission briefing label */}
            <div className="flex items-center gap-2">
              <span className="text-label-sm text-accent font-mono uppercase tracking-wider">
                &#9655; MISSION BRIEFING
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-display-md font-display tracking-tight text-text leading-tight">
              Ship a complete startup in five minutes.
            </h1>

            {/* Subhead */}
            <p className="text-body-md text-text-muted leading-relaxed max-w-prose">
              Nine specialist agents work in parallel. Brand, copy, deployed
              site, prospects, legal. Type one sentence.
            </p>

            {/* Textarea form */}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative w-full border border-border rounded-sm bg-surface-sunken focus-within:border-border-accent transition-colors">
                <textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  rows={4}
                  autoFocus
                  disabled={loading}
                  className="
                    w-full resize-none bg-transparent text-text
                    placeholder:text-text-faint text-body-md leading-relaxed
                    px-4 pt-3.5 pb-14
                    focus:outline-none
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                />
                {/* Launch button anchored bottom-right inside container */}
                <button
                  type="submit"
                  disabled={idea.trim() === '' || loading}
                  className="
                    absolute bottom-3 right-3
                    bg-accent text-text-on-accent
                    font-mono text-label-sm uppercase tracking-wider
                    px-4 py-2 rounded-sm
                    hover:bg-accent/90 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center
                  "
                >
                  {loading ? (
                    <span>[ LAUNCHING ]</span>
                  ) : (
                    <>
                      LAUNCH
                      <ArrowRight className="h-4 w-4 ml-2 inline" />
                    </>
                  )}
                </button>
              </div>

              {/* Keyboard hint */}
              <p className="mt-2 font-mono text-label-sm text-text-faint">
                enter to launch · esc to clear
              </p>

              {/* Privacy mode (subtle power-user toggle) */}
              <div className="mt-4">
                <PrivacyToggle value={privacyMode} onChange={setPrivacyMode} />
              </div>

              {/* Inline error */}
              {error && (
                <p className="mt-2 text-body-sm text-status-error">{error}</p>
              )}
            </form>

            {/* TRY chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-label-sm text-text-muted uppercase tracking-wider">
                TRY:
              </span>
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setIdea(example);
                    textareaRef.current?.focus();
                  }}
                  className="
                    font-mono text-label-sm text-text-muted
                    border border-border rounded-sm px-2 py-1
                    hover:border-border-strong hover:text-text
                    transition-colors
                  "
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Agent roster module */}
          <div className="w-full max-w-prose border border-border rounded-sm">
            {/* Module header */}
            <div className="px-4 py-2.5 border-b border-border">
              <span className="font-mono text-label-sm text-text-muted uppercase tracking-wider">
                [ SPECIALISTS · 9 IDLE ]
              </span>
            </div>

            {/* 3x3 grid (2 cols on mobile) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
              {ROSTER_IDS.map((id) => {
                const Icon = AGENT_ICON[id];
                const meta = AGENT_REGISTRY[id];
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 border border-border rounded-sm p-2 bg-surface-sunken"
                  >
                    <Icon className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span className="font-mono text-mono-sm text-text uppercase tracking-wider flex-grow truncate">
                      {meta.name.toUpperCase()}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-text-faint shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ── Sticky bottom bar ── */}
      <footer className="fixed bottom-0 inset-x-0 z-50 h-8 flex items-center justify-between px-4 bg-surface border-t border-border">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-status-done" />
          <span className="font-mono text-label-sm text-text-muted uppercase tracking-wider">
            READY
          </span>
        </div>

        {/* Command palette hint */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-label-sm text-text-muted border border-border rounded-sm px-2 py-0.5 flex items-center gap-1">
            <Command className="h-3 w-3" />
            K
          </span>
          <span className="font-mono text-label-sm text-text-faint">
            command palette
          </span>
        </div>
      </footer>
    </div>
  );
}
