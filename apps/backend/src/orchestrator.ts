import type { AgentId } from '@studio/shared';
import { getRun, updateAgent, emit, stampRunFinished } from './store.js';
import { agentRunners } from './runners.js';
import type { RunContext } from './runners.js';

// Mock data fallback (mirrors runners.ts mockDataMap for error recovery)
const fallbackArtifacts: Partial<Record<AgentId, unknown>> = {
  strategist: {
    positioning: "A workspace for specialist agents working in parallel to launch startups instantly.",
    icp: "Solo founders, hackathon participants, and early-stage startup teams.",
    jtbd: "Create a complete startup launch kit in under 5 minutes.",
  },
  namer: {
    names: [
      { name: "agentstudio", domain: "agentstudio.io", available: true },
      { name: "studioscript", domain: "studioscript.com", available: true },
    ],
  },
  designer: {
    mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    palette: { primary: "#0f172a", secondary: "#6366f1", accent: "#38bdf8" },
  },
  copywriter: {
    hero: { headline: "Launch Your Startup Instantly", sub: "9 agents, one idea." },
    features: [],
    faq: [],
    cta: "Get Started",
  },
  developer: {
    liveUrl: "https://studio-demo-app.vercel.app",
    html: "<!DOCTYPE html><html><head><title>Studio</title></head><body><h1>Studio</h1></body></html>",
  },
  marketer: {
    tweet_thread: ["1/ Launching with Studio today! 🚀"],
    producthunt: { tagline: "Launch kit from one idea", description: "9 agents build your startup." },
    hn_show: "Show HN: Studio – Launch a startup in 5 minutes",
    linkedin_post: "Launching a startup used to take weeks. Not anymore.",
  },
  growth: {
    prospects: [{ name: "Sarah Chen", role: "MD", company: "Apex Ventures", linkedin: "https://linkedin.com/in/sarahchen" }],
  },
  legal: {
    terms_of_service: "# Terms of Service\n\nAI-generated draft. Review with counsel.",
    privacy_policy: "# Privacy Policy\n\nAI-generated draft. Review with counsel.",
    liability_summary: "User assumes all liability for generated content.",
  },
  analyst: {
    competitors: [{ name: "ShipFast", url: "https://shipfa.st", weakness: "No AI personalization" }],
    market_gap: "Zero-code parallel automation for complete startup kits.",
  },
};

async function runAgent(
  runId: string,
  agentId: AgentId,
  ctx: RunContext,
): Promise<unknown> {
  const runner = agentRunners[agentId];

  // Signal running
  updateAgent(runId, agentId, { status: 'running', startedAt: Date.now() });
  emit(runId, { agent_id: agentId, type: 'status', payload: { status: 'running' } });

  try {
    if (!runner) throw new Error(`No runner registered for ${agentId}`);

    const artifact = await runner(ctx, (event) => {
      // Mirror chunk events into streamedText on the run
      if (event.type === 'chunk' && event.agent_id === agentId) {
        const run = getRun(runId);
        if (run) {
          run.agents[agentId].streamedText += event.payload.text;
        }
      }
      emit(runId, event);
    });

    updateAgent(runId, agentId, {
      status: 'done',
      finishedAt: Date.now(),
      finalArtifact: artifact,
    });
    emit(runId, { agent_id: agentId, type: 'result', payload: { artifact } });
    emit(runId, { agent_id: agentId, type: 'status', payload: { status: 'done' } });

    return artifact;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[orchestrator] ${agentId} failed:`, err);

    // Emit error, then fall back so demo always shows something
    emit(runId, { agent_id: agentId, type: 'error', payload: { message } });

    const fallback = fallbackArtifacts[agentId] ?? {};
    updateAgent(runId, agentId, {
      status: 'error',
      finishedAt: Date.now(),
      error: message,
      finalArtifact: fallback,
    });
    emit(runId, { agent_id: agentId, type: 'result', payload: { artifact: fallback } });
    emit(runId, { agent_id: agentId, type: 'status', payload: { status: 'error' } });

    return fallback;
  }
}

function getArtifact(runId: string, agentId: AgentId): unknown {
  const run = getRun(runId);
  return run?.agents[agentId]?.finalArtifact;
}

export async function startRun(runId: string): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const { idea } = run;

  // ---- WAVE 1: strategist, namer, analyst (depends only on idea) ----------
  await Promise.allSettled([
    runAgent(runId, 'strategist', { idea, upstream: {} }),
    runAgent(runId, 'namer', { idea, upstream: {} }),
    runAgent(runId, 'analyst', { idea, upstream: {} }),
  ]);

  const strategistArtifact = getArtifact(runId, 'strategist');
  const namerArtifact = getArtifact(runId, 'namer');
  const analystArtifact = getArtifact(runId, 'analyst');

  const wave1Upstream: Partial<Record<AgentId, unknown>> = {
    strategist: strategistArtifact,
    namer: namerArtifact,
    analyst: analystArtifact,
  };

  // ---- WAVE 2: copywriter, designer, legal (need wave 1) ------------------
  await Promise.allSettled([
    runAgent(runId, 'copywriter', { idea, upstream: wave1Upstream }),
    runAgent(runId, 'designer', { idea, upstream: wave1Upstream }),
    runAgent(runId, 'legal', { idea, upstream: wave1Upstream }),
  ]);

  const copywriterArtifact = getArtifact(runId, 'copywriter');
  const designerArtifact = getArtifact(runId, 'designer');
  const legalArtifact = getArtifact(runId, 'legal');

  const wave2Upstream: Partial<Record<AgentId, unknown>> = {
    ...wave1Upstream,
    copywriter: copywriterArtifact,
    designer: designerArtifact,
    legal: legalArtifact,
  };

  // ---- WAVE 3: developer, marketer, growth (need waves 1+2) ---------------
  await Promise.allSettled([
    runAgent(runId, 'developer', { idea, upstream: wave2Upstream }),
    runAgent(runId, 'marketer', { idea, upstream: wave2Upstream }),
    runAgent(runId, 'growth', { idea, upstream: wave2Upstream }),
  ]);

  // ---- done ----------------------------------------------------------------
  stampRunFinished(runId);
  emit(runId, { agent_id: '__run', type: 'complete', payload: { run_id: runId } });
}
