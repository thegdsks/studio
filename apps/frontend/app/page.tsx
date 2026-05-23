'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Play, Settings } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TopBar,
  Breadcrumbs,
  PageHeader,
  Button,
  ErrorBoundary,
} from '@studio/ui';
import { IdeaInput } from '@/components/landing/IdeaInput';
import { AgentRosterPreview } from '@/components/landing/AgentRosterPreview';
import { LandingStatusBar } from '@/components/landing/LandingStatusBar';
import SettingsMenu from '@/components/SettingsMenu';
import { startDemoRun } from '@/lib/api';

// ─── Brand slot ───────────────────────────────────────────────────────────────

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-mono-sm text-text uppercase tracking-[0.375em]">STUDIO</span>
      <span className="font-mono text-label-sm text-text-faint border border-border rounded-sm px-1.5 py-0.5">
        [v0.1]
      </span>
    </div>
  );
}

// ─── Meta row slot ────────────────────────────────────────────────────────────

function ReadyMeta() {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-status-done" />
      <span className="font-mono text-label-sm text-text-faint uppercase tracking-[0.3em]">
        9 specialists ready
      </span>
    </div>
  );
}

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
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const topBarActions = (
    <div className="flex items-center gap-1 relative">
      <span
        className="font-mono text-label-sm text-text-faint border border-border rounded-sm px-2 min-h-[40px] flex items-center select-none"
        aria-label="Press Cmd K to open command palette"
      >
        Cmd K
      </span>
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setSettingsOpen((v) => !v)}
        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors duration-micro"
      >
        <Settings size={16} aria-hidden="true" />
      </button>
      <SettingsMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        privacyMode={privacyMode}
        onTogglePrivacy={setPrivacyMode}
      />
    </div>
  );

  return (
    <ErrorBoundary label="landing">
      {/* Suspense wrapper required for useSearchParams in Next.js 14 app router */}
      <Suspense fallback={null}>
        <DemoLauncher onLoading={setDemoLoading} onError={setDemoError} />
      </Suspense>

      <div className="min-h-screen flex flex-col bg-bg text-text">
        <TopBar
          brand={<Brand />}
          center={
            <Breadcrumbs
              items={[
                { label: 'STUDIO', href: '/' },
                { label: 'LAUNCH' },
              ]}
            />
          }
          actions={topBarActions}
          meta={<ReadyMeta />}
        />

        <main className="flex-1 flex flex-col items-center justify-center gap-10 pt-20 pb-16 px-4">
          {/* Page hero */}
          <div className="w-full max-w-2xl">
            <PageHeader
              eyebrow="MISSION CONTROL FOR NINE SPECIALISTS"
              title="Pitch an idea. Watch nine specialists ship a real product."
              subtitle="Live agents. Real artifacts. Five minutes."
              divider={false}
              actions={
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
              }
            />
          </div>

          {/* Demo error — visible, never silently swallowed */}
          {demoError && (
            <p className="font-mono text-label-sm text-status-error max-w-2xl w-full">
              {demoError}
            </p>
          )}

          {/* Hero: the input */}
          <IdeaInput
            idea={idea}
            onIdeaChange={setIdea}
            privacyMode={privacyMode}
            onTogglePrivacy={setPrivacyMode}
            textareaRef={textareaRef}
          />

          {/* Ghost agent grid */}
          <AgentRosterPreview />
        </main>

        <LandingStatusBar />
      </div>
    </ErrorBoundary>
  );
}
