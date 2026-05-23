import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});
export async function runMarketer(opts) {
    let promptPath = path.join(__dirname, 'prompt.md');
    if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
        promptPath = promptPath.replace('/dist/', '/');
    }
    let promptText = fs.readFileSync(promptPath, 'utf8');
    promptText = promptText
        .replace('{{brandName}}', opts.brandName)
        .replace('{{positioning}}', opts.positioning)
        .replace('{{copywriterOutput}}', JSON.stringify(opts.copywriterOutput, null, 2));
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Marketer agent exceeded 60s")), 60000);
    });
    const executionPromise = async () => {
        const response = await client.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: promptText,
            config: {
                responseMimeType: 'application/json',
            }
        });
        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    };
    try {
        return await Promise.race([executionPromise(), timeoutPromise]);
    }
    catch (err) {
        console.warn("Marketer agent failed, using fallback:", err);
        return {
            tweet_thread: [
                `1/ Meet ${opts.brandName}: ${opts.positioning}. A brand new startup launches today! 🚀`,
                `2/ Built and designed completely automatically using parallel generative agents.`,
                `3/ Get complete copy deck, domains checked live, and automated landing page deployments.`,
                "4/ Designed at Shack15 for the Google I/O Hackathon using Gemini Managed Agents. 🌟",
                "5/ Check out the live URL and launch your next startup idea instantly! ⚡"
            ],
            producthunt: {
                tagline: `${opts.brandName} - Launch your startup instantly`,
                description: `Create beautiful branding, domain check, copies, legal drafts, and landing pages instantly using Studio.`
            },
            hn_show: `Show HN: ${opts.brandName} - Fully custom startup launched instantly by parallel AI agents`,
            linkedin_post: `Launching a startup used to take weeks. Today we are launching ${opts.brandName} in under 5 minutes. Engineered by parallel specialist agents on the Gemini Managed Agents API. Read more and check out our dashboard!`
        };
    }
}
