/**
 * Developer agent runner with silent fallback.
 *
 * Runs the Developer agent to produce landing page HTML, then deploys via
 * Cloudflare Pages (mock or real). If the agent call or deploy fails for any
 * reason, a synthesized fallback page is deployed instead so the tile always
 * completes with a live URL -- no red error tiles on stage.
 */

import type { AgentRunner, Emit } from './runners.js';
import type { RunContext } from './runners.js';

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max) + '...';
}

export const developerRunner: AgentRunner = async (ctx: RunContext, emit: Emit) => {
  const { runDeveloper } = await import('../../../agents/developer/run.js');
  const { deployLandingPage } = await import('./deploy/cloudflare.js');
  const { synthesizeFallbackLanding } = await import('./deploy/fallbackLanding.js');

  const designerOut = ctx.upstream['designer'] as Record<string, unknown> | undefined;
  const copywriterOut = ctx.upstream['copywriter'] as Record<string, unknown> | undefined;
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandName = namerOut?.names?.[0]?.name ?? 'Studio';

  // Extract palette from designer output for fallback use.
  const palette = (designerOut?.['palette'] ?? {}) as Record<string, string>;

  // Attempt the real agent call + deploy. Any failure falls back silently.
  try {
    const result = await runDeveloper(designerOut ?? {}, copywriterOut ?? {}, {
      onChunk: (text) => emit({ agent_id: 'developer', type: 'chunk', payload: { text } }),
      onToolCall: (call) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `\n[tool] ${call.name}(...)\n` } }),
      onToolResult: (res) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `[result] ${truncate(JSON.stringify(res), 120)}\n` } }),
      runContext: ctx.runId ? { runId: ctx.runId, agentId: 'developer' } : undefined,
    });

    emit({ agent_id: 'developer', type: 'chunk', payload: { text: '\nDeploying landing page...\n' } });

    const brandSlug = result.projectPath || brandName;
    const { url: deployUrl, deployment_id: deploymentId } = await deployLandingPage({
      brandSlug,
      htmlPayload: { html: result.html },
    });

    emit({
      agent_id: 'developer',
      type: 'meta',
      payload: { deploy_url: deployUrl, deployment_id: deploymentId },
    });
    emit({ agent_id: 'developer', type: 'chunk', payload: { text: `\nLive site: ${deployUrl}\n` } });

    return {
      ...result,
      liveUrl: deployUrl,
      deploy_url: deployUrl,
      deployment_id: deploymentId,
      deployedAt: new Date().toISOString(),
    };
  } catch (err) {
    process.stderr.write(
      `[developer] agent or deploy failed (runId=${ctx.runId ?? 'n/a'}, brand=${brandName}): ${err instanceof Error ? err.message : String(err)}\n`,
    );
    emit({ agent_id: 'developer', type: 'chunk', payload: { text: '\n[ generating fallback landing page ]\n' } });

    const heroHeadline = typeof copywriterOut?.['hero_headline'] === 'string'
      ? copywriterOut['hero_headline']
      : undefined;
    const heroSubheadline = typeof copywriterOut?.['hero_subheadline'] === 'string'
      ? copywriterOut['hero_subheadline']
      : undefined;
    const ctaLabel = typeof copywriterOut?.['cta_text'] === 'string'
      ? copywriterOut['cta_text']
      : undefined;

    const fallback = synthesizeFallbackLanding({
      brandName,
      heroHeadline,
      heroSubheadline,
      ctaLabel,
      primary: palette['primary'],
      accent: palette['accent'] ?? palette['secondary'],
      surface: palette['background'] ?? palette['surface'],
    });

    emit({ agent_id: 'developer', type: 'chunk', payload: { text: '\nDeploying fallback landing page...\n' } });

    const { url: deployUrl, deployment_id: deploymentId } = await deployLandingPage({
      brandSlug: fallback.projectPath,
      htmlPayload: { html: fallback.html },
    });

    emit({
      agent_id: 'developer',
      type: 'meta',
      payload: { deploy_url: deployUrl, deployment_id: deploymentId },
    });
    emit({ agent_id: 'developer', type: 'chunk', payload: { text: `\nLive site: ${deployUrl}\n` } });

    return {
      html: fallback.html,
      projectPath: fallback.projectPath,
      liveUrl: deployUrl,
      deploy_url: deployUrl,
      deployment_id: deploymentId,
      deployedAt: new Date().toISOString(),
      tech_stack: ['HTML5', 'Tailwind CSS v3', 'Cloudflare Pages'],
      next_features: [],
      analytics_snippet: '',
    };
  }
};
