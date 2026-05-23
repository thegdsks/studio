'use client';

import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { StatusBadge } from '@studio/ui';
import type { AgentStatus } from '@studio/shared';
import type { ReactNode } from 'react';

interface AgentDetailLayoutProps {
  runId: string;
  agentName: string;
  agentDescription: string;
  agentIcon: LucideIcon;
  status: AgentStatus;
  ranLocally?: boolean;
  /**
   * Two children expected: [0] main content, [1] sidebar ActionPanel.
   * Use a React fragment: <><MainSection/><ActionPanel/></>.
   * Rendered in a 2-col CSS grid on lg screens.
   */
  children: ReactNode;
}

export default function AgentDetailLayout({
  runId,
  agentName,
  agentDescription,
  agentIcon: AgentIcon,
  status,
  ranLocally,
  children,
}: AgentDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top nav bar */}
      <header className="sticky top-0 z-header border-b border-border bg-surface">
        <div className="mx-auto max-w-page px-4 py-3 flex items-center gap-4">
          <Link
            href={`/run/${runId}`}
            className="inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text transition-colors duration-micro"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to run
          </Link>
          <span className="text-text-faint">/</span>
          <span className="font-mono text-mono-sm text-text-faint truncate">
            {runId.slice(0, 8)} / {agentName}
          </span>
          {ranLocally && (
            <span className="ml-auto font-mono text-label-sm text-accent border border-border-accent bg-accent-soft px-2 py-0.5 rounded">
              via Gemma
            </span>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border bg-surface-raised">
        <div className="mx-auto max-w-page px-4 py-8 flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface shadow-sm">
            <AgentIcon className="h-7 w-7 text-text-muted" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-display-sm font-display text-text">{agentName}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-body-md text-text-muted max-w-2xl">{agentDescription}</p>
          </div>
        </div>
      </div>

      {/* Main content: 2-col grid. Detail components render as [main, sidebar] fragment. */}
      <main className="mx-auto max-w-page w-full px-4 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {children}
        </div>
      </main>
    </div>
  );
}
