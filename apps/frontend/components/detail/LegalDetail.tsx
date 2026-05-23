'use client';

import { useState } from 'react';
import { Download, Copy, AlertTriangle } from 'lucide-react';
import LegalArtifact from '@/components/artifacts/LegalArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadMarkdown, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface LegalShape {
  terms_of_service?: string;
  privacy_policy?: string;
  liability_summary?: string;
  termsMarkdown?: string;
  privacyMarkdown?: string;
}

function isLegal(a: unknown): a is LegalShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    'terms_of_service' in o || 'privacy_policy' in o ||
    'liability_summary' in o || 'termsMarkdown' in o || 'privacyMarkdown' in o
  );
}

function extractHeadings(md: string): { text: string; level: number }[] {
  return md
    .split('\n')
    .filter((line) => /^#+\s/.test(line))
    .map((line) => {
      const match = line.match(/^(#+)\s+(.*)/);
      if (!match || !match[1] || !match[2]) return null;
      return { level: match[1].length, text: match[2] };
    })
    .filter((h): h is { text: string; level: number } => h !== null);
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function LegalDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isLegal(art) ? art : null;

  const terms = data?.terms_of_service ?? data?.termsMarkdown ?? '';
  const privacy = data?.privacy_policy ?? data?.privacyMarkdown ?? '';

  const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy'>('terms');
  const activeContent = activeDoc === 'terms' ? terms : privacy;
  const headings = extractHeadings(activeContent);

  const buttons: ActionButton[] = [
    {
      label: 'Download Terms as Markdown',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!terms) return;
        downloadMarkdown('terms-of-service.md', terms);
      },
    },
    {
      label: 'Download Privacy as Markdown',
      icon: Download,
      onClick: () => {
        if (!privacy) return;
        downloadMarkdown('privacy-policy.md', privacy);
      },
    },
    {
      label: 'Copy current document',
      icon: Copy,
      onClick: () => {
        if (!activeContent) return;
        void copyToClipboard(activeContent);
      },
    },
  ];

  const nextSteps = [
    'Send to a lawyer for review (e.g., Atrium, Stripe Atlas, or LawTrades).',
    'Add the URLs to your site footer.',
    'Include a cookie banner if you will target EU users.',
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-6">
        {/* Disclaimer banner */}
        <div className="flex items-start gap-3 rounded-lg border border-status-running bg-surface-raised px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-status-running shrink-0 mt-0.5" />
          <p className="text-body-sm text-text-muted">
            AI-generated draft. Have a lawyer review before publishing.
          </p>
        </div>

        <LegalArtifact artifact={art} />

        {headings.length > 0 && (
          <section className="space-y-4">
            <div className="flex gap-0 border-b border-border">
              {(['terms', 'privacy'] as const).map((doc) => {
                const hasContent = doc === 'terms' ? !!terms : !!privacy;
                if (!hasContent) return null;
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setActiveDoc(doc)}
                    className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors duration-micro -mb-px ${
                      activeDoc === doc
                        ? 'border-border-accent text-accent'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    {doc === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                  </button>
                );
              })}
            </div>

            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Document Outline
            </p>
            <nav className="space-y-1">
              {headings.map((h, i) => (
                <div
                  key={i}
                  className="text-body-sm text-text-muted hover:text-text transition-colors duration-micro cursor-default"
                  style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                >
                  {h.text}
                </div>
              ))}
            </nav>
          </section>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
