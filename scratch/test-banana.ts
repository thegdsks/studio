import { generateBackdrop, composeBrandingSvg, BananaUnavailableError } from '../agents/_tools/banana.js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

async function run(): Promise<void> {
  process.stdout.write('[test-banana] Starting generateBackdrop...\n');

  let result: Awaited<ReturnType<typeof generateBackdrop>>;

  try {
    result = await generateBackdrop({
      brief: 'Lush tropical rainforest at dawn, mist rising between giant ferns, volumetric light rays',
      palette: { primary: '#3B82F6', secondary: '#22C55E' },
      aspectRatio: '3:2',
    });
  } catch (err) {
    if (err instanceof BananaUnavailableError) {
      process.stderr.write(`[test-banana] BananaUnavailableError: ${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }

  process.stdout.write(`[test-banana] durationMs=${result.durationMs}\n`);
  process.stdout.write(`[test-banana] promptUsed=${result.promptUsed.slice(0, 100)}...\n`);
  process.stdout.write(`[test-banana] pngBytes.length=${result.pngBytes.length}\n`);

  if (result.pngBytes.length < 1024) {
    process.stderr.write('[test-banana] FAIL: pngBytes too small (<1KB)\n');
    process.exit(1);
  }
  process.stdout.write('[test-banana] PASS: pngBytes >1KB\n');

  const svg = composeBrandingSvg({
    backdropPngBytes: result.pngBytes,
    brandName: 'Rainforest Studio',
    tagline: 'Where ideas grow wild',
    headlineFont: 'Playfair Display',
    bodyFont: 'Inter',
    primary: '#3B82F6',
    width: 1200,
    height: 800,
  });

  if (!svg.includes('Rainforest Studio')) {
    process.stderr.write('[test-banana] FAIL: SVG does not contain brand name\n');
    process.exit(1);
  }
  process.stdout.write('[test-banana] PASS: SVG contains brand name\n');

  if (!svg.includes('data:image/png;base64,')) {
    process.stderr.write('[test-banana] FAIL: SVG does not contain embedded image data URI\n');
    process.exit(1);
  }
  process.stdout.write('[test-banana] PASS: SVG contains embedded image data URI\n');

  fs.writeFileSync('/tmp/banana-test.svg', svg, 'utf8');
  process.stdout.write('[test-banana] Wrote /tmp/banana-test.svg\n');

  const preview = svg.slice(0, 200);
  process.stdout.write(`[test-banana] SVG preview (first 200 chars):\n${preview}\n`);

  process.stdout.write('[test-banana] ALL TESTS PASSED\n');
}

run().catch((err: unknown) => {
  process.stderr.write(`[test-banana] Unhandled error: ${String(err)}\n`);
  process.exit(1);
});
