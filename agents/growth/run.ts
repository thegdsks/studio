import { spawnManagedAgent } from '../_runtime/managedAgent.js';
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
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: any }) => void;
    onToolResult?: (result: any) => void;
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

  // Declare apolloSearch tool for the Managed Agent Sandbox to call
  const tools = [
    {
      functionDeclarations: [
        {
          name: "apolloSearch",
          description: "Search Apollo's database for targeted professional profiles.",
          parameters: {
            type: "OBJECT",
            properties: {
              titles: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of job titles to search for (e.g. ['CEO', 'Founder', 'VP of Product'])."
              },
              keywords: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of industry or company keywords (e.g. ['AI', 'SaaS', 'Marketing'])."
              }
            },
            required: ["titles", "keywords"]
          }
        }
      ]
    }
  ];

  const result = await spawnManagedAgent({
    agentName: 'growth',
    systemPrompt: systemPrompt,
    userMessage: `Find growth leads and compile prospects for ${opts.brandName}`,
    tools: tools,
    onChunk: opts.callbacks?.onChunk || (() => {}),
    onToolCall: opts.callbacks?.onToolCall || (() => {}),
    onToolResult: opts.callbacks?.onToolResult || (() => {})
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
