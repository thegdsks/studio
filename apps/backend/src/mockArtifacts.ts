/**
 * Pre-baked mock artifacts for demo mode (no real API keys required).
 *
 * Three "slots" per agent — selected deterministically via ideaSlot(idea).
 * Each shape matches the corresponding schema.ts in agents/<id>/schema.ts.
 * Designer includes a valid brandKit for BrandPreview.
 * Developer includes liveUrl for FinalKitModal's DeployedHero.
 */

import type { AgentId } from '@studio/shared';

// ---------------------------------------------------------------------------
// Slot selector — deterministic, no external deps
// ---------------------------------------------------------------------------

/** Returns 0, 1, or 2 based on a lightweight string hash of the idea. */
export function ideaSlot(idea: string): 0 | 1 | 2 {
  let h = 0;
  for (let i = 0; i < idea.length; i++) {
    h = ((h << 5) - h + idea.charCodeAt(i)) >>> 0;
  }
  return (h % 3) as 0 | 1 | 2;
}

// ---------------------------------------------------------------------------
// Per-agent artifact types (local — not exported from shared)
// ---------------------------------------------------------------------------

interface StrategistArtifact {
  positioning: string;
  icp: string;
  jtbd: string;
  three_risks: string[];
}

interface DomainOption {
  name: string;
  domain: string;
  available: boolean;
  alternative_tld?: string;
}

interface NamerArtifact {
  names: DomainOption[];
}

interface BrandKit {
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  headlineFont: string;
  bodyFont: string;
  logoSvg: string;
}

interface DesignerArtifact {
  mockupUrl: string | null;
  exportedCode: string;
  logoUrl: string | null;
  logoVariants: string[];
  palette: { primary: string; secondary: string; accent: string };
  brandKit: BrandKit;
}

interface CopywriterFeature {
  title: string;
  body: string;
}

interface CopywriterFaq {
  q: string;
  a: string;
}

interface CopywriterArtifact {
  hero: { headline: string; sub: string };
  features: CopywriterFeature[];
  faq: CopywriterFaq[];
  cta: string;
}

interface DeveloperArtifact {
  liveUrl: string;
  html: string;
  deployedAt: string;
}

interface MarketerArtifact {
  tweet_thread: string[];
  producthunt: { tagline: string; description: string };
  hn_show: string;
  linkedin_post: string;
}

interface Prospect {
  name: string;
  role: string;
  company: string;
  linkedin: string;
  why_fit: string;
  email_draft: string;
}

interface GrowthArtifact {
  prospects: Prospect[];
}

interface LegalArtifact {
  terms_of_service: string;
  privacy_policy: string;
  liability_summary: string;
}

interface Competitor {
  name: string;
  url: string;
  positioning: string;
  pricing: string;
  strength: string;
  weakness: string;
}

interface AnalystArtifact {
  competitors: Competitor[];
  market_gap: string;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Strategist — 3 slots
// ---------------------------------------------------------------------------

const strategistSlots: [StrategistArtifact, StrategistArtifact, StrategistArtifact] = [
  {
    positioning:
      "A parallel-agent studio that turns a one-line idea into a fully deployed product in under five minutes.",
    icp:
      "Solo technical founders and hackathon teams who need a credible launch kit before the demo hour.",
    jtbd:
      "Go from raw idea to live URL, branded assets, and legal docs without context-switching between twenty tools.",
    three_risks: [
      "Dependency on third-party APIs (Vercel, Domainr) causing pipeline stalls.",
      "High prompt variability leading to mismatched brand identities across agents.",
      "Rate limits scaling rapidly with simultaneous agent invocations.",
    ],
  },
  {
    positioning:
      "The mission-control dashboard that orchestrates nine specialist AI agents into one coherent launch kit.",
    icp:
      "Early-stage startup teams (1–3 people) who want a professional first impression without a designer on payroll.",
    jtbd:
      "Produce positioning, branding, a live landing page, and competitor analysis in a single sitting.",
    three_risks: [
      "LLM hallucinations in legal copy requiring mandatory human review.",
      "Demo fatigue if agents emit near-identical outputs across runs.",
      "Network latency on venue WiFi degrading perceived streaming speed.",
    ],
  },
  {
    positioning:
      "AI-native product scaffolding that runs nine specialists in parallel and ships the result as a live site.",
    icp:
      "Non-technical founders attending pitch competitions who need a deployable MVP story for judges.",
    jtbd:
      "Skip the weeks of design-developer-lawyer back-and-forth and walk into the room with a working product.",
    three_risks: [
      "Over-reliance on Gemini API availability on demo day.",
      "Inconsistent voice between copywriter and marketer outputs.",
      "Prospect data freshness — LinkedIn profiles may be out-of-date.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Namer — 3 slots
// ---------------------------------------------------------------------------

const namerSlots: [NamerArtifact, NamerArtifact, NamerArtifact] = [
  {
    names: [
      { name: "studioscript", domain: "studioscript.com", available: true },
      { name: "launchpadai", domain: "launchpadai.net", available: false, alternative_tld: "launchpadai.co" },
      { name: "agentstudio", domain: "agentstudio.io", available: true },
      { name: "shackio", domain: "shackio.com", available: false, alternative_tld: "shackio.net" },
      { name: "geminilabs", domain: "geminilabs.co", available: true },
    ],
  },
  {
    names: [
      { name: "launchkit", domain: "launchkit.ai", available: true },
      { name: "orbitlaunch", domain: "orbitlaunch.io", available: true },
      { name: "shipstack", domain: "shipstack.com", available: false, alternative_tld: "shipstack.io" },
      { name: "foundryai", domain: "foundryai.co", available: true },
      { name: "blastoff", domain: "blastoff.app", available: false, alternative_tld: "blastoff.dev" },
    ],
  },
  {
    names: [
      { name: "vaultlaunch", domain: "vaultlaunch.com", available: true },
      { name: "nineagents", domain: "nineagents.io", available: true },
      { name: "swiftkit", domain: "swiftkit.ai", available: false, alternative_tld: "swiftkit.dev" },
      { name: "pilotai", domain: "pilotai.co", available: true },
      { name: "deployfast", domain: "deployfast.app", available: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Designer — 3 slots (each includes a valid brandKit)
// ---------------------------------------------------------------------------

const designerSlots: [DesignerArtifact, DesignerArtifact, DesignerArtifact] = [
  {
    mockupUrl: null,
    exportedCode:
      '<div class="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6"><h1 class="text-5xl font-bold">Studio</h1><p class="mt-3 text-slate-400">Nine agents, one idea.</p></div>',
    logoUrl: null,
    logoVariants: [],
    palette: { primary: "#6366f1", secondary: "#0f172a", accent: "#38bdf8" },
    brandKit: {
      name: "Studio",
      tagline: "Nine agents. One idea. Ship.",
      primary: "#6366f1",
      secondary: "#0f172a",
      headlineFont: "Space Grotesk",
      bodyFont: "Inter",
      logoSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#6366f1"/><circle cx="32" cy="32" r="14" stroke="#ffffff" stroke-width="3" fill="none"/><line x1="32" y1="10" x2="32" y2="54" stroke="#ffffff" stroke-width="3"/><line x1="10" y1="32" x2="54" y2="32" stroke="#ffffff" stroke-width="3"/></svg>',
    },
  },
  {
    mockupUrl: null,
    exportedCode:
      '<div class="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6"><h1 class="text-5xl font-bold tracking-tight">LaunchKit</h1><p class="mt-3 text-gray-400">From idea to live in minutes.</p></div>',
    logoUrl: null,
    logoVariants: [],
    palette: { primary: "#10b981", secondary: "#064e3b", accent: "#34d399" },
    brandKit: {
      name: "LaunchKit",
      tagline: "From idea to live in minutes.",
      primary: "#10b981",
      secondary: "#064e3b",
      headlineFont: "Sora",
      bodyFont: "DM Sans",
      logoSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#10b981"/><path d="M32 12 L52 52 L32 42 L12 52 Z" stroke="#ffffff" stroke-width="3" fill="none" stroke-linejoin="round"/></svg>',
    },
  },
  {
    mockupUrl: null,
    exportedCode:
      '<div class="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6"><h1 class="text-5xl font-bold">VaultLaunch</h1><p class="mt-3 text-zinc-400">Your startup, deployed.</p></div>',
    logoUrl: null,
    logoVariants: [],
    palette: { primary: "#f59e0b", secondary: "#1c1917", accent: "#fbbf24" },
    brandKit: {
      name: "VaultLaunch",
      tagline: "Your startup, deployed.",
      primary: "#f59e0b",
      secondary: "#1c1917",
      headlineFont: "Bricolage Grotesque",
      bodyFont: "Work Sans",
      logoSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#f59e0b"/><rect x="16" y="20" width="32" height="28" rx="4" stroke="#ffffff" stroke-width="3" fill="none"/><path d="M24 20 L24 16 Q24 12 32 12 Q40 12 40 16 L40 20" stroke="#ffffff" stroke-width="3" fill="none"/><circle cx="32" cy="34" r="4" fill="#ffffff"/></svg>',
    },
  },
];

// ---------------------------------------------------------------------------
// Copywriter — 3 slots
// ---------------------------------------------------------------------------

const copywriterSlots: [CopywriterArtifact, CopywriterArtifact, CopywriterArtifact] = [
  {
    hero: {
      headline: "Launch Your Startup in Seconds with Studio",
      sub: "9 specialist AI agents working in parallel to build your positioning, branding, landing page, and legal docs instantly.",
    },
    features: [
      { title: "Parallel Specialists", body: "Copywriters, developers, growth hackers, and designers working simultaneously." },
      { title: "One-Click Deploy", body: "Beautiful, responsive landing pages deployed straight to Vercel instantly." },
      { title: "Grounded & Verified", body: "Domains checked live against registry APIs, legal docs reviewed for completeness." },
    ],
    faq: [
      { q: "How does Studio work?", a: "Studio orchestrates 9 specialized agents that take your startup idea and produce a unified launch kit." },
      { q: "Are the domains checked?", a: "Yes, domains are checked live against the Domainr API for availability." },
      { q: "Can I edit the outputs?", a: "All outputs are plain text or HTML — download and edit in any editor." },
      { q: "Is my idea stored?", a: "Ideas are used only to generate your kit and are not persisted beyond the session." },
      { q: "What agents run in parallel?", a: "Strategist, Namer, and Analyst run first; then Designer, Copywriter, and Legal; then Developer, Marketer, and Growth." },
    ],
    cta: "Start Launching",
  },
  {
    hero: {
      headline: "Nine Minds, One Mission: Ship Your Startup",
      sub: "Stop juggling tools. Studio deploys your brand, copy, and landing page before the pitch deck is done.",
    },
    features: [
      { title: "Brand in Seconds", body: "Fonts, colors, logo, and tagline generated and ready for your launch page." },
      { title: "Legal Docs Included", body: "Terms of service and privacy policy drafted and ready for counsel review." },
      { title: "Prospect Pipeline", body: "Growth agent surfaces three warm prospects based on your positioning." },
    ],
    faq: [
      { q: "What is Studio?", a: "A parallel-agent orchestrator that converts a one-line idea into a deployable startup kit." },
      { q: "Do I need API keys?", a: "For the live demo, the mock orchestrator runs without external keys." },
      { q: "How long does a run take?", a: "Typically under 5 minutes end-to-end with all nine agents." },
      { q: "Is the landing page editable?", a: "The Developer agent outputs raw HTML you can host anywhere." },
      { q: "What makes this different?", a: "Everything runs in parallel and the outputs share a coherent brand identity." },
    ],
    cta: "Build My Kit",
  },
  {
    hero: {
      headline: "From Idea to Live Site in Under Five Minutes",
      sub: "Studio's nine-agent mission control builds everything a startup needs to launch — simultaneously.",
    },
    features: [
      { title: "Competitor Teardown", body: "Analyst agent benchmarks your idea against three real competitors before you write a line of copy." },
      { title: "Positioning First", body: "Strategist defines your ICP and JTBD so every other agent writes to the same audience." },
      { title: "Real Domain Checks", body: "Namer queries live availability — no more falling in love with a taken .com." },
    ],
    faq: [
      { q: "Who built Studio?", a: "Built at Shack15 for the Google I/O Hackathon using Gemini Managed Agents." },
      { q: "Which agents run first?", a: "Strategist, Namer, and Analyst run in Wave 1 — all others depend on their output." },
      { q: "What is the tech stack?", a: "Node.js + Express SSE backend, Next.js 14 frontend, Gemini Managed Agents." },
      { q: "Can I re-run a single agent?", a: "Per-agent rerun is on the roadmap; full re-run is available today." },
      { q: "Is there a free tier?", a: "Studio is a hackathon demo — no pricing, no accounts, just ship." },
    ],
    cta: "Launch Now",
  },
];

// ---------------------------------------------------------------------------
// Developer — 3 slots (all include liveUrl)
// ---------------------------------------------------------------------------

const _deployedAt = "2026-05-23T17:00:00.000Z";

const developerSlots: [DeveloperArtifact, DeveloperArtifact, DeveloperArtifact] = [
  {
    liveUrl: "https://studio-demo.example.com",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Studio — Nine agents, one idea.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #09090b; color: #fafafa; font-family: 'Space Grotesk', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; }
    h1 { font-size: clamp(2rem, 6vw, 5rem); font-weight: 700; letter-spacing: -0.02em; }
    p { margin-top: 1rem; color: #a1a1aa; font-size: 1.125rem; max-width: 40ch; }
    a { display: inline-block; margin-top: 2rem; padding: 0.75rem 2rem; background: #6366f1; color: #fff; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: opacity 0.15s; }
    a:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <h1>Studio</h1>
  <p>Nine specialist AI agents. One idea. Ship in minutes.</p>
  <a href="#">Get Started</a>
</body>
</html>`,
    deployedAt: _deployedAt,
  },
  {
    liveUrl: "https://launchkit-demo.example.com",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LaunchKit — From idea to live in minutes.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #030712; color: #f9fafb; font-family: 'Sora', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; }
    h1 { font-size: clamp(2rem, 6vw, 5rem); font-weight: 700; }
    p { margin-top: 1rem; color: #9ca3af; font-size: 1.125rem; max-width: 40ch; }
    a { display: inline-block; margin-top: 2rem; padding: 0.75rem 2rem; background: #10b981; color: #fff; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
    a:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <h1>LaunchKit</h1>
  <p>From idea to live in minutes. Powered by nine AI specialists.</p>
  <a href="#">Build My Kit</a>
</body>
</html>`,
    deployedAt: _deployedAt,
  },
  {
    liveUrl: "https://vaultlaunch-demo.example.com",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VaultLaunch — Your startup, deployed.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0c0a09; color: #fafaf9; font-family: 'Bricolage Grotesque', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; }
    h1 { font-size: clamp(2rem, 6vw, 5rem); font-weight: 800; }
    p { margin-top: 1rem; color: #a8a29e; font-size: 1.125rem; max-width: 40ch; }
    a { display: inline-block; margin-top: 2rem; padding: 0.75rem 2rem; background: #f59e0b; color: #0c0a09; border-radius: 0.5rem; text-decoration: none; font-weight: 700; }
    a:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <h1>VaultLaunch</h1>
  <p>Your startup, deployed. Built in one session by nine AI agents.</p>
  <a href="#">Launch Now</a>
</body>
</html>`,
    deployedAt: _deployedAt,
  },
];

// ---------------------------------------------------------------------------
// Marketer — 3 slots
// ---------------------------------------------------------------------------

const marketerSlots: [MarketerArtifact, MarketerArtifact, MarketerArtifact] = [
  {
    tweet_thread: [
      "1/ Imagine launching your startup in 60 seconds. Introducing Studio.",
      "2/ 9 specialist AI agents working in parallel to scaffold your entire launch kit.",
      "3/ Brand positioning, live domains, marketing copy, and a deployed landing page.",
      "4/ Built at Shack15 for Google I/O Hackathon using Gemini Managed Agents.",
      "5/ Launch your next big thing today.",
    ],
    producthunt: {
      tagline: "9 specialist AI agents building your startup launch kit in parallel",
      description:
        "Input your idea and get a fully deployed landing page, branding, marketing copies, legal documents, and growth prospects in under 5 minutes.",
    },
    hn_show: "Show HN: Studio – 9 Specialist AI Agents Build & Deploy Your Startup Launch Kit in Parallel",
    linkedin_post:
      "Hackathons are about speed. Today at Shack15 we built Studio — launching a complete startup kit in under 5 minutes using 9 parallel AI agents powered by Gemini.",
  },
  {
    tweet_thread: [
      "1/ We just shipped Studio at the Google I/O Hackathon.",
      "2/ One idea in. Nine agents spin up: Strategist, Namer, Designer, Copywriter, Developer, Marketer, Growth, Legal, Analyst.",
      "3/ In under 5 minutes you have a live URL, a brand kit, legal docs, and a prospect list.",
      "4/ This is what building with Gemini Managed Agents looks like.",
      "5/ Open the demo and try your own idea.",
    ],
    producthunt: {
      tagline: "From one-line idea to live startup in under five minutes",
      description:
        "Studio runs nine AI agents in parallel — each a specialist — and converges on a deployed landing page, brand identity, competitor teardown, and legal drafts.",
    },
    hn_show: "Show HN: Studio – parallel AI agents that ship a startup kit from one idea",
    linkedin_post:
      "Most hackathon demos are slides. Ours is a live URL. Studio orchestrates 9 AI agents to go from idea to deployed product in minutes.",
  },
  {
    tweet_thread: [
      "1/ Nine agents. One idea. Zero waiting.",
      "2/ Studio runs Strategist + Namer + Analyst in Wave 1 — all parallel.",
      "3/ Wave 2: Designer + Copywriter + Legal build on Wave 1 output.",
      "4/ Wave 3: Developer deploys, Marketer drafts posts, Growth finds prospects.",
      "5/ Built for Google I/O Hackathon. Try it yourself.",
    ],
    producthunt: {
      tagline: "Ship a startup in minutes with nine parallel AI specialists",
      description:
        "Studio is a mission-control dashboard that orchestrates nine AI agents to produce a complete, branded, deployed product from a single line of text.",
    },
    hn_show: "Show HN: Studio – mission control for nine AI agents that ship your startup",
    linkedin_post:
      "What if nine specialists could work on your startup simultaneously? Studio does exactly that — nine AI agents, parallel execution, one launch kit.",
  },
];

// ---------------------------------------------------------------------------
// Growth — 3 slots
// ---------------------------------------------------------------------------

const growthSlots: [GrowthArtifact, GrowthArtifact, GrowthArtifact] = [
  {
    prospects: [
      {
        name: "Sarah Chen",
        role: "Managing Director",
        company: "Apex Ventures",
        linkedin: "https://linkedin.com/in/sarahchen-apex",
        why_fit: "Focuses on early-stage developer tools and AI productivity frameworks.",
        email_draft:
          "Hi Sarah, I saw your work on AI developer tools at Apex. We built Studio — a parallel-agent launcher that ships a full startup kit in minutes. Would love your take on the demo.",
      },
      {
        name: "David Miller",
        role: "VP of Product",
        company: "LaunchStack",
        linkedin: "https://linkedin.com/in/davidmiller-launchstack",
        why_fit: "Leads products that help startups deploy landing pages quickly.",
        email_draft:
          "Hi David, given LaunchStack's focus on rapid deployment I thought you'd appreciate Studio's nine-agent approach to producing a live site from one idea. Happy to share a demo link.",
      },
      {
        name: "Priya Nair",
        role: "Partner",
        company: "Founders Fund",
        linkedin: "https://linkedin.com/in/priyanair-ff",
        why_fit: "Invests in automation tools that reduce time-to-market for technical founders.",
        email_draft:
          "Hi Priya, following Founders Fund's interest in automation-first tools, I wanted to share Studio — we go from idea to deployed product in under five minutes using Gemini Managed Agents.",
      },
    ],
  },
  {
    prospects: [
      {
        name: "Marcus Tran",
        role: "Head of Platform",
        company: "YC Continuity",
        linkedin: "https://linkedin.com/in/marcustran-yc",
        why_fit: "Runs YC's platform programs for fast-moving early-stage companies.",
        email_draft:
          "Hi Marcus, Studio ships a full startup kit — branding, landing page, legal, and prospects — in minutes. Thought it might be relevant to YC founders in the current batch.",
      },
      {
        name: "Aisha Okonkwo",
        role: "CTO",
        company: "DevSprint",
        linkedin: "https://linkedin.com/in/aishaokonkwo",
        why_fit: "Builds internal tooling for engineering teams who need to move fast.",
        email_draft:
          "Hi Aisha, Studio's orchestrated agent pipeline mirrors patterns DevSprint uses internally. Would love to show you how we coordinate nine specialists in parallel.",
      },
      {
        name: "Tom Eriksen",
        role: "Founder",
        company: "ShipDeck",
        linkedin: "https://linkedin.com/in/tomeriksen-shipdeck",
        why_fit: "Building adjacent tooling for no-code startup launchers.",
        email_draft:
          "Hi Tom, big fan of ShipDeck. We built Studio to tackle the AI-native side of startup scaffolding — nine agents, parallel execution. Could be worth a quick sync.",
      },
    ],
  },
  {
    prospects: [
      {
        name: "Lin Wei",
        role: "Principal",
        company: "Index Ventures",
        linkedin: "https://linkedin.com/in/linwei-index",
        why_fit: "Backs developer-productivity and AI-first infrastructure companies.",
        email_draft:
          "Hi Lin, Studio is an AI-native product launcher that ships a complete startup kit in minutes. Given Index's developer-tools thesis, I'd love to show you a live demo.",
      },
      {
        name: "Jasmine Osei",
        role: "Director of Growth",
        company: "ProductHunt",
        linkedin: "https://linkedin.com/in/jasmineosei-ph",
        why_fit: "Curates top-of-funnel launches on ProductHunt — Studio's marketer agent produces PH copy automatically.",
        email_draft:
          "Hi Jasmine, Studio's Marketer agent auto-generates a ProductHunt listing from your idea. Thought you'd appreciate seeing it from the launch side.",
      },
      {
        name: "Carlos Ramos",
        role: "Engineer",
        company: "Vercel",
        linkedin: "https://linkedin.com/in/carlosramos-vercel",
        why_fit: "Works on Vercel's deployment tooling — Studio's Developer agent targets Vercel as the deploy target.",
        email_draft:
          "Hi Carlos, Studio's Developer agent produces and deploys an HTML site via the Vercel API. Would love your engineering perspective on the integration.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Legal — 3 slots
// ---------------------------------------------------------------------------

const legalSlots: [LegalArtifact, LegalArtifact, LegalArtifact] = [
  {
    terms_of_service: `# Terms of Service

*AI-generated draft — review with qualified counsel before use.*

**Effective date:** 2026-05-23

By accessing Studio you agree to these terms. We provide AI-generated startup kits on an "as is" basis without warranty of any kind. You accept full responsibility for any use of the generated content.

## Permitted use
You may use Studio-generated artifacts for commercial and non-commercial purposes provided you review all outputs for accuracy and compliance before publication.

## Limitation of liability
To the maximum extent permitted by law, Studio and its contributors are not liable for any damages arising from your use of generated content.`,
    privacy_policy: `# Privacy Policy

*AI-generated draft — review with qualified counsel before use.*

**Effective date:** 2026-05-23

We collect your startup idea solely to generate your launch kit. We do not store ideas beyond the current session, sell your data, or share it with third parties except the AI APIs used to generate your kit.`,
    liability_summary:
      "All liability for domain conflicts, code vulnerabilities, or legal invalidity lies with the end user. These drafts are not legal advice.",
  },
  {
    terms_of_service: `# Terms of Service

*AI-generated draft — review with qualified counsel before use.*

**Effective date:** 2026-05-23

Studio is a hackathon demonstration. Use of this service is at your own risk. Generated content including brand names, legal documents, and HTML may require revision before commercial use.

## Intellectual property
You retain ownership of the idea you input. Generated outputs are provided to you royalty-free for any purpose subject to these terms.

## Indemnity
You agree to indemnify Studio's contributors against any claim arising from your use of generated content.`,
    privacy_policy: `# Privacy Policy

*AI-generated draft — review with qualified counsel before use.*

**Effective date:** 2026-05-23

Data collected: your startup idea (session-only). We do not use cookies, analytics, or tracking scripts. No user accounts are created. Session data is discarded when the browser tab closes.`,
    liability_summary:
      "Generated legal documents are illustrative drafts only. Engage a qualified attorney before publishing terms or a privacy policy.",
  },
  {
    terms_of_service: `# Terms of Service

*AI-generated draft — review with qualified counsel before use.*

**Effective date:** 2026-05-23

These terms govern your use of Studio and any artifacts it produces. By using Studio you acknowledge that all outputs are AI-generated and may contain errors, omissions, or content unsuitable for your jurisdiction.

## Disclaimer of warranties
Studio is provided "as is". We make no warranties, express or implied, regarding merchantability, fitness for purpose, or accuracy of generated content.`,
    privacy_policy: `# Privacy Policy

*AI-generated draft — review with qualified counsel before use.*

**Effective date:** 2026-05-23

Studio processes your startup idea transiently to generate a launch kit. Your idea is sent to Google's Gemini API under Google's privacy terms. We do not persist, index, or monetise your inputs.`,
    liability_summary:
      "Outputs are provided for demonstration purposes only. No warranty is given. Users assume all risk for commercial, legal, or technical use.",
  },
];

// ---------------------------------------------------------------------------
// Analyst — 3 slots
// ---------------------------------------------------------------------------

const analystSlots: [AnalystArtifact, AnalystArtifact, AnalystArtifact] = [
  {
    competitors: [
      {
        name: "ShipFast",
        url: "https://shipfa.st",
        positioning: "Next.js boilerplate for solo founders",
        pricing: "$169 one-time",
        strength: "Large community, battle-tested code",
        weakness: "Manual deployment, no AI personalization",
      },
      {
        name: "Bolt",
        url: "https://bolt.new",
        positioning: "AI-assisted code generation in the browser",
        pricing: "Free tier + $20/mo pro",
        strength: "Real-time code generation, WebContainer runtime",
        weakness: "Single-agent, no brand or legal output",
      },
      {
        name: "v0 by Vercel",
        url: "https://v0.dev",
        positioning: "UI component generation from prompts",
        pricing: "Free tier + credits",
        strength: "High-quality Tailwind UI output",
        weakness: "UI only — no positioning, copy, or deployment",
      },
    ],
    market_gap:
      "No existing tool orchestrates multiple specialists (strategist, designer, copywriter, legal, growth) in a single parallel pipeline.",
    recommendation:
      "Target non-technical founders who want a complete branded kit, not just code. Emphasise time-to-live-URL as the core metric.",
  },
  {
    competitors: [
      {
        name: "Lovable",
        url: "https://lovable.dev",
        positioning: "AI full-stack app builder",
        pricing: "$20/mo starter",
        strength: "Iterative UI with Supabase integration",
        weakness: "No brand strategy, no legal, no marketing copy",
      },
      {
        name: "Durable",
        url: "https://durable.co",
        positioning: "AI website builder for small businesses",
        pricing: "$12/mo",
        strength: "Quick website generation with SEO",
        weakness: "Template-driven, no positioning or competitor analysis",
      },
      {
        name: "Mixo",
        url: "https://mixo.io",
        positioning: "AI landing page generator",
        pricing: "$9/mo",
        strength: "Fast single-page site generation",
        weakness: "No branding depth, no agents, no legal output",
      },
    ],
    market_gap:
      "All competitors focus on one output (code or website). None coordinate across brand, legal, growth, and deployment simultaneously.",
    recommendation:
      "Lead with the five-minute end-to-end demo. The deployed URL is the proof point no competitor can match in real-time.",
  },
  {
    competitors: [
      {
        name: "Cursor",
        url: "https://cursor.sh",
        positioning: "AI-first code editor",
        pricing: "$20/mo",
        strength: "Deep coding productivity, large user base",
        weakness: "Requires developer, no brand or legal output",
      },
      {
        name: "Webflow + Relume",
        url: "https://relume.io",
        positioning: "No-code + AI site builder",
        pricing: "$49/mo",
        strength: "Professional design output",
        weakness: "Design-only, requires manual copy and strategy",
      },
      {
        name: "Framer AI",
        url: "https://framer.com",
        positioning: "AI-generated landing pages",
        pricing: "Free tier + $15/mo",
        strength: "Beautiful animated sites",
        weakness: "No strategy, no competitor analysis, no legal",
      },
    ],
    market_gap:
      "The market has tools for each individual layer (design, code, copy) but nothing that composes them with shared brand context from a single input.",
    recommendation:
      "Focus on the judge demo: nine streams of live AI work visible simultaneously. That visual is the differentiator — lean into it.",
  },
];

interface DirectorArtifact {
  one_line_pitch: string;
  coherence_score: number;
  hot_take: string;
  unified_narrative: string;
  next_7_days: string[];
  inconsistencies: {
    severity: 'low' | 'medium' | 'high';
    issue: string;
    resolution: string;
  }[];
  confidence_by_agent: Record<string, number>;
}

const directorSlots: [DirectorArtifact, DirectorArtifact, DirectorArtifact] = [
  {
    one_line_pitch: "Studio is the ultimate launch-acceleration machine, turning raw startup concepts into fully-deployed landing pages, brand kits, and strategic assets in under five minutes.",
    coherence_score: 92,
    hot_take: "Highly cohesive B2B offering. The visual appeal of parallel agent execution is a massive demo moat, but long-term retention depends on letting users edit the generated code post-deployment rather than treating it as a static snapshot.",
    unified_narrative: "Studio solves the initial 'cold start' problem for new ideas. By running specialist agents in parallel—from strategist and namer to developer and legal—it delivers a unified, professional foundation in minutes rather than weeks.\n\nThe generated assets align tightly: the modern brand identity matches the high-converting copy, backed by verified domain availability and concrete legal drafts. This is the future of rapid prototyping.",
    next_7_days: [
      "Day 1: Deploy the landing page and hook up search analytics.",
      "Day 2: Finalize company formation documents and verify trademark availability.",
      "Day 3: Launch the first outbound email campaign targeting the 10 growth prospects.",
      "Day 4: Set up social channels (X, LinkedIn) with the marketer-generated templates.",
      "Day 5: Interview 3 potential customers to validate the value proposition.",
      "Day 6: Refine the landing page messaging based on customer feedback.",
      "Day 7: Launch on Product Hunt and Hacker News."
    ],
    inconsistencies: [
      {
        severity: "low",
        issue: "Minor styling variations between the designer's palette and the final developer-injected CSS.",
        resolution: "Inject the designer's exact hex codes directly into the global CSS template variables."
      }
    ],
    confidence_by_agent: {
      strategist: 95,
      namer: 90,
      designer: 85,
      copywriter: 90,
      developer: 80,
      marketer: 90,
      growth: 85,
      legal: 95,
      analyst: 90
    }
  },
  {
    one_line_pitch: "Studio coordinates specialized AI agents to deliver a comprehensive, professional startup launch kit from a single prompt.",
    coherence_score: 88,
    hot_take: "Excellent developer experience. Moving from sequential LLM chains to parallel waves cuts execution time by 70%. However, rate limit mitigation must be prioritized before scaling public access.",
    unified_narrative: "By structuring the launch flow into sequential dependency waves, Studio ensures downstream agents like the Copywriter and Developer have access to positioning and brand name choices. This results in a remarkably coherent marketing and product story.\n\nWhile each agent operates independently, the Director's final review ensures any minor brand drift is identified and corrected, giving founders an elite Strategic partner.",
    next_7_days: [
      "Day 1: Review naming options and register the top available domain.",
      "Day 2: Set up custom domains on Vercel for the live landing page.",
      "Day 3: Use the analyst competitor teardown to refine pricing plans.",
      "Day 4: Run a light cold outreach campaign targeting developers.",
      "Day 5: Draft privacy policies using the legal agent's template.",
      "Day 6: Test mobile responsiveness of the landing page.",
      "Day 7: Push the code to a public GitHub repository."
    ],
    inconsistencies: [
      {
        severity: "medium",
        issue: "The marketer post copy uses informal emojis while the legal drafts are highly formal.",
        resolution: "This is appropriate for the respective channels, but ensure the brand name spelling is consistent across both."
      }
    ],
    confidence_by_agent: {
      strategist: 90,
      namer: 85,
      designer: 80,
      copywriter: 95,
      developer: 75,
      marketer: 90,
      growth: 80,
      legal: 95,
      analyst: 85
    }
  },
  {
    one_line_pitch: "An AI-powered startup mission control that builds and deploys a complete strategic and marketing launch package in five minutes.",
    coherence_score: 85,
    hot_take: "Great visual storytelling. The cascade of agent work is highly engaging for pitch decks and live demos. To build a lasting company, transition the product from a one-time generator to an iterative workspace.",
    unified_narrative: "This startup is built around the core realization that early-stage validation is about speed. Studio provides an automated squad of specialists that eliminates the initial operational drag of naming, positioning, and page setup.\n\nThe resulting output is high-fidelity and cohesive, allowing non-technical founders to walk into meetings with a live, responsive web presence and a verified strategic roadmap.",
    next_7_days: [
      "Day 1: Setup Google Workspace on the new domain name.",
      "Day 2: Hook up Stripe Atlas for quick legal incorporation.",
      "Day 3: Refine the landing page hero copy using the copywriter's secondary drafts.",
      "Day 4: Cold outreach to the first 5 prospects on the growth list.",
      "Day 5: Publish the show HN post using the marketer's copy.",
      "Day 6: Set up basic search engine SEO titles and descriptions.",
      "Day 7: Collect user analytics from the landing page traffic."
    ],
    inconsistencies: [
      {
        severity: "low",
        issue: "Some prospects on the growth list may require manual email verification.",
        resolution: "Run the prospects list through an email validator tool before launching outreach."
      }
    ],
    confidence_by_agent: {
      strategist: 88,
      namer: 85,
      designer: 80,
      copywriter: 90,
      developer: 80,
      marketer: 85,
      growth: 80,
      legal: 90,
      analyst: 85
    }
  }
];

// ---------------------------------------------------------------------------
// Unified lookup
// ---------------------------------------------------------------------------

type ArtifactMap = {
  strategist: StrategistArtifact;
  namer: NamerArtifact;
  designer: DesignerArtifact;
  copywriter: CopywriterArtifact;
  developer: DeveloperArtifact;
  marketer: MarketerArtifact;
  growth: GrowthArtifact;
  legal: LegalArtifact;
  analyst: AnalystArtifact;
  director: DirectorArtifact;
};

const allSlots: { [K in keyof ArtifactMap]: [ArtifactMap[K], ArtifactMap[K], ArtifactMap[K]] } = {
  strategist: strategistSlots,
  namer: namerSlots,
  designer: designerSlots,
  copywriter: copywriterSlots,
  developer: developerSlots,
  marketer: marketerSlots,
  growth: growthSlots,
  legal: legalSlots,
  analyst: analystSlots,
  director: directorSlots,
};

/**
 * Return the pre-baked artifact for agentId, deterministically selected from
 * one of three slots by the hash of the idea string.
 */
export function getMockArtifact(agentId: AgentId, idea: string): ArtifactMap[AgentId] {
  if (agentId === 'director' && idea.toLowerCase().includes('dentist')) {
    return {
      one_line_pitch: "ReferralDentist is an automated B2B referral management network that simplifies patient transfers and tracking between general practitioners and dental specialists.",
      coherence_score: 88,
      hot_take: "General dentists hate sending patients into a black box. Specialists hate missing referral papers. The market opportunity is real, but success hinges entirely on getting low-tech clinics to adopt yet another portal. Focus on making referral submission dead simple, ideally via email-to-dashboard ingestion.",
      unified_narrative: "ReferralDentist bridges the communication gap in oral healthcare by replacing fax machines and paper slips with a secure HIPAA-compliant portal. When a GP dentist identifies a patient needing specialized care, they can instantly send digital X-rays, clinical notes, and tracking updates. This keeps the patient in the loop and ensures high-confidence transitions.\n\nOur specialists have structured a coherent launch system: the brand focuses on trust and security; the copywriter highlights time-savings for office admins; the legal framework covers critical HIPAA patient-privacy requirements; and the marketer addresses local outreach to build the referral network.",
      next_7_days: [
        "Day 1: Deploy the landing page with the 'ReferralDentist' brand and primary CTA for general practitioners.",
        "Day 2: Finalize HIPAA-compliant terms of service drafts and security outlines.",
        "Day 3: Reach out to 5 local GP dentists to interview them about their current fax referral patterns.",
        "Day 4: Reach out to 5 local orthodontists/oral surgeons to test their appetite for a receiving portal.",
        "Day 5: Run a mock referral through the developer-built landing page to check user flow friction.",
        "Day 6: Set up the growth prospect database with the initial 10 dentist profiles retrieved by the Growth Agent.",
        "Day 7: Launch the first marketing campaign targeting dental practice managers via LinkedIn/email."
      ],
      inconsistencies: [
        {
          severity: "medium",
          issue: "The namer suggested consumer-facing names like 'DentistSpace' but the copywriter targeted enterprise clinics. The positioning is B2B but some brand names sound B2C.",
          resolution: "Standardize the brand name to 'ReferralDentist' or 'DentiRefer' to emphasize B2B referral utility."
        }
      ],
      confidence_by_agent: {
        strategist: 90,
        namer: 80,
        designer: 85,
        copywriter: 90,
        developer: 80,
        marketer: 85,
        growth: 80,
        legal: 95,
        analyst: 90
      }
    } as any;
  }
  const slot = ideaSlot(idea);
  const slotTuple = allSlots[agentId as keyof ArtifactMap];
  return slotTuple[slot];
}
