'use client';

import { type ComponentType, type ReactElement, type SVGProps } from 'react';
import { Cpu, Sparkles } from 'lucide-react';
import type { AgentId } from '@studio/shared';
import { providerFor, type ProviderInfo } from '@/lib/providers';

// Static imports for the known provider icon slugs.
// Tree-shaken at build time — only these 4 icons are bundled.
import GeminiGoogle from '@thesvg/react/gemini-google';
import AntigravityGoogle from '@thesvg/react/antigravity-google';
import CloudflarePages from '@thesvg/react/cloudflare-pages';
import Apollodotio from '@thesvg/react/apollodotio';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProviderBadgeProps {
  agentId: AgentId;
  ranLocally?: boolean;
  size?: 'sm' | 'md';
  variant?: 'chip' | 'inline';
}

type SvgIconProps = SVGProps<SVGSVGElement>;
type SvgIconComponent = ComponentType<SvgIconProps>;

// ─── Slug → icon component map ────────────────────────────────────────────────

const SLUG_ICON: Partial<Record<string, SvgIconComponent>> = {
  'gemini-google':      GeminiGoogle,
  'antigravity-google': AntigravityGoogle,
  'cloudflare-pages':   CloudflarePages,
  'apollodotio':        Apollodotio,
};

// ─── Tone → Tailwind token class ─────────────────────────────────────────────

const TONE_CLASS: Record<ProviderInfo['tone'], string> = {
  gemini:      'text-accent',
  gemma:       'text-status-done',
  banana:      'text-status-warn',
  antigravity: 'text-accent',
  cloudflare:  'text-accent-cool',
  apollo:      'text-accent-violet',
};

// ─── Icon node resolver ───────────────────────────────────────────────────────

function resolveIcon(
  provider: ProviderInfo,
  sizeClass: string,
): ReactElement {
  const StaticIcon = provider.iconSlug ? SLUG_ICON[provider.iconSlug] : undefined;
  if (StaticIcon) {
    return <StaticIcon className={sizeClass} aria-hidden />;
  }
  // Gemma runs locally: use CPU icon. Anything else: Sparkles.
  const FallbackIcon = provider.tone === 'gemma' ? Cpu : Sparkles;
  return <FallbackIcon className={sizeClass} aria-hidden />;
}

// ─── ProviderBadge ────────────────────────────────────────────────────────────

export function ProviderBadge({
  agentId,
  ranLocally,
  size = 'sm',
  variant = 'chip',
}: ProviderBadgeProps) {
  const provider = providerFor(agentId, ranLocally);
  const toneClass = TONE_CLASS[provider.tone];
  const sizeClass = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  const iconNode = resolveIcon(provider, sizeClass);
  const label = provider.name;

  if (variant === 'chip') {
    return (
      <span
        title={provider.description}
        className={[
          'inline-flex items-center gap-1 px-1.5 py-0.5',
          'rounded-sm border border-border bg-surface-raised',
          'font-mono text-label-sm uppercase tracking-wider shrink-0',
          toneClass,
        ].join(' ')}
      >
        {iconNode}
        {label}
      </span>
    );
  }

  // variant === 'inline'
  return (
    <span
      title={provider.description}
      className={[
        'inline-flex items-center gap-1',
        'font-mono text-label-sm shrink-0',
        toneClass,
      ].join(' ')}
    >
      {iconNode}
      {label}
    </span>
  );
}
