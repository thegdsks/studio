export interface PriceTable {
  /** USD per 1M input tokens */
  input_per_million: number;
  /** USD per 1M output tokens */
  output_per_million: number;
  /** USD per image (banana / image-gen models) */
  image_flat?: number;
}

export const PRICING: Record<string, PriceTable> = {
  // Gemini 2.5 Flash (current default in managed agents)
  'gemini-3.5-flash':            { input_per_million: 0.30, output_per_million: 2.50 },
  'gemini-2.5-flash':            { input_per_million: 0.30, output_per_million: 2.50 },
  // Gemini 2.5 Flash Image (banana)
  'gemini-2.5-flash-image':      { input_per_million: 0.30, output_per_million: 0,    image_flat: 0.039 },
  // Local Gemma — free
  'gemma4:e4b':                  { input_per_million: 0,    output_per_million: 0 },
  // Anthropic Managed Agents — Sonnet pricing
  'antigravity-preview-05-2026': { input_per_million: 3.00, output_per_million: 15.00 },
  // Mock / unknown fallback key
  'mock':                        { input_per_million: 0,    output_per_million: 0 },
};

export function priceFor(model: string): PriceTable {
  return PRICING[model] ?? PRICING['gemini-3.5-flash']!;
}

export function computeCostUsd(opts: {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
}): number {
  const p = priceFor(opts.model);
  let usd = 0;
  if (opts.inputTokens)  usd += (opts.inputTokens  / 1_000_000) * p.input_per_million;
  if (opts.outputTokens) usd += (opts.outputTokens / 1_000_000) * p.output_per_million;
  if (opts.images && p.image_flat) usd += opts.images * p.image_flat;
  return usd;
}
