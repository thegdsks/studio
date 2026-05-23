/**
 * Manual smoke test for ollamaClient. Run with:
 *   pnpm tsx scratch/test-ollama.ts
 * Requires Ollama running locally with gemma4:e4b pulled.
 */

import { ollamaInference, OllamaUnavailableError } from '../agents/_runtime/ollamaClient.js';

let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${name} ... `);
  try {
    await fn();
    process.stdout.write('OK\n');
  } catch (err) {
    failed++;
    process.stdout.write(`FAIL\n    ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

async function main(): Promise<void> {
  console.log('[gemma] smoke tests\n');

  await test('happy path returns text', async () => {
    let chunks = 0;
    const result = await ollamaInference({
      systemPrompt: 'Reply with exactly one word.',
      userMessage: 'Say OK.',
      onChunk: () => { chunks++; },
      timeoutMs: 30_000, // first call may be cold
    });
    if (!result.output.toLowerCase().includes('ok')) {
      throw new Error(`output did not contain OK: ${JSON.stringify(result.output)}`);
    }
    if (chunks === 0) throw new Error('no chunks delivered to onChunk callback');
    if (result.ranLocally !== true) throw new Error('ranLocally !== true');
    console.log(`      (${chunks} chunks, ${result.durationMs}ms)`);
  });

  await test('timeout throws OllamaUnavailableError', async () => {
    try {
      await ollamaInference({
        systemPrompt: 'Write a 500-word essay on apples.',
        userMessage: 'Begin.',
        timeoutMs: 50, // impossibly short
      });
      throw new Error('expected timeout but call succeeded');
    } catch (err) {
      if (!(err instanceof OllamaUnavailableError)) {
        throw new Error(`wrong error class: ${err instanceof Error ? err.constructor.name : typeof err}`);
      }
    }
  });

  await test('structured output parses', async () => {
    const result = await ollamaInference({
      systemPrompt:
        'You are a JSON-only responder. Respond ONLY with valid JSON, no preamble.',
      userMessage:
        'Return a JSON object with keys "name" (string "studio") and "score" (number 42). Nothing else.',
      responseSchema: 'json',
      timeoutMs: 30_000,
    });
    if (typeof result.structured !== 'object' || result.structured === null) {
      throw new Error(`structured was not an object: ${JSON.stringify(result.output)}`);
    }
    const obj = result.structured as Record<string, unknown>;
    if (typeof obj.name !== 'string') {
      throw new Error(`name not parsed: ${JSON.stringify(result.structured)}`);
    }
  });

  console.log(`\n[gemma] ${failed === 0 ? 'all green' : `${failed} failed`}\n`);
  if (failed > 0) process.exit(1);
}

void main();
