import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnManagedAgent } from '../../../../../agents/_runtime/managedAgent.js';
import { DirectorOutput } from './schema.js';
import type { Run } from '@studio/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDirector(
  runSnapshot: Run,
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: any }) => void;
    onToolResult?: (result: any) => void;
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
    userMessage: `Analyze all specialist agent outputs for the idea: "${runSnapshot.idea}" and produce the strategic synthesis report.`,
    onChunk: callbacks?.onChunk || (() => {}),
    onToolCall: callbacks?.onToolCall || (() => {}),
    onToolResult: callbacks?.onToolResult || (() => {})
  });

  if (result.structured) {
    return result.structured as DirectorOutput;
  }

  // Fallback if parsing failed
  try {
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DirectorOutput;
    }
  } catch (err) {
    // handled below
  }

  throw new Error(`Failed to parse output from Director agent: ${result.output}`);
}
