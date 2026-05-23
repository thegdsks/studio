import type { AgentId } from '@studio/shared';

export interface ProviderInfo {
  /** Canonical short name. Used in URLs + analytics. */
  key: string;
  /** Display name shown in chips and tooltips. */
  name: string;
  /** One-line description for tooltip. */
  description: string;
  /** Which ecosystem this lives under, if any. */
  parent?: 'google' | 'cloudflare' | 'third-party';
  /** Tailwind text color for the chip; falls back to text-accent. */
  tone: 'gemini' | 'gemma' | 'banana' | 'antigravity' | 'cloudflare' | 'apollo';
  /** Icon component slug from @thesvg/react — e.g. `gemini-google`. Falls back to Lucide if missing. */
  iconSlug?: string;
}

// Per-agent default provider — what powers each agent's primary call.
export const AGENT_PROVIDER: Record<AgentId, ProviderInfo> = {
  strategist: {
    key: 'antigravity',
    name: 'Antigravity Managed Agents',
    description: 'Multi-turn agent runtime with grounded Google Search.',
    parent: 'google',
    tone: 'antigravity',
    iconSlug: 'antigravity-google',
  },
  namer: {
    key: 'gemini',
    name: 'Gemini 3.5 Flash + Domainr',
    description: 'Gemini generates names, Domainr validates availability live.',
    parent: 'google',
    tone: 'gemini',
    iconSlug: 'gemini-google',
  },
  designer: {
    key: 'banana',
    name: 'Gemini 2.5 Flash Image',
    description: 'Nano-banana generates the hero backdrop; we overlay typography in SVG.',
    parent: 'google',
    tone: 'banana',
    iconSlug: 'gemini-google',
  },
  copywriter: {
    key: 'gemini',
    name: 'Gemini 3.5 Flash',
    description: 'Structured-output JSON via Gemini Flash.',
    parent: 'google',
    tone: 'gemini',
    iconSlug: 'gemini-google',
  },
  developer: {
    key: 'cloudflare-pages',
    name: 'Cloudflare Pages',
    description: 'Static HTML deployed to a real Cloudflare Pages project.',
    parent: 'cloudflare',
    tone: 'cloudflare',
    iconSlug: 'cloudflare-pages',
  },
  marketer: {
    key: 'gemini',
    name: 'Gemini 3.5 Flash',
    description: 'Structured-output multi-channel launch posts.',
    parent: 'google',
    tone: 'gemini',
    iconSlug: 'gemini-google',
  },
  growth: {
    key: 'apollo',
    name: 'Apollo.io',
    description: 'Public-record prospect data (no scraped emails).',
    parent: 'third-party',
    tone: 'apollo',
    iconSlug: 'apollodotio',
  },
  legal: {
    key: 'gemini',
    name: 'Gemini 3.5 Flash',
    description: 'Structured legal drafts. Privacy mode keeps this local on Gemma.',
    parent: 'google',
    tone: 'gemini',
    iconSlug: 'gemini-google',
  },
  analyst: {
    key: 'antigravity',
    name: 'Antigravity Managed Agents',
    description: 'Grounded competitor analysis with Google Search.',
    parent: 'google',
    tone: 'antigravity',
    iconSlug: 'antigravity-google',
  },
  director: {
    key: 'antigravity',
    name: 'Antigravity Managed Agents',
    description: 'Synthesises all 9 specialists into a coherent launch story.',
    parent: 'google',
    tone: 'antigravity',
    iconSlug: 'antigravity-google',
  },
};

// When the agent ran locally on Gemma, overlay this provider instead of the default.
export const GEMMA_PROVIDER: ProviderInfo = {
  key: 'gemma',
  name: 'Gemma 4 (local)',
  description: 'Ran fully on-device via Ollama. Zero cloud cost.',
  parent: 'google',
  tone: 'gemma',
};

export function providerFor(agentId: AgentId, ranLocally: boolean | undefined): ProviderInfo {
  if (ranLocally) return GEMMA_PROVIDER;
  return AGENT_PROVIDER[agentId];
}
