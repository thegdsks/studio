import { spawnManagedAgent } from '../_runtime/managedAgent.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function runAnalyst(idea, callbacks) {
    let promptPath = path.join(__dirname, 'prompt.md');
    if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
        promptPath = promptPath.replace('/dist/', '/');
    }
    let systemPrompt = fs.readFileSync(promptPath, 'utf8');
    systemPrompt = systemPrompt.replace('{{idea}}', idea);
    const result = await spawnManagedAgent({
        agentName: 'analyst',
        systemPrompt: systemPrompt,
        userMessage: `Perform a competitive analysis for this startup idea: "${idea}"`,
        tools: [{ googleSearch: {} }], // Enable Google Search grounding
        onChunk: callbacks?.onChunk || (() => { }),
        onToolCall: callbacks?.onToolCall || (() => { }),
        onToolResult: callbacks?.onToolResult || (() => { })
    });
    if (result.structured) {
        return result.structured;
    }
    try {
        const jsonMatch = result.output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    }
    catch (err) {
        // handled below
    }
    throw new Error(`Failed to parse output from Analyst agent: ${result.output}`);
}
