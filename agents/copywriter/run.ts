import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { CopywriterOutput } from './schema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});

export async function runCopywriter(opts: {
  brandName: string;
  positioning: string;
  icp: string;
}): Promise<CopywriterOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let promptText = fs.readFileSync(promptPath, 'utf8');
  promptText = promptText
    .replace('{{brandName}}', opts.brandName)
    .replace('{{positioning}}', opts.positioning)
    .replace('{{icp}}', opts.icp);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout: Copywriter agent exceeded 60s")), 60000);
  });

  const executionPromise = async (): Promise<CopywriterOutput> => {
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
      return JSON.parse(jsonMatch[0]) as CopywriterOutput;
    }
    return JSON.parse(text) as CopywriterOutput;
  };

  try {
    return await Promise.race([executionPromise(), timeoutPromise]);
  } catch (err) {
    console.warn("Copywriter agent failed, using fallback:", err);
    return {
      hero: {
        headline: `Launch Your Startup with ${opts.brandName}`,
        sub: opts.positioning
      },
      features: [
        { title: "Fast Delivery", body: "Engineered specifically for your ideal customer profile: " + opts.icp },
        { title: "Automated Setup", body: "9 specialist agents scaffold your complete launch kit instantly." },
        { title: "Grounded Solutions", body: "Live API integrations verify domains, legal status, and layouts." }
      ],
      faq: [
        { q: `What is ${opts.brandName}?`, a: "It is a startup created and scaffolded instantly via Studio." },
        { q: "Is the branding custom?", a: "Yes, fully tailored brand identity, colors, and layout." },
        { q: "Can I self-host the landing page?", a: "Yes, full source code is exported and deployed directly to Vercel." },
        { q: "Is domain lookup live?", a: "Yes, verified instantly through the Domainr registry." },
        { q: "How do I get started?", a: "Click the launch button below and step into your live site!" }
      ],
      cta: "Launch Now",
      value_props: [
        `Built for ${opts.icp} — every line of copy tailored to your ICP.`,
        `Nine specialist agents shape ${opts.brandName} into a coherent launch story.`,
        `Live deploy in minutes, with brand kit, legal drafts, and outreach included.`,
      ],
      email_subject_lines: [
        `${opts.brandName} just launched`,
        `Built ${opts.brandName} in 5 minutes — would love your eyes`,
        `Quick favor: feedback on ${opts.brandName}?`,
        `${opts.brandName} — for ${opts.icp.split(' ').slice(0, 4).join(' ')}`,
        `Three minutes with ${opts.brandName}?`,
      ],
      meta_description: `${opts.brandName}. ${opts.positioning.slice(0, 110)}`.slice(0, 150),
      social_bio: `${opts.brandName} — ${opts.positioning.slice(0, 140)}`.slice(0, 160),
    };
  }
}
