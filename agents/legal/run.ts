import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { LegalOutput } from './schema.js';
import { ollamaInference, OllamaUnavailableError } from '../_runtime/ollamaClient.js';
import { recordCost, type RunContext } from '../_runtime/costRecorder.js';

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
  runContext?: RunContext;
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
        '\n\nReturn ONLY valid JSON matching: { "terms_md": string (markdown), "privacy_md": string (markdown), "liability_md": string, "cookies_md": string, "risk_checklist": Array<{item:string,severity:"low"|"medium"|"high",mitigation:string}>, "jurisdiction_note": string }. No preamble, no markdown fences.';

      const result = await ollamaInference({
        systemPrompt: gemmaPrompt,
        userMessage: `Draft legal docs for the ${opts.businessType} brand "${opts.brandName}".`,
        responseSchema: 'json',
        onChunk: opts.callbacks?.onChunk,
        timeoutMs: 30_000,
        runContext: opts.runContext,
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

    if (opts.runContext) {
      void recordCost({
        runContext: opts.runContext,
        model: 'gemini-3.5-flash',
        provider: 'gemini',
        inputTokens: (response.usageMetadata as { promptTokenCount?: number } | undefined)?.promptTokenCount ?? 0,
        outputTokens: (response.usageMetadata as { candidatesTokenCount?: number } | undefined)?.candidatesTokenCount ?? 0,
      });
    }

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
      terms_md: `# Terms of Service\n\n**This is an AI-generated draft, have a lawyer review before use**\n\nWelcome to ${opts.brandName}. By using our platform, you agree to these Terms. We provide automated ${opts.businessType} tools. We are not responsible for any direct or indirect damages resulting from your use of the generated materials or legal documents. All services are provided "as is" and without warranties of any kind.`,
      privacy_md: `# Privacy Policy\n\n**This is an AI-generated draft, have a lawyer review before use**\n\nAt ${opts.brandName}, we take your privacy seriously. We collect contact details, usage logs, and configuration inputs solely to operate our ${opts.businessType} services. We leverage cookies to authenticate users and analyze traffic. You have the right to request deletion of your account and personal records at any time by contacting our support team.`,
      liability_md: `AI fallback legal summaries. Operating a ${opts.businessType} startup involves key risks in automated data privacy regulations, IP infringement claims for generated assets, and potential warranty violations. Consult a lawyer for standard corporate coverage.`,
      cookies_md: `**Cookies.** ${opts.brandName} uses strictly necessary cookies to authenticate users and analytics cookies to measure product usage. By using the site you consent to these cookies. You can opt out of analytics in Settings.`,
      risk_checklist: [
        { item: `Data privacy regulations applicable to ${opts.businessType}`, severity: 'high',   mitigation: 'Map data flows, complete a DPIA, appoint a privacy lead before launch.' },
        { item: 'Trademark conflict on the brand name',                          severity: 'medium', mitigation: 'Search USPTO + EUIPO before printing assets; consult IP counsel for clearance.' },
        { item: 'AI-generated copy may include inaccurate or biased claims',     severity: 'medium', mitigation: 'Human review of all customer-facing copy; flag any product claims for legal sign-off.' },
        { item: 'Open-source license obligations of generated code',             severity: 'low',    mitigation: 'Run an SCA scan; keep a NOTICE file listing third-party licenses.' },
        { item: 'Contractual liability with downstream service providers',       severity: 'low',    mitigation: 'Maintain capped-liability + indemnity language in MSA templates.' },
      ],
      jurisdiction_note: `Default incorporation: Delaware C-Corp — investor-friendly, well-trodden case law. Consider Cayman or Singapore if you anticipate non-US capital, or an LLC if you remain bootstrapped and revenue-only.`,
    };
  }
}

function isLegalOutput(value: unknown): value is LegalOutput {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.terms_md === 'string' &&
    typeof v.privacy_md === 'string' &&
    typeof v.liability_md === 'string'
  );
}
