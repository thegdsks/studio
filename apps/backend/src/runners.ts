import type { AgentId, AgentEvent } from '@studio/shared';

// ---- types ----------------------------------------------------------------

export interface RunContext {
  idea: string;
  upstream: Partial<Record<AgentId, unknown>>;
}

export type Emit = (event: AgentEvent) => void;

export type AgentRunner = (ctx: RunContext, emit: Emit) => Promise<unknown>;

// ---- helpers ---------------------------------------------------------------

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max) + '…';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stream a string as random-sized token chunks with random delays. */
async function streamAsTokens(
  text: string,
  agentId: AgentId,
  emit: Emit,
): Promise<void> {
  let i = 0;
  while (i < text.length) {
    const chunkSize = 4 + Math.floor(Math.random() * 9); // 4–12
    const chunk = text.slice(i, i + chunkSize);
    emit({ agent_id: agentId, type: 'chunk', payload: { text: chunk } });
    await sleep(80 + Math.floor(Math.random() * 71)); // 80–150ms
    i += chunkSize;
  }
}

// ---- mock data (mirrors managedAgent.ts mockDataMap) ----------------------

type MockDataMap = Record<string, unknown>;

// Import lazily to avoid circular issues; the values are plain objects.
const mockDataMap: MockDataMap = {
  strategist: {
    positioning: "A workspace for specialist agents working in parallel to launch startups instantly.",
    icp: "Solo founders, hackathon participants, and early-stage startup teams looking for rapid scaffolding.",
    jtbd: "Create a complete, cohesive startup launch kit in under 5 minutes without manual coordination.",
    three_risks: [
      "Dependency on third-party APIs (Vercel, Domainr) causing pipeline jank.",
      "High prompt variability leading to mismatched brand identities across agents.",
      "Rate limits and token costs scaling rapidly with simultaneous agent invocations.",
    ],
  },
  copywriter: {
    hero: {
      headline: "Launch Your Startup in Seconds with Studio",
      sub: "9 specialist AI agents working in parallel to build your positioning, branding, landing page, and legal docs instantly.",
    },
    features: [
      { title: "Parallel Specialists", body: "Copywriters, developers, growth hackers, and designers working simultaneously." },
      { title: "One-Click Deploy", body: "Beautiful, responsive landing pages deployed straight to Vercel instantly." },
      { title: "Grounded & Verified", body: "Positions, legal documents, and domains checked live against actual search and registry APIs." },
    ],
    faq: [
      { q: "How does Studio work?", a: "Studio orchestrates 9 specialized agents that take your startup idea and produce a unified launch kit." },
      { q: "Are the domains checked?", a: "Yes, domains are checked live against the Domainr API for availability." },
    ],
    cta: "Start Launching",
  },
  marketer: {
    tweet_thread: [
      "1/ Imagine launching your startup in 60 seconds. Introducing Studio. 🚀",
      "2/ 9 specialist AI agents working in parallel to scaffold your entire launch kit.",
      "3/ Brand positioning, live domains, marketing copy, and a deployed Vercel landing page.",
      "4/ Built at Shack15 for Google I/O Hackathon using Gemini Managed Agents.",
      "5/ Launch your next big thing today. ⚡",
    ],
    producthunt: {
      tagline: "9 specialist AI agents building your startup launch kit in parallel",
      description: "Input your idea and get a fully deployed landing page, branding, marketing copies, legal documents, and growth prospects in under 5 minutes.",
    },
    hn_show: "Show HN: Studio – 9 Specialist AI Agents Build & Deploy Your Startup Launch Kit in Parallel",
    linkedin_post: "Hackathons are about speed. Today at Shack15 we built Studio — launching a complete startup kit in under 5 minutes using 9 parallel AI agents powered by Gemini.",
  },
  legal: {
    terms_of_service: "# Terms of Service\n\n*AI-generated draft — review with counsel before use.*\n\nBy accessing Studio you agree to these terms. We provide AI-generated startup kits on an 'as is' basis without warranty.",
    privacy_policy: "# Privacy Policy\n\n*AI-generated draft — review with counsel before use.*\n\nWe collect your startup idea solely to generate your launch kit. We do not sell your data.",
    liability_summary: "All liability for domain conflicts, code vulnerabilities, or legal invalidity lies with the end user.",
  },
  namer: {
    names: [
      { name: "studioscript", domain: "studioscript.com", available: true },
      { name: "launchpadai", domain: "launchpadai.net", available: false, alternative_tld: "launchpadai.co" },
      { name: "agentstudio", domain: "agentstudio.io", available: true },
      { name: "shackio", domain: "shackio.com", available: false, alternative_tld: "shackio.net" },
      { name: "geminilabs", domain: "geminilabs.co", available: true },
    ],
  },
  designer: {
    mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    exportedCode: "<div class=\"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6\"><h1 class=\"text-5xl font-bold\">Studio</h1></div>",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    palette: { primary: "#0f172a", secondary: "#6366f1", accent: "#38bdf8" },
  },
  developer: {
    liveUrl: "https://studio-demo-app.vercel.app",
    html: "<!DOCTYPE html><html><head><title>Studio App</title></head><body><h1>Hello World</h1></body></html>",
    deployedAt: new Date().toISOString(),
  },
  growth: {
    prospects: [
      {
        name: "Sarah Chen",
        role: "Managing Director",
        company: "Apex Ventures",
        linkedin: "https://linkedin.com/in/sarahchen-apex",
        why_fit: "Focuses on early-stage developer tools and AI productivity frameworks.",
      },
      {
        name: "David Miller",
        role: "VP of Product",
        company: "LaunchStack",
        linkedin: "https://linkedin.com/in/davidmiller-launchstack",
        why_fit: "Leads products helping startups deploy landing pages quickly.",
      },
    ],
  },
  analyst: {
    competitors: [
      { name: "LaunchFast", url: "https://launchfast.com", positioning: "Boilerplate templates for Next.js", pricing: "$199 one-time", strength: "Mature boilerplate code", weakness: "No AI personalization" },
      { name: "ShipFast", url: "https://shipfa.st", positioning: "Next.js startup template", pricing: "$169 one-time", strength: "Very popular community", weakness: "Manual deployment required" },
    ],
    market_gap: "Lack of zero-code parallel automation that produces complete, unified marketing and legal kits in one click.",
    recommendation: "Target non-technical founders who want fully customized, deployed landing pages with real domain availability checks.",
  },
};

// ---- fake runner (for unimplemented agents) --------------------------------

function makeFakeRunner(agentId: AgentId): AgentRunner {
  return async (ctx: RunContext, emit: Emit): Promise<unknown> => {
    const artifact = mockDataMap[agentId] ?? {};
    const text = JSON.stringify(artifact, null, 2);
    // Add a small preamble so the card shows activity immediately
    emit({ agent_id: agentId, type: 'chunk', payload: { text: `Analyzing: ${ctx.idea.slice(0, 60)}\n\n` } });
    await streamAsTokens(text, agentId, emit);
    return artifact;
  };
}

// ---- real runners ----------------------------------------------------------

const strategistRunner: AgentRunner = async (ctx, emit) => {
  const { runStrategist } = await import('../../../agents/strategist/run.js');
  const result = await runStrategist(ctx.idea, {
    onChunk: (text) => emit({ agent_id: 'strategist', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'strategist', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
    onToolResult: (result) => emit({ agent_id: 'strategist', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(result), 120)}\n` } }),
  });
  return result;
};

const copywriterRunner: AgentRunner = async (ctx, emit) => {
  const { runCopywriter } = await import('../../../agents/copywriter/run.js');

  // Extract upstream data from strategist + namer
  const strategistOut = ctx.upstream['strategist'] as Record<string, string> | undefined;
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;

  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';
  const positioning = strategistOut?.['positioning'] ?? ctx.idea;
  const icp = strategistOut?.['icp'] ?? 'Founders and builders';

  emit({ agent_id: 'copywriter', type: 'chunk', payload: { text: `Crafting copy for ${brandName}…\n` } });

  const result = await runCopywriter({ brandName, positioning, icp });

  // Stream result text as chunks
  const text = JSON.stringify(result, null, 2);
  await streamAsTokens(text, 'copywriter', emit);

  return result;
};

const marketerRunner: AgentRunner = async (ctx, emit) => {
  const { runMarketer } = await import('../../../agents/marketer/run.js');

  const strategistOut = ctx.upstream['strategist'] as Record<string, string> | undefined;
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const copywriterOut = ctx.upstream['copywriter'];

  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';
  const positioning = strategistOut?.['positioning'] ?? ctx.idea;

  emit({ agent_id: 'marketer', type: 'chunk', payload: { text: `Drafting launch posts for ${brandName}…\n` } });

  const result = await runMarketer({ brandName, positioning, copywriterOutput: copywriterOut ?? {} });

  const text = JSON.stringify(result, null, 2);
  await streamAsTokens(text, 'marketer', emit);

  return result;
};

const legalRunner: AgentRunner = async (ctx, emit) => {
  const { runLegal } = await import('../../../agents/legal/run.js');

  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';

  emit({ agent_id: 'legal', type: 'chunk', payload: { text: `Drafting terms for ${brandName}…\n` } });

  const result = await runLegal({ brandName, businessType: 'AI SaaS startup platform' });

  const text = JSON.stringify(result, null, 2);
  await streamAsTokens(text, 'legal', emit);

  return result;
};

const namerRunner: AgentRunner = async (ctx, emit) => {
  const { runNamer } = await import('../../../agents/namer/run.js');
  emit({ agent_id: 'namer', type: 'chunk', payload: { text: `Searching for creative brand names…\n` } });
  const result = await runNamer({ idea: ctx.idea, vibe: 'modern, clean, premium tech' });
  const text = JSON.stringify(result, null, 2);
  await streamAsTokens(text, 'namer', emit);
  return result;
};

const designerRunner: AgentRunner = async (ctx, emit) => {
  const { runDesigner } = await import('../../../agents/designer/run.js');
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';
  const strategistOut = ctx.upstream['strategist'] as Record<string, string> | undefined;
  const positioning = strategistOut?.['positioning'] ?? ctx.idea;

  const result = await runDesigner(brandName, positioning, {
    onChunk: (text) => emit({ agent_id: 'designer', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'designer', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
    onToolResult: (result) => emit({ agent_id: 'designer', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(result), 120)}\n` } }),
  });
  return result;
};

const developerRunner: AgentRunner = async (ctx, emit) => {
  const { runDeveloper } = await import('../../../agents/developer/run.js');
  const designerOut = ctx.upstream['designer'];
  const copywriterOut = ctx.upstream['copywriter'];

  const result = await runDeveloper(designerOut ?? {}, copywriterOut ?? {}, {
    onChunk: (text) => emit({ agent_id: 'developer', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
    onToolResult: (result) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(result), 120)}\n` } }),
  });
  return result;
};

const growthRunner: AgentRunner = async (ctx, emit) => {
  const { runGrowth } = await import('../../../agents/growth/run.js');
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';
  const strategistOut = ctx.upstream['strategist'] as Record<string, string> | undefined;
  const positioning = strategistOut?.['positioning'] ?? ctx.idea;

  const result = await runGrowth({
    brandName,
    positioning,
    idea: ctx.idea,
    callbacks: {
      onChunk: (text) => emit({ agent_id: 'growth', type: 'chunk', payload: { text } }),
      onToolCall: (call) => emit({ agent_id: 'growth', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
      onToolResult: (result) => emit({ agent_id: 'growth', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(result), 120)}\n` } }),
    }
  });
  return result;
};

const analystRunner: AgentRunner = async (ctx, emit) => {
  const { runAnalyst } = await import('../../../agents/analyst/run.js');

  const result = await runAnalyst(ctx.idea, {
    onChunk: (text) => emit({ agent_id: 'analyst', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'analyst', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
    onToolResult: (result) => emit({ agent_id: 'analyst', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(result), 120)}\n` } }),
  });
  return result;
};

// ---- registry --------------------------------------------------------------

export const agentRunners: Partial<Record<AgentId, AgentRunner>> = {
  strategist: strategistRunner,
  copywriter: copywriterRunner,
  marketer: marketerRunner,
  legal: legalRunner,
  namer: namerRunner,
  designer: designerRunner,
  developer: developerRunner,
  growth: growthRunner,
  analyst: analystRunner,
};
