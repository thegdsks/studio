'use client';

import { Download, Copy, Share2 } from 'lucide-react';
import StrategistArtifact from '@/components/artifacts/StrategistArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadMarkdown, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface StrategistShape {
  positioning: string;
  icp: string;
  jtbd: string;
  three_risks: string[];
}

function isStrategist(a: unknown): a is StrategistShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.positioning === 'string' &&
    typeof o.icp === 'string' &&
    typeof o.jtbd === 'string' &&
    Array.isArray(o.three_risks)
  );
}

function buildMarkdown(a: StrategistShape): string {
  return [
    '# Strategy Memo',
    '',
    '## Positioning',
    a.positioning,
    '',
    '## Ideal Customer Profile',
    a.icp,
    '',
    '## Job to Be Done',
    a.jtbd,
    '',
    '## Top Risks',
    ...a.three_risks.map((r, i) => `${i + 1}. ${r}`),
  ].join('\n');
}

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function StrategistDetail({ agent, metadata }: Props) {
  const art = agent.finalArtifact;
  const data = isStrategist(art) ? art : null;

  const buttons: ActionButton[] = [
    {
      label: 'Download as Markdown',
      icon: Download,
      variant: 'primary',
      onClick: () => {
        if (!data) return;
        downloadMarkdown('strategy-memo.md', buildMarkdown(data));
      },
    },
    {
      label: 'Copy positioning quote',
      icon: Copy,
      onClick: () => {
        if (!data) return;
        void copyToClipboard(data.positioning);
      },
    },
    {
      label: 'Share strategy memo',
      icon: Share2,
      onClick: () => {
        if (!data) return;
        void copyToClipboard(buildMarkdown(data));
      },
    },
  ];

  const nextSteps = [
    'Validate the ICP with 5 customer interviews.',
    'Pressure-test risks with an advisor.',
    'Re-run strategist with a sharper one-liner.',
  ];

  return (
    <>
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-8">
        <StrategistArtifact artifact={art} />

        {data && (
          <section className="space-y-4">
            <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
              Strategy Canvas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Positioning', value: data.positioning },
                { label: 'Ideal Customer', value: data.icp },
                { label: 'Job to Be Done', value: data.jtbd },
                { label: 'Top Risks', value: data.three_risks.join(' / ') },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-surface p-4 space-y-1.5">
                  <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-body-sm text-text-muted">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
