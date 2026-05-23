'use client';

import { Download, Copy } from 'lucide-react';
import CopywriterArtifact from '@/components/artifacts/CopywriterArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadMarkdown, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface Feature {
  title: string;
  body: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface CopywriterShape {
  hero: { headline: string; sub: string };
  features: Feature[];
  faq: FaqItem[];
  cta?: string;
}

function isCopywriter(a: unknown): a is CopywriterShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.hero === 'object' &&
    o.hero !== null &&
    Array.isArray(o.features) &&
    Array.isArray(o.faq)
  );
}

function isFeature(x: unknown): x is Feature {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.title === 'string' && typeof o.body === 'string';
}

function isFaqItem(x: unknown): x is FaqItem {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.q === 'string' && typeof o.a === 'string';
}

function buildCopyMarkdown(data: CopywriterShape): string {
  return [
    '# Hero',
    '',
    '## Headline',
    data.hero.headline,
    '',
    '## Subheadline',
    data.hero.sub,
    '',
    '## Features',
    '',
    ...data.features.filter(isFeature).map((f) => `### ${f.title}\n${f.body}`),
    '',
    '## FAQ',
    '',
    ...data.faq.filter(isFaqItem).map((item) => `Q: ${item.q}\n\nA: ${item.a}`),
  ].join('\n');
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function CopywriterDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isCopywriter(art) ? art : null;

  const buttons: ActionButton[] = [
    {
      label: 'Download copy as Markdown',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!data) return;
        downloadMarkdown('launch-copy.md', buildCopyMarkdown(data));
      },
    },
    {
      label: 'Copy hero headline',
      icon: Copy,
      onClick: () => {
        if (!data) return;
        void copyToClipboard(data.hero.headline);
      },
    },
    {
      label: 'Copy all features',
      icon: Copy,
      onClick: () => {
        if (!data) return;
        const text = data.features
          .filter(isFeature)
          .map((f) => `${f.title}: ${f.body}`)
          .join('\n\n');
        void copyToClipboard(text);
      },
    },
    {
      label: 'Copy FAQ',
      icon: Copy,
      onClick: () => {
        if (!data) return;
        const text = data.faq
          .filter(isFaqItem)
          .map((item) => `Q: ${item.q}\nA: ${item.a}`)
          .join('\n\n');
        void copyToClipboard(text);
      },
    },
  ];

  const nextSteps = [
    'Paste this into your landing page.',
    'Adapt for cold email subject lines.',
    'Test 2-3 variants of the headline.',
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        <CopywriterArtifact artifact={art} />

        {data && (
          <section className="rounded-lg border border-border-accent bg-surface-raised p-5 space-y-2">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Tone of Voice
            </p>
            <p className="text-body-md text-text-muted">
              Copy is calibrated for{' '}
              {data.hero.headline.split(' ').length > 8 ? 'clarity and depth' : 'punchy impact'},
              written to convert skeptical founders and early adopters. Headline-driven, benefit-first, FAQ-assured.
            </p>
          </section>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
