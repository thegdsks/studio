'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createRun } from '@/lib/api';
import ExampleChips from '@/components/ExampleChips';

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const { run_id } = await createRun(trimmed);
      router.push(`/run/${run_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        {/* Logo / wordmark */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-bold tracking-tight text-slate-100">
            Studio
          </h1>
          <p className="text-lg text-slate-400 text-center">
            One sentence in.&nbsp; A complete launch kit out.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your startup idea in one sentence…"
              rows={2}
              autoFocus
              disabled={loading}
              className="
                w-full resize-none rounded-xl border border-slate-800
                bg-slate-900 px-4 py-3.5 text-slate-100 placeholder-slate-500
                text-base leading-relaxed
                focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/60
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors
              "
            />
          </div>

          <button
            type="submit"
            disabled={loading || idea.trim() === ''}
            className="
              self-end flex items-center gap-2
              rounded-xl bg-sky-500 hover:bg-sky-400
              px-6 py-3 text-sm font-semibold text-slate-950
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-sky-400/50
            "
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                Launching…
              </>
            ) : (
              'Launch →'
            )}
          </button>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
        </form>

        {/* Example chips */}
        <ExampleChips onSelect={(example) => setIdea(example)} />
      </div>
    </main>
  );
}
