'use client';

import { ExternalLink } from 'lucide-react';
import RawFallback from './RawFallback';

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

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function isLikelyValidProfile(url: string | undefined): boolean {
  if (!url) return false;
  if (url.includes('linkedin.com/search/')) return true;
  if (url.includes('linkedin.com/company/')) return true;
  return false;
}

function buildSearchUrl(name: string, company: string): string {
  const query = encodeURIComponent(`${name} ${company}`.trim());
  return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
}

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function GrowthArtifact({ artifact }: Props): JSX.Element {
  if (!isGrowth(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { prospects } = artifact;

  return (
    <div className="space-y-3">
      <p className="inline-block font-mono text-label-sm text-text-faint border border-border rounded-full px-3 py-0.5">
        {prospects.length} prospect{prospects.length !== 1 ? 's' : ''}
      </p>
      <div className="space-y-2">
        {prospects.map((p, i) => {
          const declaredUrl = p.profileUrl ?? p.linkedin;
          const profileHref = isLikelyValidProfile(declaredUrl)
            ? declaredUrl
            : buildSearchUrl(p.name, p.company);
          const linkLabel = isLikelyValidProfile(declaredUrl) ? 'Profile' : 'Find on LinkedIn';
          return (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <div className="h-10 w-10 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <span className="font-mono text-label-sm text-text-muted">{initials(p.name)}</span>
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body-md font-semibold text-text">{p.name}</p>
                  {profileHref && (
                    <a
                      href={profileHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-body-sm text-accent hover:underline shrink-0"
                    >
                      {linkLabel}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-body-sm text-text-muted">
                  {p.role} at {p.company}
                </p>
                {p.why_fit && (
                  <p className="text-body-sm text-text-faint italic">{p.why_fit}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
