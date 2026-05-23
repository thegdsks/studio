'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import RawFallback from './RawFallback';

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

function formatDeployedAt(val: string): string {
  try {
    return new Date(val).toLocaleString();
  } catch {
    return val;
  }
}

interface Props {
  artifact: unknown;
}

export default function DeveloperArtifact({ artifact }: Props): JSX.Element {
  const [copied, setCopied] = useState(false);

  if (!isDeveloper(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { html, deployedAt, deployedUrl } = artifact;
  const liveUrl = artifact.liveUrl ?? deployedUrl;

  const handleCopy = () => {
    if (!html) return;
    void navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {liveUrl && (
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
      )}

      {liveUrl && (
        <div className="border border-border rounded-lg overflow-hidden">
          <iframe
            src={liveUrl}
            title="Live site preview"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-96 bg-surface-sunken"
          />
        </div>
      )}

      {!liveUrl && html && (
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
