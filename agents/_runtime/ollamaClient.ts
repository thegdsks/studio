/**
 * Local Gemma inference via Ollama. Mirrors the result shape of
 * spawnManagedAgent but with no tool-calling surface — these are short,
 * privacy-sensitive completions that run entirely on-device.
 *
 * Failure contract: any non-2xx, parse error, or timeout throws
 * OllamaUnavailableError so the caller can log + fall back to Gemini.
 * We do NOT swallow errors in here — fallback policy belongs to the caller.
 *
 * Log lines are prefixed with "[gemma]" so they're greppable in demo logs.
 */

const OLLAMA_URL = process.env['OLLAMA_URL'] ?? 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma4:e4b';
const DEFAULT_TIMEOUT_MS = 5_000;

export class OllamaUnavailableError extends Error {
  override readonly name = 'OllamaUnavailableError';
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export interface OllamaInferenceOptions {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  /** JSON schema (or "json" string) passed as Ollama's `format` field. */
  responseSchema?: object | 'json';
  onChunk?: (text: string) => void;
  /** Hard cap on the whole call. Default 5s — short, so fallback to Gemini is fast. */
  timeoutMs?: number;
}

export interface OllamaInferenceResult {
  output: string;
  structured?: unknown;
  durationMs: number;
  ranLocally: true;
}

/**
 * Streaming generate against the Ollama HTTP API. Returns the accumulated
 * text and, when `responseSchema` was set, the parsed JSON.
 */
export async function ollamaInference(
  opts: OllamaInferenceOptions,
): Promise<OllamaInferenceResult> {
  const model = opts.model ?? DEFAULT_MODEL;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const t0 = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Compose a single prompt that prepends the system prompt — Ollama's
  // /api/generate doesn't have a separate system role; /api/chat does, but
  // we prefer /api/generate because `format` (structured output) is more
  // reliable there for small models.
  const prompt = `${opts.systemPrompt.trim()}\n\nUser: ${opts.userMessage.trim()}\n\nAssistant:`;

  let response: Response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        ...(opts.responseSchema ? { format: opts.responseSchema } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new OllamaUnavailableError(
        `[gemma] request timed out after ${timeoutMs}ms`,
        err,
      );
    }
    throw new OllamaUnavailableError(
      `[gemma] network error: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  if (!response.ok || !response.body) {
    clearTimeout(timer);
    throw new OllamaUnavailableError(
      `[gemma] http ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let output = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // NDJSON: split on newline, keep the trailing partial line in buffer.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parsed: { response?: string; done?: boolean; error?: string };
        try {
          parsed = JSON.parse(trimmed) as typeof parsed;
        } catch (err) {
          clearTimeout(timer);
          throw new OllamaUnavailableError(
            `[gemma] non-JSON line in stream: ${trimmed.slice(0, 120)}`,
            err,
          );
        }

        if (parsed.error) {
          clearTimeout(timer);
          throw new OllamaUnavailableError(`[gemma] api error: ${parsed.error}`);
        }
        if (typeof parsed.response === 'string' && parsed.response.length > 0) {
          output += parsed.response;
          opts.onChunk?.(parsed.response);
        }
        if (parsed.done) {
          // Don't break — flush any trailing buffer below.
        }
      }
    }

    // Flush any trailing partial chunk (rare).
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim()) as { response?: string };
        if (typeof parsed.response === 'string') {
          output += parsed.response;
          opts.onChunk?.(parsed.response);
        }
      } catch {
        // Partial fragment at stream end — ignore.
      }
    }
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof OllamaUnavailableError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new OllamaUnavailableError(
        `[gemma] stream aborted after ${timeoutMs}ms`,
        err,
      );
    }
    throw new OllamaUnavailableError(
      `[gemma] stream error: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  clearTimeout(timer);

  let structured: unknown;
  if (opts.responseSchema) {
    try {
      structured = JSON.parse(output);
    } catch {
      // Best-effort: find the first {...} block.
      const match = output.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          structured = JSON.parse(match[0]);
        } catch (err) {
          throw new OllamaUnavailableError(
            `[gemma] structured output could not be parsed`,
            err,
          );
        }
      } else {
        throw new OllamaUnavailableError(
          `[gemma] structured output requested but no JSON in response`,
        );
      }
    }
  }

  return {
    output,
    structured,
    durationMs: Date.now() - t0,
    ranLocally: true,
  };
}
