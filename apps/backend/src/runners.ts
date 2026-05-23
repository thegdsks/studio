import type { AgentId, AgentEvent } from '@studio/shared';
import { getMockArtifact } from './mockArtifacts.js';
import { getRun } from './store.js';

// ---- types ----------------------------------------------------------------

export interface RunContext {
  idea: string;
  upstream: Partial<Record<AgentId, unknown>>;
  runId?: string;
  /** When true, privacy-eligible agents try local Gemma before cloud Gemini. */
  privacy_mode?: boolean;
  /**
   * User feedback supplied via POST /refine. When present the orchestrator
   * pre-emits a visible chunk so the user sees the iteration is in progress.
   * The underlying runner call is unchanged — the feedback is advisory.
   */
  refine_feedback?: string;
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

// ---- fake runner (deterministic from idea hash) ----------------------------

function makeFakeRunner(agentId: AgentId): AgentRunner {
  return async (ctx: RunContext, emit: Emit): Promise<unknown> => {
    const artifact = getMockArtifact(agentId, ctx.idea);
    const text = JSON.stringify(artifact, null, 2);
    // Preamble so the card shows activity immediately
    emit({ agent_id: agentId, type: 'chunk', payload: { text: `Analyzing: ${ctx.idea.slice(0, 60)}\n\n` } });
    await streamAsTokens(text, agentId, emit);
    return artifact;
  };
}

// ---- real runners ----------------------------------------------------------

const strategistRunner: AgentRunner = async (ctx, emit) => {
  const { runStrategist } = await import('../../../agents/strategist/run.js');
  const result = await runStrategist(
    ctx.idea,
    {
      onChunk: (text) => emit({ agent_id: 'strategist', type: 'chunk', payload: { text } }),
      onToolCall: (call) => emit({ agent_id: 'strategist', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
      onToolResult: (res) => emit({ agent_id: 'strategist', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(res), 120)}\n` } }),
      onLocalRun: () => emit({ agent_id: 'strategist', type: 'meta', payload: { ranLocally: true } }),
    },
    {
      privacy_mode: ctx.privacy_mode,
      runContext: ctx.runId ? { runId: ctx.runId, agentId: 'strategist' } : undefined,
    },
  );
  return result;
};

const copywriterRunner: AgentRunner = async (ctx, emit) => {
  const { runCopywriter } = await import('../../../agents/copywriter/run.js');

  const strategistOut = ctx.upstream['strategist'] as Record<string, string> | undefined;
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;

  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';
  const positioning = strategistOut?.['positioning'] ?? ctx.idea;
  const icp = strategistOut?.['icp'] ?? 'Founders and builders';

  emit({ agent_id: 'copywriter', type: 'chunk', payload: { text: `Crafting copy for ${brandName}…\n` } });

  const result = await runCopywriter({
    brandName,
    positioning,
    icp,
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'copywriter' } : undefined,
  });

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

  const result = await runMarketer({
    brandName,
    positioning,
    copywriterOutput: copywriterOut ?? {},
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'marketer' } : undefined,
  });

  const text = JSON.stringify(result, null, 2);
  await streamAsTokens(text, 'marketer', emit);

  return result;
};

const legalRunner: AgentRunner = async (ctx, emit) => {
  const { runLegal } = await import('../../../agents/legal/run.js');

  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';

  emit({ agent_id: 'legal', type: 'chunk', payload: { text: `Drafting terms for ${brandName}…\n` } });

  const result = await runLegal({
    brandName,
    businessType: 'AI SaaS startup platform',
    privacy_mode: ctx.privacy_mode,
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'legal' } : undefined,
    callbacks: {
      onLocalRun: () => emit({ agent_id: 'legal', type: 'meta', payload: { ranLocally: true } }),
    },
  });

  const text = JSON.stringify(result, null, 2);
  await streamAsTokens(text, 'legal', emit);

  return result;
};

const namerRunner: AgentRunner = async (ctx, emit) => {
  const { runNamer } = await import('../../../agents/namer/run.js');
  emit({ agent_id: 'namer', type: 'chunk', payload: { text: `Searching for creative brand names…\n` } });
  const result = await runNamer({
    idea: ctx.idea,
    vibe: 'modern, clean, premium tech',
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'namer' } : undefined,
  });
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
    onToolResult: (res) => emit({ agent_id: 'designer', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(res), 120)}\n` } }),
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'designer' } : undefined,
  });

  // Banana post-processing: turn the palette into a real branding mockup that
  // BrandPreview can render. Failure is non-fatal — we keep the agent's output
  // and the preview still shows the swatches + brand name.
  if (ctx.runId) {
    try {
      emit({ agent_id: 'designer', type: 'chunk', payload: { text: '\n🍌 generating banana backdrop…\n' } });
      const { generateBackdrop, composeBrandingSvg } = await import('../../../agents/_tools/banana.js');
      const { saveMedia } = await import('./media.js');

      const palette = (result as { palette?: { primary: string; secondary: string; accent: string } }).palette;
      const primary = palette?.primary ?? '#3B82F6';
      const secondary = palette?.secondary ?? palette?.accent ?? '#22D3EE';

      const backdrop = await generateBackdrop({
        brief: `Hero backdrop for "${brandName}", a startup whose positioning is: ${positioning.slice(0, 200)}. Premium, calm, abstract. Color story uses ${primary} and ${secondary}.`,
        palette: { primary, secondary },
        aspectRatio: '3:2',
        runContext: ctx.runId ? { runId: ctx.runId, agentId: 'designer' } : undefined,
      });

      const saved = saveMedia({
        runId: ctx.runId,
        agentId: 'designer',
        slug: 'hero-backdrop',
        kind: 'backdrop',
        mime: 'image/png',
        bytes: backdrop.pngBytes,
        prompt: backdrop.promptUsed,
        width: 1200,
        height: 800,
      });
      emit({ agent_id: 'designer', type: 'chunk', payload: { text: `↪︎ backdrop saved (${Math.round(backdrop.pngBytes.length / 1024)}KB) ${saved.url}\n` } });

      const svg = composeBrandingSvg({
        backdropPngBytes: backdrop.pngBytes,
        brandName,
        tagline: positioning.length > 80 ? positioning.slice(0, 77) + '…' : positioning,
        headlineFont: 'Space Grotesk',
        bodyFont: 'Inter',
        primary,
        surface: '#0A0A0F',
        width: 1200,
        height: 800,
      });

      const composed = saveMedia({
        runId: ctx.runId,
        agentId: 'designer',
        slug: 'hero',
        kind: 'mockup',
        mime: 'image/svg+xml',
        bytes: svg,
        prompt: `composed brand SVG for ${brandName}`,
        width: 1200,
        height: 800,
      });
      emit({ agent_id: 'designer', type: 'chunk', payload: { text: `↪︎ composed brand mockup ${composed.url}\n` } });

      const enriched = {
        ...(result as unknown as Record<string, unknown>),
        mockupUrl: composed.url,
        brandKit: {
          name: brandName,
          tagline: positioning.length > 120 ? positioning.slice(0, 117) + '…' : positioning,
          primary,
          secondary,
          surface: '#0F1015',
          headlineFont: 'Space Grotesk' as const,
          bodyFont: 'Inter' as const,
          logoUrl: (result as { logoUrl?: string }).logoUrl,
        },
        media: {
          backdropUrl: saved.url,
          composedUrl: composed.url,
        },
      };
      return enriched;
    } catch (err) {
      emit({
        agent_id: 'designer',
        type: 'chunk',
        payload: { text: `↪︎ banana skipped (${err instanceof Error ? err.message.slice(0, 80) : 'unknown'})\n` },
      });
      // Fall through to original result — non-fatal.
    }
  }

  return result;
};

const developerRunner: AgentRunner = async (ctx, emit) => {
  const { runDeveloper } = await import('../../../agents/developer/run.js');
  const { deployLandingPage } = await import('./deploy/cloudflare.js');

  const designerOut = ctx.upstream['designer'];
  const copywriterOut = ctx.upstream['copywriter'];
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandSlug = namerOut?.names?.[0]?.name ?? 'studio';

  const result = await runDeveloper(designerOut ?? {}, copywriterOut ?? {}, {
    onChunk: (text) => emit({ agent_id: 'developer', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `\n[tool] ${call.name}(…)\n` } }),
    onToolResult: (res) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `[result] ${truncate(JSON.stringify(res), 120)}\n` } }),
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'developer' } : undefined,
  });

  // Deploy the generated landing page (real or stubbed via DEPLOY_ENABLED).
  emit({ agent_id: 'developer', type: 'chunk', payload: { text: '\nDeploying landing page...\n' } });

  const { url: deployUrl, deployment_id: deploymentId } = await deployLandingPage({
    brandSlug,
    htmlPayload: { html: result.html },
  });

  // Broadcast deploy fields via meta so the SSE client can update the card
  // before finalArtifact lands.
  emit({
    agent_id: 'developer',
    type: 'meta',
    payload: { deploy_url: deployUrl, deployment_id: deploymentId },
  });

  emit({
    agent_id: 'developer',
    type: 'chunk',
    payload: { text: `\nLive site: ${deployUrl}\n` },
  });

  // Merge deploy_url into the artifact. The orchestrator persists this via
  // updateAgent(finalArtifact), so deploy_url is available to late-joining
  // clients via agent.finalArtifact.liveUrl / agent.finalArtifact.deploy_url.
  return {
    ...result,
    liveUrl: result.liveUrl ?? deployUrl,
    deploy_url: deployUrl,
    deployment_id: deploymentId,
  };
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
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'growth' } : undefined,
    callbacks: {
      onChunk: (text) => emit({ agent_id: 'growth', type: 'chunk', payload: { text } }),
      onToolCall: (call) => emit({ agent_id: 'growth', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
      onToolResult: (res) => emit({ agent_id: 'growth', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(res), 120)}\n` } }),
    }
  });
  return result;
};

const analystRunner: AgentRunner = async (ctx, emit) => {
  const { runAnalyst } = await import('../../../agents/analyst/run.js');

  const result = await runAnalyst(ctx.idea, {
    onChunk: (text) => emit({ agent_id: 'analyst', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'analyst', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
    onToolResult: (res) => emit({ agent_id: 'analyst', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(res), 120)}\n` } }),
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'analyst' } : undefined,
  });
  return result;
};

const directorRunner: AgentRunner = async (ctx, emit) => {
  const { runDirector } = await import('./agents/director/run.js');
  if (!ctx.runId) {
    throw new Error('runId is required for director agent');
  }
  const runSnapshot = getRun(ctx.runId);
  if (!runSnapshot) {
    throw new Error(`Run not found for ID: ${ctx.runId}`);
  }
  const result = await runDirector(runSnapshot, {
    onChunk: (text) => emit({ agent_id: 'director', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'director', type: 'chunk', payload: { text: `\n🔧 ${call.name}(…)\n` } }),
    onToolResult: (res) => emit({ agent_id: 'director', type: 'chunk', payload: { text: `↩️ ${truncate(JSON.stringify(res), 120)}\n` } }),
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'director' } : undefined,
  });
  return result;
};

// ---- registry --------------------------------------------------------------

const realRunners: Partial<Record<AgentId, AgentRunner>> = {
  strategist: strategistRunner,
  copywriter: copywriterRunner,
  marketer: marketerRunner,
  legal: legalRunner,
  namer: namerRunner,
  designer: designerRunner,
  developer: developerRunner,
  growth: growthRunner,
  analyst: analystRunner,
  director: directorRunner,
};

// All 9 agents wired to deterministic fake streamers — used when MOCK_ONLY is set.
const fakeRunners: Partial<Record<AgentId, AgentRunner>> = {
  strategist: makeFakeRunner('strategist'),
  copywriter: makeFakeRunner('copywriter'),
  marketer:   makeFakeRunner('marketer'),
  legal:      makeFakeRunner('legal'),
  namer:      makeFakeRunner('namer'),
  designer:   makeFakeRunner('designer'),
  developer:  makeFakeRunner('developer'),
  growth:     makeFakeRunner('growth'),
  analyst:    makeFakeRunner('analyst'),
  director:   makeFakeRunner('director'),
};

export const MOCK_ONLY =
  process.env['MOCK_ONLY'] === 'true' || process.env['MOCK_ONLY'] === '1';

if (MOCK_ONLY) {
  // eslint-disable-next-line no-console
  console.log(
    '[runners] MOCK_ONLY=true — every agent uses fake streamer (zero API cost)',
  );
}

export const agentRunners: Partial<Record<AgentId, AgentRunner>> = MOCK_ONLY
  ? fakeRunners
  : realRunners;

// Exported so orchestrator can fall back without duplicating mock data.
export { makeFakeRunner };
