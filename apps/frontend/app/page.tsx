'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Play } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PageHeader,
  Button,
  ErrorBoundary,
} from '@studio/ui';
import { IdeaInput, CHIP_EXAMPLES } from '@/components/landing/IdeaInput';
import { AgentRosterPreview } from '@/components/landing/AgentRosterPreview';
import { LandingStatusBar } from '@/components/landing/LandingStatusBar';
import { LandingTopBar } from '@/components/landing/LandingTopBar';
import { LastRunCard } from '@/components/landing/LastRunCard';
import { startDemoRun } from '@/lib/api';

// ─── Demo launcher — needs Suspense because it calls useSearchParams ──────────

interface DemoLauncherProps {
  onLoading: (v: boolean) => void;
  onError: (msg: string | null) => void;
}

function DemoLauncher({ onLoading, onError }: DemoLauncherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('demo') !== '1') return;
    onLoading(true);
    onError(null);
    startDemoRun()
      .then(({ run_id }) => router.push(`/run/${run_id}`))
      .catch((err: unknown) => {
        onError(err instanceof Error ? err.message : 'Demo run failed. Check fixture.');
        onLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [idea, setIdea] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

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
      ) return;
      e.preventDefault();
      textareaRef.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <ErrorBoundary label="landing">
      {/* Suspense wrapper required for useSearchParams in Next.js 14 app router */}
      <Suspense fallback={null}>
        <DemoLauncher onLoading={setDemoLoading} onError={setDemoError} />
      </Suspense>

      <div className="min-h-screen flex flex-col bg-bg text-text">
        <LandingTopBar
          privacyMode={privacyMode}
          onTogglePrivacy={setPrivacyMode}
        />

        <main className="flex-1 flex flex-col items-center justify-center gap-8 pt-20 pb-16 px-4">
          {/* Page hero — actions=null, button lives below subtitle */}
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <PageHeader
              eyebrow="MISSION CONTROL FOR NINE SPECIALISTS"
              title="Pitch an idea. Watch nine specialists ship a real product."
              subtitle="Live agents. Real artifacts. Five minutes."
              divider={false}
              actions={null}
            />
            <div>
              <Button
                variant="secondary"
                size="md"
                iconLeft={<Play size={16} />}
                disabled={demoLoading}
                loading={demoLoading}
                onClick={() => router.push('/?demo=1')}
              >
                Watch demo run
              </Button>
            </div>
          </div>

          {/* Demo error — visible, never silently swallowed */}
          {demoError && (
            <p className="font-mono text-label-sm text-status-error max-w-2xl w-full">
              {demoError}
            </p>
          )}

          {/* Hero: the input card */}
          <IdeaInput
            idea={idea}
            onIdeaChange={setIdea}
            privacyMode={privacyMode}
            onTogglePrivacy={setPrivacyMode}
            textareaRef={textareaRef}
          />

          {/* Example chips — horizontal scroll row below input */}
          <div className="w-full max-w-2xl flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CHIP_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setIdea(ex); textareaRef.current?.focus(); }}
                className="shrink-0 h-8 px-3 rounded-full border border-border font-mono text-label-sm uppercase tracking-[0.4px] text-text-faint hover:text-text-muted hover:border-border-strong transition-colors duration-[80ms] ease-linear whitespace-nowrap"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Ghost agent grid */}
          <AgentRosterPreview />

          {/* Last run mini-card — shows most recent run if any exist */}
          <LastRunCard />
        </main>

        <LandingStatusBar />
      </div>
    </ErrorBoundary>
  );
}
