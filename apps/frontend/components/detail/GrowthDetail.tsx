'use client';

import { useState } from 'react';
import { Download, ExternalLink, Star } from 'lucide-react';
import GrowthArtifact from '@/components/artifacts/GrowthArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadCSV, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface Prospect {
  name: string;
  role: string;
  company: string;
  linkedin?: string;
  profileUrl?: string;
  why_fit?: string;
  email_draft?: string;
}

interface GrowthShape {
  prospects: Prospect[];
}

function isGrowth(a: unknown): a is GrowthShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return Array.isArray(o.prospects);
}

function isProspect(x: unknown): x is Prospect {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === 'string' && typeof o.role === 'string' && typeof o.company === 'string';
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function GrowthDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isGrowth(art) ? art : null;
  const prospects = data?.prospects.filter(isProspect) ?? [];

  const [shortlist, setShortlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('growth-shortlist') ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(prospects.map((p) => [p.name, p.email_draft ?? ''])),
  );

  function toggleShortlist(name: string) {
    setShortlist((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      localStorage.setItem('growth-shortlist', JSON.stringify(next));
      return next;
    });
  }

  const buttons: ActionButton[] = [
    {
      label: 'Download prospects as CSV',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!prospects.length) return;
        downloadCSV(
          'prospects.csv',
          prospects.map((p) => ({
            name: p.name,
            role: p.role,
            company: p.company,
            profile_url: p.profileUrl ?? p.linkedin ?? '',
            why_fit: p.why_fit ?? '',
            email_draft: drafts[p.name] ?? p.email_draft ?? '',
          })),
        );
      },
    },
    {
      label: 'Open all profiles in tabs',
      icon: ExternalLink,
      onClick: () => {
        prospects.forEach((p) => {
          const url = p.profileUrl ?? p.linkedin;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
      },
    },
  ];

  const nextSteps = [
    'Personalize each draft before sending.',
    'Connect on LinkedIn first, then DM.',
    'Track responses in a spreadsheet.',
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        <GrowthArtifact artifact={art} />

        {prospects.length > 0 && (
          <section className="space-y-4">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Outreach Drafts
            </p>
            <div className="space-y-4">
              {prospects.map((p) => (
                <div key={p.name} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-body-md font-medium text-text">{p.name}</p>
                      <p className="text-body-sm text-text-faint">{p.role} at {p.company}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleShortlist(p.name)}
                      className="text-text-faint hover:text-accent transition-colors duration-micro"
                      aria-label="Toggle shortlist"
                    >
                      <Star className={`h-4 w-4 ${shortlist.includes(p.name) ? 'fill-accent text-accent' : ''}`} />
                    </button>
                  </div>

                  {drafts[p.name] !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-label-sm text-text-faint uppercase tracking-wider">
                          Email draft
                        </p>
                        <button
                          type="button"
                          onClick={() => void copyToClipboard(drafts[p.name] ?? '')}
                          className="font-mono text-label-sm text-text-faint hover:text-text transition-colors duration-micro"
                        >
                          Copy
                        </button>
                      </div>
                      <textarea
                        value={drafts[p.name] ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [p.name]: e.target.value }))
                        }
                        rows={4}
                        className="w-full rounded-md border border-border bg-surface-sunken px-3 py-2 font-mono text-mono-sm text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-border-accent"
                      />
                    </div>
                  )}
                </div>
              ))}
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
