import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DeveloperOutput } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDeveloper(
  designerOutput: any,
  copywriterOutput: any,
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: any }) => void;
    onToolResult?: (result: any) => void;
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

  const tools = [
    {
      functionDeclarations: [
        {
          name: "deploy",
          description: "Deploy the compiled HTML landing page to Vercel.",
          parameters: {
            type: "OBJECT",
            properties: {
              html: { type: "STRING", description: "The complete HTML code of the website to deploy." },
              projectPath: { type: "STRING", description: "A unique URL path slug based on the brand (e.g. brandname-landing)." }
            },
            required: ["html", "projectPath"]
          }
        }
      ]
    }
  ];

  const result = await spawnManagedAgent({
    agentName: 'developer',
    systemPrompt: systemPrompt,
    userMessage: `Deploy the merged landing page website to Vercel`,
    tools: tools,
    onChunk: callbacks?.onChunk || (() => {}),
    onToolCall: callbacks?.onToolCall || (() => {}),
    onToolResult: callbacks?.onToolResult || (() => {})
  });

  if (result.structured) {
    return result.structured as DeveloperOutput;
  }

  try {
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DeveloperOutput;
    }
  } catch (err) {
    // handled below
  }

  throw new Error(`Failed to parse output from Developer agent: ${result.output}`);
}
