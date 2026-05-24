import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import type { RunContext } from '../_runtime/costRecorder.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DeveloperOutput } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDeveloper(
  designerOutput: unknown,
  copywriterOutput: unknown,
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: unknown }) => void;
    onToolResult?: (result: unknown) => void;
    runContext?: RunContext;
  }
): Promise<DeveloperOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let systemPrompt = fs.readFileSync(promptPath, 'utf8');
  systemPrompt = systemPrompt
    .replace('{{designerOutput}}', JSON.stringify(designerOutput, null, 2))
    .replace('{{copywriterOutput}}', JSON.stringify(copywriterOutput, null, 2));

  // No tools -- the agent returns structured JSON directly.
  // Deployment is handled by the runner wrapper after this call returns.
  const result = await spawnManagedAgent({
    agentName: 'developer',
    systemPrompt: systemPrompt,
    userMessage: `Build the complete production-ready HTML landing page. Return only the JSON object described in your instructions.`,
    onChunk: callbacks?.onChunk ?? (() => {}),
    onToolCall: callbacks?.onToolCall ?? (() => {}),
    onToolResult: callbacks?.onToolResult ?? (() => {}),
    runContext: callbacks?.runContext,
  });

  if (result.structured) {
    return result.structured as DeveloperOutput;
  }

  try {
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DeveloperOutput;
    }
  } catch {
    // handled below
  }

  throw new Error(`Failed to parse output from Developer agent: ${result.output.slice(0, 200)}`);
}
