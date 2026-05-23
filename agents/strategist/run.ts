import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import { StrategistOutput } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runStrategist(
  idea: string,
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: any }) => void;
    onToolResult?: (result: any) => void;
  }
): Promise<StrategistOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let systemPrompt = fs.readFileSync(promptPath, 'utf8');
  systemPrompt = systemPrompt.replace('{{idea}}', idea);

  const result = await spawnManagedAgent({
    agentName: 'strategist',
    systemPrompt: systemPrompt,
    userMessage: `Analyze this startup idea: "${idea}"`,
    tools: [{ googleSearch: {} }], // Enable Google Search grounding
    onChunk: callbacks?.onChunk || (() => {}),
    onToolCall: callbacks?.onToolCall || (() => {}),
    onToolResult: callbacks?.onToolResult || (() => {})
  });

  if (result.structured) {
    return result.structured as StrategistOutput;
  }

  // Fallback if parsing failed
  try {
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as StrategistOutput;
    }
  } catch (err) {
    // handled below
  }

  throw new Error(`Failed to parse output from Strategist agent: ${result.output}`);
}
