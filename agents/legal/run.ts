import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { LegalOutput } from './schema.js';
import { ollamaInference, OllamaUnavailableError } from '../_runtime/ollamaClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new GoogleGenAI({});

const PRIVACY_FORCE_CLOUD =
  process.env['PRIVACY_FORCE_CLOUD'] === '1' ||
  process.env['PRIVACY_FORCE_CLOUD']?.toLowerCase() === 'true';

interface RunCallbacks {
  onChunk?: (text: string) => void;
  /** Called when local Gemma actually produced the artifact (not on fallback). */
  onLocalRun?: () => void;
}

export async function runLegal(opts: {
  brandName: string;
  businessType: string;
  privacy_mode?: boolean;
  callbacks?: RunCallbacks;
}): Promise<LegalOutput> {
  let promptPath = path.join(__dirname, 'prompt.md');
  if (!fs.existsSync(promptPath) && promptPath.includes('/dist/')) {
    promptPath = promptPath.replace('/dist/', '/');
  }
  let promptText = fs.readFileSync(promptPath, 'utf8');
  promptText = promptText
    .replace('{{brandName}}', opts.brandName)
    .replace('{{businessType}}', opts.businessType);

  if (opts.privacy_mode && !PRIVACY_FORCE_CLOUD) {
    try {
      const gemmaPrompt =
        promptText.trim() +
        '\n\nReturn ONLY valid JSON matching: { "terms_of_service": string (markdown), "privacy_policy": string (markdown), "liability_summary": string }. No preamble, no markdown fences.';

      const result = await ollamaInference({
        systemPrompt: gemmaPrompt,
        userMessage: `Draft legal docs for the ${opts.businessType} brand "${opts.brandName}".`,
        responseSchema: 'json',
        onChunk: opts.callbacks?.onChunk,
        timeoutMs: 30_000,
      });

      if (isLegalOutput(result.structured)) {
        opts.callbacks?.onLocalRun?.();
        // eslint-disable-next-line no-console
        console.log(`[gemma] legal ok (${result.durationMs}ms)`);
        return result.structured;
      }
      throw new OllamaUnavailableError('[gemma] legal output failed shape check');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[gemma] legal unavailable, falling back to Gemini: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: Legal agent exceeded 60s')), 60000);
  });

  const executionPromise = async (): Promise<LegalOutput> => {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as LegalOutput;
    }
    return JSON.parse(text) as LegalOutput;
  };

  try {
    return await Promise.race([executionPromise(), timeoutPromise]);
  } catch (err) {
    console.warn('Legal agent failed, using fallback:', err);
    return {
      terms_of_service: `# Terms of Service\n\n**This is an AI-generated draft, have a lawyer review before use**\n\nWelcome to ${opts.brandName}. By using our platform, you agree to these Terms. We provide automated ${opts.businessType} tools. We are not responsible for any direct or indirect damages resulting from your use of the generated materials or legal documents. All services are provided "as is" and without warranties of any kind.`,
      privacy_policy: `# Privacy Policy\n\n**This is an AI-generated draft, have a lawyer review before use**\n\nAt ${opts.brandName}, we take your privacy seriously. We collect contact details, usage logs, and configuration inputs solely to operate our ${opts.businessType} services. We leverage cookies to authenticate users and analyze traffic. You have the right to request deletion of your account and personal records at any time by contacting our support team.`,
      liability_summary: `AI fallback legal summaries. Operating a ${opts.businessType} startup involves key risks in automated data privacy regulations, IP infringement claims for generated assets, and potential warranty violations. Consult a lawyer for standard corporate coverage.`,
    };
  }
}

function isLegalOutput(value: unknown): value is LegalOutput {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.terms_of_service === 'string' &&
    typeof v.privacy_policy === 'string' &&
    typeof v.liability_summary === 'string'
  );
}
