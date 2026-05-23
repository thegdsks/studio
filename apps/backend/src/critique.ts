/**
 * Self-critique pass for agent artifacts.
 * After each agent succeeds, we ask Gemini Flash to rate the output and
 * produce a single-sentence improvement note. The result is stored on the
 * agent record and broadcast via a meta SSE event.
 */

import * as dotenv from 'dotenv';
dotenv.config();

// Timeout (ms) before we give up waiting for the critique call so it never
// blocks the overall run from being marked complete.
const CRITIQUE_TIMEOUT_MS = 15_000;

export interface CritiqueResult {
  score: number;
  critique: string;
}

interface CritiqueOpts {
  agentId: string;
  idea: string;
  artifact: unknown;
  abortSignal?: AbortSignal;
}

/** Return a mock score/critique without hitting the API — used in MOCK_ONLY mode. */
function mockCritique(): CritiqueResult {
  return {
    score: 78 + Math.floor(Math.random() * 18),
    critique: 'Could be more specific about the persona and outcomes.',
  };
}

/**
 * Call Gemini Flash to rate the agent artifact on a 0-100 scale and return
 * a one-sentence improvement note. Falls back to a safe default on any error
 * so the caller never crashes.
 */
export async function critiqueArtifact(opts: CritiqueOpts): Promise<CritiqueResult> {
  if (process.env['MOCK_ONLY'] === 'true') {
    return mockCritique();
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    // No key configured — return neutral fallback rather than crash.
    return { score: 0, critique: 'Quality check unavailable.' };
  }

  const prompt = `You are a strict editor reviewing the output of an AI agent named "${opts.agentId}" for a non-technical founder.

Their startup idea was: ${opts.idea}

The agent's output was:
${JSON.stringify(opts.artifact, null, 2)}

Rate the output on a 0 to 100 scale considering:
- Specificity (concrete, not generic)
- Actionability (the founder knows what to do)
- Coherence with the startup idea
- Production polish (no placeholders, no lorem ipsum)

Then write ONE sentence (under 90 chars) naming the SINGLE biggest specific improvement.

Do not use em dashes. Do not use emojis. Be direct.

Respond as JSON only, with this exact shape and no markdown wrapper:
{"score": <integer 0-100>, "critique": "<one sentence>"}`;

  const callPromise: Promise<CritiqueResult> = (async () => {
    try {
      // Dynamic import keeps the cold-start path light when critiques aren't used.
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey });

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const text = response.text ?? '';
      const parsed = JSON.parse(text) as { score?: unknown; critique?: unknown };

      const rawScore = typeof parsed.score === 'number' ? parsed.score : 0;
      const score = Math.min(100, Math.max(0, Math.round(rawScore)));
      const critique =
        typeof parsed.critique === 'string' && parsed.critique.trim().length > 0
          ? parsed.critique.trim()
          : 'Quality check unavailable.';

      return { score, critique };
    } catch {
      return { score: 0, critique: 'Quality check unavailable.' };
    }
  })();

  // Race against a hard timeout so a slow Gemini call never blocks the caller.
  const timeoutPromise: Promise<CritiqueResult> = new Promise((resolve) =>
    setTimeout(() => resolve({ score: 0, critique: 'Quality check unavailable.' }), CRITIQUE_TIMEOUT_MS),
  );

  return Promise.race([callPromise, timeoutPromise]);
}
