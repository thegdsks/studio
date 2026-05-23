'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Download, Check } from 'lucide-react';
import DeveloperArtifact from '@/components/artifacts/DeveloperArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadHTML, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface DeveloperShape {
  liveUrl?: string;
  html?: string;
  deployedAt?: string;
  deployedUrl?: string;
}

function isDeveloper(a: unknown): a is DeveloperShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return 'liveUrl' in o || 'html' in o || 'deployedAt' in o || 'deployedUrl' in o;
}

type ViewTab = 'preview' | 'source';

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function DeveloperDetail({ agent, metadata }: Props) {
  const [tab, setTab] = useState<ViewTab>('preview');
  const [copied, setCopied] = useState(false);

  const art = agent.finalArtifact;
  const data = isDeveloper(art) ? art : null;
  // Prefer agent.deploy_url (from SSE meta event) over artifact.liveUrl
  const liveUrl = agent.deploy_url ?? data?.liveUrl ?? data?.deployedUrl;
  const html = data?.html;

  async function handleCopyUrl() {
    if (!liveUrl) return;
    await copyToClipboard(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttons: ActionButton[] = [
    ...(liveUrl
      ? [
          {
            label: 'Open live site',
            icon: ExternalLink,
            variant: 'primary' as const,
            onClick: () => window.open(liveUrl, '_blank', 'noopener,noreferrer'),
          } satisfies ActionButton,
          {
            label: 'Copy URL',
            icon: Copy,
            onClick: () => void copyToClipboard(liveUrl),
          } satisfies ActionButton,
          {
            label: 'Share site URL',
            icon: Copy,
            onClick: () => void copyToClipboard(liveUrl),
          } satisfies ActionButton,
        ]
      : []),
    ...(html
      ? [
          {
            label: 'Download HTML',
            icon: Download,
            onClick: () => downloadHTML('site.html', html),
          } satisfies ActionButton,
        ]
      : []),
  ];

  const nextSteps = [
    'Point your custom domain at this Cloudflare Pages URL.',
    'Add Google Analytics.',
    'Set up a 404 page.',
  ];

  const tabs: { id: ViewTab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'source', label: 'HTML source' },
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        {liveUrl && (
          <section className="rounded-lg border border-border-accent bg-surface-raised p-4 flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-accent shrink-0" aria-hidden />
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 font-mono text-mono-sm text-accent truncate hover:underline"
            >
              {liveUrl}
            </a>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              aria-label="Copy deployment URL"
              className="shrink-0 p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
            >
              {copied
                ? <Check className="h-4 w-4 text-success" aria-hidden />
                : <Copy className="h-4 w-4" aria-hidden />}
            </button>
          </section>
        )}

        <DeveloperArtifact artifact={art} />

        {(liveUrl || html) && (
          <section className="space-y-4">
            <div className="flex gap-0 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors duration-micro -mb-px ${
                    tab === t.id
                      ? 'border-border-accent text-accent'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'preview' && liveUrl && (
              <div className="border border-border rounded-lg overflow-hidden">
                <iframe
                  src={liveUrl}
                  title="Live site full preview"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-[600px] bg-surface-sunken"
                />
              </div>
            )}

            {tab === 'source' && html && (
              <div className="rounded-lg border border-border bg-surface-sunken">
                <pre className="font-mono text-mono-sm text-text-muted p-4 overflow-auto max-h-[600px] whitespace-pre-wrap break-all">
                  {html}
                </pre>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
