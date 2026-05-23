'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import RawFallback from './RawFallback';

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
    'terms_of_service' in o ||
    'privacy_policy' in o ||
    'liability_summary' in o ||
    'termsMarkdown' in o ||
    'privacyMarkdown' in o
  );
}

function renderMarkdown(md: string): JSX.Element {
  const lines = md.split('\n');
  const elements: JSX.Element[] = [];
  let key = 0;

  for (const line of lines) {
    key++;
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key} className="text-body-md font-semibold text-text mt-4 mb-1">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key} className="text-headline-md font-display text-text mt-6 mb-2">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key} className="text-display-sm font-display text-text mt-6 mb-2">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={key} className="text-body-sm text-text-muted ml-4 list-disc">
          {line.slice(2)}
        </li>,
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key} className="h-2" />);
    } else {
      elements.push(
        <p key={key} className="text-body-sm text-text-muted leading-relaxed">
          {line}
        </p>,
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Tab = 'terms' | 'privacy';

interface Props {
  artifact: unknown;
}

export default function LegalArtifact({ artifact }: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  if (!isLegal(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const terms = artifact.terms_of_service ?? artifact.termsMarkdown;
  const privacy = artifact.privacy_policy ?? artifact.privacyMarkdown;

  if (!terms && !privacy) {
    return <RawFallback artifact={artifact} />;
  }

  const tabs: { id: Tab; label: string; content: string | undefined }[] = [
    { id: 'terms', label: 'Terms of Service', content: terms },
    { id: 'privacy', label: 'Privacy Policy', content: privacy },
  ];

  const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? '';

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border-b border-border">
        {tabs.map((tab) => (
          tab.content ? (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors duration-micro -mb-px ${
                activeTab === tab.id
                  ? 'border-border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ) : null
        ))}
      </div>

      {activeContent && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                downloadMarkdown(
                  activeContent,
                  activeTab === 'terms' ? 'terms-of-service.md' : 'privacy-policy.md',
                )
              }
              className="flex items-center gap-1.5 font-mono text-label-sm text-text-faint hover:text-text transition-colors duration-micro"
            >
              <Download className="h-3.5 w-3.5" />
              Download .md
            </button>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 max-h-96 overflow-y-auto">
            {renderMarkdown(activeContent)}
          </div>
        </div>
      )}

      <p className="text-body-sm text-text-faint italic">
        AI generated. Have a lawyer review before use.
      </p>
    </div>
  );
}
