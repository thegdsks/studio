'use client';

import { useState } from 'react';
import { Download, Copy, Star } from 'lucide-react';
import NamerArtifact from '@/components/artifacts/NamerArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadMarkdown, downloadCSV, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface NameEntry {
  name: string;
  domain: string;
  available: boolean;
  alternative_tld?: string;
}

interface NamerShape {
  names: NameEntry[];
}

function isNamer(a: unknown): a is NamerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return Array.isArray(o.names);
}

function isNameEntry(x: unknown): x is NameEntry {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === 'string' && typeof o.domain === 'string' && typeof o.available === 'boolean';
}

function buildNamesMarkdown(names: NameEntry[]): string {
  return [
    '# Brand Name Shortlist',
    '',
    ...names.map(
      (n) =>
        `## ${n.name}\n- Domain: ${n.domain}\n- Available: ${n.available ? 'Yes' : 'No'}${n.alternative_tld ? `\n- Alt TLD: ${n.alternative_tld}` : ''}`,
    ),
  ].join('\n\n');
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function NamerDetail({ agent, metadata }: Props) {
  const [shortlist, setShortlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('name-shortlist') ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  const art = agent.finalArtifact;
  const data = isNamer(art) ? art : null;
  const names = data?.names.filter(isNameEntry) ?? [];

  function toggleShortlist(name: string) {
    setShortlist((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      localStorage.setItem('name-shortlist', JSON.stringify(next));
      return next;
    });
  }

  const buttons: ActionButton[] = [
    {
      label: 'Download names as Markdown',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!names.length) return;
        downloadMarkdown('brand-names.md', buildNamesMarkdown(names));
      },
    },
    {
      label: 'Download names as CSV',
      icon: Download,
      onClick: () => {
        if (!names.length) return;
        downloadCSV(
          'brand-names.csv',
          names.map((n) => ({
            name: n.name,
            domain: n.domain,
            available: n.available,
            alternative_tld: n.alternative_tld ?? '',
          })),
        );
      },
    },
    {
      label: 'Copy top name',
      icon: Copy,
      onClick: () => {
        if (!names[0]) return;
        void copyToClipboard(names[0].name);
      },
    },
  ];

  const nextSteps = [
    'Register your top choice before someone else does.',
    'Check trademarks at uspto.gov.',
    'Run names by 3 friends in your target market.',
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        <NamerArtifact artifact={art} />

        {names.length > 0 && (
          <section className="space-y-4">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Name Comparison
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-body-sm">
                <thead className="bg-surface-raised">
                  <tr>
                    {['Name', 'Domain', 'Available', 'Alt TLD', 'Save'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left font-mono text-label-sm text-text-faint uppercase tracking-wider border-b border-border"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {names.map((n) => (
                    <tr key={n.name} className="hover:bg-surface-raised transition-colors duration-micro">
                      <td className="px-4 py-3 font-medium text-text">{n.name}</td>
                      <td className="px-4 py-3 font-mono text-text-muted">
                        <a
                          href={`https://www.namecheap.com/domains/registration/results/?domain=${n.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {n.domain}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className={n.available ? 'text-status-done font-medium' : 'text-text-faint'}>
                          {n.available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-text-faint">{n.alternative_tld ?? '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleShortlist(n.name)}
                          className="text-text-faint hover:text-accent transition-colors duration-micro"
                          aria-label={shortlist.includes(n.name) ? 'Remove from shortlist' : 'Add to shortlist'}
                        >
                          <Star className={`h-4 w-4 ${shortlist.includes(n.name) ? 'fill-accent text-accent' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
