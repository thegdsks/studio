import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { LegalOutput } from './schema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});

export async function runLegal(opts: {
  brandName: string;
  businessType: string;
}): Promise<LegalOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let promptText = fs.readFileSync(promptPath, 'utf8');
  promptText = promptText
    .replace('{{brandName}}', opts.brandName)
    .replace('{{businessType}}', opts.businessType);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout: Legal agent exceeded 60s")), 60000);
  });

  const executionPromise = async (): Promise<LegalOutput> => {
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
      return JSON.parse(jsonMatch[0]) as LegalOutput;
    }
    return JSON.parse(text) as LegalOutput;
  };

  try {
    return await Promise.race([executionPromise(), timeoutPromise]);
  } catch (err) {
    console.warn("Legal agent failed, using fallback:", err);
    return {
      terms_of_service: `# Terms of Service\n\n**This is an AI-generated draft, have a lawyer review before use**\n\nWelcome to ${opts.brandName}. By using our platform, you agree to these Terms. We provide automated ${opts.businessType} tools. We are not responsible for any direct or indirect damages resulting from your use of the generated materials or legal documents. All services are provided "as is" and without warranties of any kind.`,
      privacy_policy: `# Privacy Policy\n\n**This is an AI-generated draft, have a lawyer review before use**\n\nAt ${opts.brandName}, we take your privacy seriously. We collect contact details, usage logs, and configuration inputs solely to operate our ${opts.businessType} services. We leverage cookies to authenticate users and analyze traffic. You have the right to request deletion of your account and personal records at any time by contacting our support team.`,
      liability_summary: `AI fallback legal summaries. Operating a ${opts.businessType} startup involves key risks in automated data privacy regulations, IP infringement claims for generated assets, and potential warranty violations. Consult a lawyer for standard corporate coverage.`
    };
  }
}
