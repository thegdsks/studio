import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DesignerOutput } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDesigner(
  brandName: string,
  positioning: string,
  callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: { name: string; args: any }) => void;
    onToolResult?: (result: any) => void;
  }
): Promise<DesignerOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let systemPrompt = fs.readFileSync(promptPath, 'utf8');
  systemPrompt = systemPrompt
    .replace('{{brandName}}', brandName)
    .replace('{{positioning}}', positioning);

  // Declare tools for the Managed Agent Sandbox to call
  const tools = [
    {
      functionDeclarations: [
        {
          name: "generateLogo",
          description: "Generate a custom logo image URL and variants for the brand name.",
          parameters: {
            type: "OBJECT",
            properties: {
              brand: { type: "STRING", description: "The brand name to generate a logo for." },
              vibe: { type: "STRING", description: "The visual style or vibe." }
            },
            required: ["brand", "vibe"]
          }
        },
        {
          name: "stitchGenerate",
          description: "Generate landing page HTML code and mockup URL based on a brief and style.",
          parameters: {
            type: "OBJECT",
            properties: {
              brief: { type: "STRING", description: "Brief description of landing page sections and content." },
              style: { type: "STRING", description: "Design style layout." }
            },
            required: ["brief", "style"]
          }
        }
      ]
    }
  ];

  const result = await spawnManagedAgent({
    agentName: 'designer',
    systemPrompt: systemPrompt,
    userMessage: `Create the visual identity and mockups for the brand: ${brandName}`,
    tools: tools,
    onChunk: callbacks?.onChunk || (() => {}),
    onToolCall: callbacks?.onToolCall || (() => {}),
    onToolResult: callbacks?.onToolResult || (() => {})
  });

  if (result.structured) {
    return result.structured as DesignerOutput;
  }

  try {
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DesignerOutput;
    }
  } catch (err) {
    // handled below
  }

  throw new Error(`Failed to parse output from Designer agent: ${result.output}`);
}
