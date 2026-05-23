import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { MarketerOutput } from './schema.js';
import { recordCost, type RunContext } from '../_runtime/costRecorder.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});

export async function runMarketer(opts: {
  brandName: string;
  positioning: string;
  copywriterOutput: unknown;
  runContext?: RunContext;
}): Promise<MarketerOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let promptText = fs.readFileSync(promptPath, 'utf8');
  promptText = promptText
    .replace('{{brandName}}', opts.brandName)
    .replace('{{positioning}}', opts.positioning)
    .replace('{{copywriterOutput}}', JSON.stringify(opts.copywriterOutput, null, 2));

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout: Marketer agent exceeded 60s")), 60000);
  });

  const executionPromise = async (): Promise<MarketerOutput> => {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (opts.runContext) {
      void recordCost({
        runContext: opts.runContext,
        model: 'gemini-3.5-flash',
        provider: 'gemini',
        inputTokens: (response.usageMetadata as { promptTokenCount?: number } | undefined)?.promptTokenCount ?? 0,
        outputTokens: (response.usageMetadata as { candidatesTokenCount?: number } | undefined)?.candidatesTokenCount ?? 0,
      });
    }

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MarketerOutput;
    }
    return JSON.parse(text) as MarketerOutput;
  };

  try {
    return await Promise.race([executionPromise(), timeoutPromise]);
  } catch (err) {
    console.warn("Marketer agent failed, using fallback:", err);
    return {
      x_thread: [
        `1/ Meet ${opts.brandName}: ${opts.positioning}. Launching today.`,
        `2/ Built end-to-end by nine specialist agents working in parallel.`,
        `3/ Complete copy deck, live domain checks, deployed landing page.`,
        `4/ Designed at Shack15 for the Google I/O Hackathon using Gemini Managed Agents.`,
        `5/ Click through, kick the tires, and tell me what to ship next.`,
      ],
      producthunt: {
        tagline: `${opts.brandName} — launch your startup instantly`,
        description: `Brand, copy, deployed site, prospects, legal — produced in parallel by nine specialist agents. Built on Gemini Managed Agents.`,
        gallery_captions: [
          'The 9-agent dashboard in flight',
          'Director synthesises the full launch story',
          'BrandPreview themed with the generated identity',
        ],
      },
      hn_show: {
        title: `Show HN: ${opts.brandName} — startup launch kit from one sentence`,
        body: `${opts.positioning}\n\nNine specialist agents (strategist, namer, designer, copywriter, developer, marketer, growth, legal, analyst) run in parallel against Gemini Managed Agents. A director synthesises the artifacts into a single coherent launch story. Built at the Google I/O hackathon at Shack15.\n\nWould love your feedback on the orchestration model and where the seams show.`,
      },
      linkedin_post: `Launching a startup used to take weeks. We just shipped ${opts.brandName} in under five minutes — nine specialist AI agents working in parallel on top of Gemini Managed Agents. ${opts.positioning} Check out the deployed landing page and the brand kit it produced.`,
      email_blast: {
        subject: `${opts.brandName} just shipped — 60 seconds of your time?`,
        body: `Quick one — we just launched ${opts.brandName}, an entire startup scaffolded by nine parallel AI specialists in under five minutes. It's live and deployed. ${opts.positioning}\n\nWould love your raw read on the brand and the messaging. Reply with anything that doesn't land and I'll iterate.`,
      },
      posting_schedule: [
        { day: 1, platform: 'producthunt', what: 'Launch on Product Hunt at 12:01am PT with the tagline and gallery captions above.' },
        { day: 1, platform: 'x',           what: 'Post the X thread; pin the launch tweet to profile.' },
        { day: 2, platform: 'hackernews',  what: 'Show HN post in the morning Pacific window; respond to comments hourly.' },
        { day: 3, platform: 'linkedin',    what: 'Post the LinkedIn build story; tag two early supporters.' },
        { day: 5, platform: 'email',       what: 'Email blast to warm list with the subject line above.' },
      ],
      replies_kit: {
        positive: [
          `Thank you — means a lot. The whole thing is open-source if you want to poke around.`,
          `Appreciate it. The director-agent synthesis is the part I'm most proud of — happy to walk through it.`,
          `Glad it resonates. What part would you want to see go deeper next?`,
        ],
        skeptical: [
          `Fair pushback. The honest answer: the agents seed a quality floor; a human still needs to polish before customer-facing copy ships.`,
          `Totally reasonable concern. Privacy mode lets Legal + Strategy run locally on Gemma if cloud is a non-starter for you.`,
          `Agree the orchestration is the harder problem than any single agent. Happy to share the wave-based scheduler design.`,
        ],
      },
    };
  }
}
