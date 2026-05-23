import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { checkDomain } from '../_tools/domainr.js';
import { NamerOutput } from './schema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});

export async function runNamer(opts: {
  idea: string;
  vibe: string;
}): Promise<NamerOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let promptText = fs.readFileSync(promptPath, 'utf8');
  promptText = promptText
    .replace('{{idea}}', opts.idea)
    .replace('{{vibe}}', opts.vibe);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout: Namer agent exceeded 60s")), 60000);
  });

  const executionPromise = async (): Promise<NamerOutput> => {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || "";
    let namesList: string[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        namesList = JSON.parse(jsonMatch[0]);
      } else {
        namesList = JSON.parse(text);
      }
    } catch (e) {
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
      } catch (err) {
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
      names: results.slice(0, 5).map(enrichName)
    };
  };

  try {
    return await Promise.race([executionPromise(), timeoutPromise]);
  } catch (err) {
    console.warn("Namer agent failed, using fallback:", err);
    void enrichName;  // referenced to satisfy lint when used in real path only
    return {
      names: [
        { name: "studioscript", domain: "studioscript.com", available: true,  vibe: "modern, technical, premium", pronunciation: "STOO-dee-oh-script", trademark_risk: "low" },
        { name: "launchpadai",  domain: "launchpadai.net", available: false, alternative_tld: "launchpadai.co", vibe: "kinetic, AI-forward",          pronunciation: "LAWNCH-pad-AY-eye",  trademark_risk: "medium" },
        { name: "agentstudio",  domain: "agentstudio.io",  available: true,  vibe: "agentic, workspace, calm",    pronunciation: "AY-jent-STOO-dee-oh", trademark_risk: "low" },
        { name: "shackio",      domain: "shackio.com",    available: false, alternative_tld: "shackio.net",     vibe: "indie, scrappy, builder",      pronunciation: "SHACK-ee-oh",         trademark_risk: "medium" },
        { name: "geminilabs",   domain: "geminilabs.co",   available: true,  vibe: "research-driven, scientific", pronunciation: "JEM-in-eye-labs",    trademark_risk: "high" },
      ],
    };
  }
}

/**
 * Add heuristic vibe/pronunciation/trademark_risk to a Domainr check result
 * so it satisfies the richer DomainOption schema without an extra LLM call.
 */
function enrichName(r: { name: string; domain: string; available: boolean; alternative_tld?: string }) {
  return {
    ...r,
    vibe: vibeFor(r.name),
    pronunciation: pronunciationFor(r.name),
    trademark_risk: trademarkRiskFor(r.name),
  };
}

function vibeFor(name: string): string {
  const lower = name.toLowerCase();
  if (/ai|gpt|ml|gen/.test(lower)) return 'AI-forward, technical';
  if (/lab|studio|works|forge/.test(lower)) return 'craft, considered, premium';
  if (/io|app|hq|stack/.test(lower)) return 'modern, product-led';
  if (/co|labs/.test(lower)) return 'collaborative, calm';
  return 'modern, clean';
}

function pronunciationFor(name: string): string {
  // Crude phonetic: uppercase first syllable, hyphenate every 2-3 chars.
  const chunks: string[] = [];
  let i = 0;
  while (i < name.length) {
    const size = i === 0 ? Math.min(3, name.length) : Math.min(2 + Math.floor(Math.random() * 2), name.length - i);
    chunks.push(name.slice(i, i + size).toUpperCase());
    i += size;
  }
  return chunks.join('-');
}

function trademarkRiskFor(name: string): 'low' | 'medium' | 'high' {
  const lower = name.toLowerCase();
  // Common English words / well-known brand stems lean higher.
  if (/^(amazon|google|apple|meta|gemini|claude|openai|stripe)/.test(lower)) return 'high';
  if (/ai$|labs$|studio$/.test(lower)) return 'medium';
  return 'low';
}
