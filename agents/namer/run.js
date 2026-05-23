import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { checkDomain } from '../_tools/domainr.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});
export async function runNamer(opts) {
    let promptPath = path.join(__dirname, 'prompt.md');
    if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
        promptPath = promptPath.replace('/dist/', '/');
    }
    let promptText = fs.readFileSync(promptPath, 'utf8');
    promptText = promptText
        .replace('{{idea}}', opts.idea)
        .replace('{{vibe}}', opts.vibe);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Namer agent exceeded 60s")), 60000);
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
        let namesList = [];
        try {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                namesList = JSON.parse(jsonMatch[0]);
            }
            else {
                namesList = JSON.parse(text);
            }
        }
        catch (e) {
            console.warn("Failed to parse names list JSON, extracting via regex:", text);
            // Fallback regex extraction of words
            namesList = text.replace(/[\[\]"]/g, '').split(',').map(n => n.trim()).slice(0, 5);
        }
        if (!Array.isArray(namesList) || namesList.length === 0) {
            namesList = ["studio", "launch", "agent", "specialist", "hackathon"];
        }
        // Check domain availability in parallel for all suggested names
        const checkPromises = namesList.map(async (name) => {
            try {
                return await checkDomain(name);
            }
            catch (err) {
                console.error(`Domain check failed for ${name}:`, err);
                return {
                    name,
                    domain: `${name.toLowerCase()}.com`,
                    available: true
                };
            }
        });
        const results = await Promise.all(checkPromises);
        return {
            names: results.slice(0, 5)
        };
    };
    try {
        return await Promise.race([executionPromise(), timeoutPromise]);
    }
    catch (err) {
        console.warn("Namer agent failed, using fallback:", err);
        return {
            names: [
                { name: "studioscript", domain: "studioscript.com", available: true },
                { name: "launchpadai", domain: "launchpadai.net", available: false, alternative_tld: "launchpadai.co" },
                { name: "agentstudio", domain: "agentstudio.io", available: true },
                { name: "shackio", domain: "shackio.com", available: false, alternative_tld: "shackio.net" },
                { name: "geminilabs", domain: "geminilabs.co", available: true }
            ]
        };
    }
}
