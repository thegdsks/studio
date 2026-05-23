'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Label } from '@studio/ui';
import RawFallback from './RawFallback';

interface DeveloperShape {
  liveUrl?: string;
  html?: string;
  deployedAt?: string;
  deployedUrl?: string;
  deploy_url?: string;
}

function isDeveloper(a: unknown): a is DeveloperShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return 'liveUrl' in o || 'html' in o || 'deployedAt' in o || 'deployedUrl' in o || 'deploy_url' in o;
}

function formatDeployedAt(val: string): string {
  try {
    return new Date(val).toLocaleString();
  } catch {
    return val;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text transition-colors duration-micro font-mono"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-status-done" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function LiveUrlCta({ liveUrl, deployedAt }: { liveUrl: string; deployedAt?: string }) {
  return (
    <div className="rounded-xl border border-border-accent bg-surface p-6 text-center space-y-3">
      <p className="font-mono text-mono-md text-text break-all text-headline-md">{liveUrl}</p>
      <a
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-body-md font-semibold text-bg hover:opacity-90 transition-opacity"
      >
        Open live site
        <ExternalLink className="h-4 w-4" />
      </a>
      {deployedAt && (
        <p className="font-mono text-mono-sm text-text-faint">
          Deployed {formatDeployedAt(deployedAt)}
        </p>
      )}
    </div>
  );
}

// ─── Card variant ─────────────────────────────────────────────────────────────

function CardView({ html, deployedAt, liveUrl, deployedUrl, deploy_url }: DeveloperShape) {
  const [copied, setCopied] = useState(false);
  const resolvedUrl = liveUrl ?? deployedUrl ?? deploy_url;

  const handleCopy = () => {
    if (!html) return;
    void navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {resolvedUrl && <LiveUrlCta liveUrl={resolvedUrl} deployedAt={deployedAt} />}

      {resolvedUrl && (
        <div className="border border-border rounded-lg overflow-hidden">
          <iframe
            src={resolvedUrl}
            title="Live site preview"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-96 bg-surface-sunken"
          />
        </div>
      )}

      {!resolvedUrl && html && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Generated HTML
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text transition-colors duration-micro font-mono"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-status-done" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy HTML
                </>
              )}
            </button>
          </div>
          <pre className="font-mono text-mono-sm text-text-muted bg-surface-sunken rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap break-all border border-border">
            {html}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Detail variant ───────────────────────────────────────────────────────────

function DetailView({ html, deployedAt, liveUrl, deployedUrl, deploy_url }: DeveloperShape) {
  const resolvedUrl = liveUrl ?? deployedUrl ?? deploy_url;

  return (
    <div className="space-y-8">
      {/* Deploy URL as large CTA at top */}
      {resolvedUrl && <LiveUrlCta liveUrl={resolvedUrl} deployedAt={deployedAt} />}

      {/* Iframe preview */}
      {resolvedUrl && (
        <div className="space-y-2">
          <Label>Site preview</Label>
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <iframe
              src={resolvedUrl}
              title="Live site preview"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="w-full bg-surface-sunken"
              style={{ height: '420px' }}
            />
          </div>
        </div>
      )}

      {/* HTML code block with syntax highlight appearance + copy */}
      {html && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Source HTML</Label>
            <CopyButton text={html} />
          </div>
          <div className="rounded-xl border border-border bg-surface-sunken overflow-hidden">
            {/* Fake syntax bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface">
              <span className="h-3 w-3 rounded-full bg-status-error opacity-60" />
              <span className="h-3 w-3 rounded-full bg-status-running opacity-60" />
              <span className="h-3 w-3 rounded-full bg-status-done opacity-60" />
              <span className="font-mono text-label-xs text-text-faint ml-2">index.html</span>
            </div>
            <pre className="font-mono text-mono-sm text-text-muted p-4 overflow-auto max-h-[420px] whitespace-pre-wrap break-all">
              {html}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function DeveloperArtifact({ artifact, variant = 'card' }: Props): JSX.Element {
  if (!isDeveloper(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  if (variant === 'detail') {
    return <DetailView {...artifact} />;
  }

  return <CardView {...artifact} />;
}
