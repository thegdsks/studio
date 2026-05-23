'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button, Heading, Label, VStack } from '@studio/ui';
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 -top-32 h-[520px] pointer-events-none"
        style={{ backgroundImage: 'var(--gradient-bloom)' }}
      />

      <VStack gap="8" align="center" className="relative w-full max-w-prose z-10">
        <VStack gap="2" align="center">
          <Label>Mission control</Label>
          <Heading level="display-md" className="text-center">
            Nine specialists, one launch.
          </Heading>
          <p className="text-body-md text-text-muted text-center max-w-sm">
            One sentence in. A complete launch kit out — brand, copy, deployed site, prospects, legal — in five minutes.
          </p>
        </VStack>

        <form onSubmit={handleSubmit} className="w-full">
          <VStack gap="4">
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
                w-full resize-none rounded-lg
                bg-surface-sunken text-text placeholder:text-text-faint
                border border-border
                px-4 py-3.5 text-body-md leading-relaxed
                focus:outline-none focus:border-border-primary
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors duration-state ease-ease
              "
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={idea.trim() === ''}
                isLoading={loading}
                trailingIcon={<ArrowRight className="h-4 w-4" />}
              >
                {loading ? 'Launching' : 'Launch'}
              </Button>
            </div>

            {error && <p className="text-body-sm text-error text-center">{error}</p>}
          </VStack>
        </form>

        <ExampleChips onSelect={(example) => setIdea(example)} />
      </VStack>
    </main>
  );
}
