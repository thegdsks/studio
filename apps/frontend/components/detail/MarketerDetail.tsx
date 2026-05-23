'use client';

import { Download, ExternalLink } from 'lucide-react';
import MarketerArtifact from '@/components/artifacts/MarketerArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadMarkdown } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface ProductHunt {
  tagline: string;
  description: string;
}

interface MarketerShape {
  tweet_thread?: string[];
  x?: string[];
  producthunt?: ProductHunt;
  productHunt?: ProductHunt;
  hn_show?: string;
  hackerNews?: string;
  linkedin_post?: string;
}

function isMarketer(a: unknown): a is MarketerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    'tweet_thread' in o || 'x' in o || 'producthunt' in o || 'productHunt' in o ||
    'hn_show' in o || 'hackerNews' in o || 'linkedin_post' in o
  );
}

function buildPostsMarkdown(data: MarketerShape): string {
  const lines: string[] = ['# Launch Posts', ''];
  const xPosts = data.tweet_thread ?? data.x ?? [];
  if (xPosts.length) {
    lines.push('## X / Twitter Thread', '', ...xPosts.map((p, i) => `Tweet ${i + 1}:\n${p}`), '');
  }
  const ph = data.producthunt ?? data.productHunt;
  if (ph) {
    lines.push('## Product Hunt', '', `Tagline: ${ph.tagline}`, '', ph.description, '');
  }
  const hn = data.hn_show ?? data.hackerNews;
  if (hn) lines.push('## Hacker News', '', `Show HN: ${hn}`, '');
  if (data.linkedin_post) lines.push('## LinkedIn', '', data.linkedin_post);
  return lines.join('\n');
}

const SCHEDULE_ROWS = [
  { platform: 'X (Twitter)', day: 'Tuesday', time: '9am EST' },
  { platform: 'Product Hunt', day: 'Wednesday', time: '12:01am PST' },
  { platform: 'Hacker News', day: 'Wednesday', time: '8am EST' },
  { platform: 'LinkedIn', day: 'Thursday', time: '8am EST' },
];

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function MarketerDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isMarketer(art) ? art : null;

  const xPosts = data?.tweet_thread ?? data?.x ?? [];
  const firstPost = xPosts[0] ?? '';

  const buttons: ActionButton[] = [
    {
      label: 'Download all posts as Markdown',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!data) return;
        downloadMarkdown('launch-posts.md', buildPostsMarkdown(data));
      },
    },
    ...(firstPost
      ? [
          {
            label: 'Open X compose window',
            icon: ExternalLink,
            onClick: () => {
              const encoded = encodeURIComponent(firstPost.slice(0, 280));
              window.open(
                `https://twitter.com/intent/tweet?text=${encoded}`,
                '_blank',
                'noopener,noreferrer',
              );
            },
          } satisfies ActionButton,
        ]
      : []),
  ];

  const nextSteps = [
    'Stagger posts over 5 days for momentum.',
    'Reply to your own first comment on Product Hunt to boost engagement.',
    'DM 10 friends to upvote on launch day.',
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        <MarketerArtifact artifact={art} />

        <section className="space-y-4">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
            Suggested Posting Schedule
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-raised">
                <tr>
                  {['Platform', 'Day', 'Best time'].map((h) => (
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
                {SCHEDULE_ROWS.map((row) => (
                  <tr key={row.platform} className="hover:bg-surface-raised transition-colors duration-micro">
                    <td className="px-4 py-3 font-medium text-text">{row.platform}</td>
                    <td className="px-4 py-3 text-text-muted">{row.day}</td>
                    <td className="px-4 py-3 font-mono text-text-faint">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
