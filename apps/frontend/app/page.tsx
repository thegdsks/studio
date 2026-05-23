'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/landing/TopBar';
import { IdeaInput } from '@/components/landing/IdeaInput';
import { AgentRosterPreview } from '@/components/landing/AgentRosterPreview';
import { createRun } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <TopBar privacyMode={privacyMode} onTogglePrivacy={setPrivacyMode} />

      <main className="flex-1 flex flex-col items-center justify-center gap-12 pt-24 pb-16 px-4">
        {/* One-line product label */}
        <p className="font-mono text-label-sm text-text-faint uppercase tracking-[0.35em]">
          MISSION CONTROL FOR NINE SPECIALISTS
        </p>

        {/* Hero: the input */}
        <IdeaInput
          idea={idea}
          onIdeaChange={setIdea}
          loading={loading}
          error={error}
          privacyMode={privacyMode}
          onTogglePrivacy={setPrivacyMode}
          onSubmit={handleSubmit}
          textareaRef={textareaRef}
        />

        {/* Ghost agent grid */}
        <AgentRosterPreview />
      </main>
    </div>
  );
}
