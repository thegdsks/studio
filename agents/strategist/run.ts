import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import { ollamaInference, OllamaUnavailableError } from '../_runtime/ollamaClient.js';
import { StrategistOutput } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RunCallbacks {
  onChunk?: (text: string) => void;
  onToolCall?: (call: { name: string; args: any }) => void;
  onToolResult?: (result: any) => void;
  /** Called when local Gemma actually produced the artifact (not on fallback). */
  onLocalRun?: () => void;
}

interface RunOptions {
  privacy_mode?: boolean;
}

const PRIVACY_FORCE_CLOUD =
  process.env['PRIVACY_FORCE_CLOUD'] === '1' ||
  process.env['PRIVACY_FORCE_CLOUD']?.toLowerCase() === 'true';

export async function runStrategist(
  idea: string,
  callbacks: RunCallbacks = {},
  opts: RunOptions = {},
): Promise<StrategistOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let systemPrompt = fs.readFileSync(promptPath, 'utf8');
  systemPrompt = systemPrompt.replace('{{idea}}', idea);

  if (opts.privacy_mode && !PRIVACY_FORCE_CLOUD) {
    try {
      const gemmaPrompt =
        systemPrompt.trim() +
        '\n\nReturn ONLY valid JSON matching: { "positioning": string, "icp": string, "jtbd": string, "three_risks": string[] }. No preamble, no markdown fences.';

      const result = await ollamaInference({
        systemPrompt: gemmaPrompt,
        userMessage: `Analyze this startup idea: "${idea}"`,
        responseSchema: 'json',
        onChunk: callbacks.onChunk,
        timeoutMs: 30_000,
      });

      if (isStrategistOutput(result.structured)) {
        callbacks.onLocalRun?.();
        // eslint-disable-next-line no-console
        console.log(`[gemma] strategist ok (${result.durationMs}ms)`);
        return result.structured;
      }
      throw new OllamaUnavailableError('[gemma] strategist output failed shape check');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[gemma] strategist unavailable, falling back to Gemini: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const result = await spawnManagedAgent({
    agentName: 'strategist',
    systemPrompt,
    userMessage: `Analyze this startup idea: "${idea}"`,
    tools: [{ googleSearch: {} }],
    onChunk: callbacks.onChunk ?? (() => {}),
    onToolCall: callbacks.onToolCall ?? (() => {}),
    onToolResult: callbacks.onToolResult ?? (() => {}),
  });

  if (result.structured && isStrategistOutput(result.structured)) {
    return result.structured;
  }
  const jsonMatch = result.output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]) as StrategistOutput;
    return parsed;
  }
  throw new Error(`Failed to parse output from Strategist agent: ${result.output}`);
}

function isStrategistOutput(value: unknown): value is StrategistOutput {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.positioning === 'string' &&
    typeof v.icp === 'string' &&
    typeof v.jtbd === 'string' &&
    Array.isArray(v.three_risks) &&
    v.three_risks.every((x) => typeof x === 'string')
  );
}
