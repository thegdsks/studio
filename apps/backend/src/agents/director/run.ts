import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnManagedAgent } from '../../../../../agents/_runtime/managedAgent.js';
import type { RunContext } from '../../../../../agents/_runtime/costRecorder.js';
import { assertDirectorBriefing } from './schema.js';
import type { DirectorOutput } from './schema.js';
import type { Run } from '@studio/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDirector(
  runSnapshot: Run,
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: unknown }) => void;
    onToolResult?: (result: unknown) => void;
    runContext?: RunContext;
  }
): Promise<DirectorOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let systemPrompt = fs.readFileSync(promptPath, 'utf8');

  // Serialize all 9 specialist agent outputs
  const contextParts: string[] = [];
  for (const [agentId, agent] of Object.entries(runSnapshot.agents)) {
    if (agentId === 'director') continue;
    contextParts.push(`### Agent: ${agent.name} (${agentId})
Status: ${agent.status}
Output:
${JSON.stringify(agent.finalArtifact || agent.streamedText || 'No output.', null, 2)}
`);
  }
  const contextString = contextParts.join('\n\n');

  systemPrompt = systemPrompt
    .replace('{{idea}}', runSnapshot.idea)
    .replace('{{context}}', contextString);

  const result = await spawnManagedAgent({
    agentName: 'director',
    systemPrompt: systemPrompt,
    userMessage: `Analyze all specialist agent outputs for the idea: "${runSnapshot.idea}" and produce the strategic synthesis report with executive briefing.`,
    onChunk: callbacks?.onChunk ?? (() => {}),
    onToolCall: callbacks?.onToolCall ?? (() => {}),
    onToolResult: callbacks?.onToolResult ?? (() => {}),
    runContext: callbacks?.runContext,
  });

  let parsed: unknown;

  if (result.structured) {
    parsed = result.structured;
  } else {
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Director output');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      throw new Error(
        `[Director] Failed to parse JSON from output: ${err instanceof Error ? err.message : String(err)}\n\nRaw output:\n${result.output.slice(0, 500)}`,
      );
    }
  }

  const obj = parsed as Record<string, unknown>;

  // Validate the briefing block loudly. No silent fallbacks.
  assertDirectorBriefing(obj['briefing']);

  return parsed as DirectorOutput;
}
