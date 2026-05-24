import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import type { RunContext } from '../_runtime/costRecorder.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GrowthOutput } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runGrowth(opts: {
  brandName: string;
  positioning: string;
  idea: string;
  runContext?: RunContext;
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: unknown }) => void;
    onToolResult?: (result: unknown) => void;
  }
}): Promise<GrowthOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let systemPrompt = fs.readFileSync(promptPath, 'utf8');
  systemPrompt = systemPrompt
    .replace('{{brandName}}', opts.brandName)
    .replace('{{positioning}}', opts.positioning)
    .replace('{{idea}}', opts.idea);

  const result = await spawnManagedAgent({
    agentName: 'growth',
    systemPrompt: systemPrompt,
    userMessage: `Synthesize 10 realistic growth prospects for ${opts.brandName}`,
    onChunk: opts.callbacks?.onChunk ?? (() => {}),
    onToolCall: opts.callbacks?.onToolCall ?? (() => {}),
    onToolResult: opts.callbacks?.onToolResult ?? (() => {}),
    runContext: opts.runContext,
  });

  if (result.structured) {
    return result.structured as GrowthOutput;
  }

  try {
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as GrowthOutput;
    }
  } catch (err) {
    // handled below
  }

  throw new Error(`Failed to parse output from Growth agent: ${result.output}`);
}
