import { GoogleGenAI, Modality } from '@google/genai';
import * as dotenv from 'dotenv';
import { recordCost, type RunContext } from '../_runtime/costRecorder.js';
dotenv.config();

const MODEL = 'gemini-2.5-flash-image';
const TIMEOUT_MS = 90_000;
const NO_TEXT_SUFFIX =
  'no text, no letters, no watermark, no logo, abstract composition only';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class BananaUnavailableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[banana] ${message}`);
    this.name = 'BananaUnavailableError';
  }
}

// ---------------------------------------------------------------------------
// generateBackdrop
// ---------------------------------------------------------------------------

export interface BananaResult {
  pngBytes: Buffer;
  promptUsed: string;
  durationMs: number;
}

interface BackdropOpts {
  brief: string;
  palette?: { primary: string; secondary?: string };
  aspectRatio?: '1:1' | '3:2' | '16:9' | '4:3';
  apiKey?: string;
  runContext?: RunContext;
}

export async function generateBackdrop(opts: BackdropOpts): Promise<BananaResult> {
  const { brief, palette, aspectRatio = '3:2', apiKey, runContext } = opts;

  const resolvedKey = apiKey ?? process.env.GEMINI_API_KEY;
  if (!resolvedKey) {
    throw new BananaUnavailableError('GEMINI_API_KEY is not set');
  }

  const paletteClause = palette
    ? `Color palette: primary ${palette.primary}${palette.secondary ? `, secondary ${palette.secondary}` : ''}. `
    : '';

  const promptUsed = `${brief}. ${paletteClause}Aspect ratio ${aspectRatio}. ${NO_TEXT_SUFFIX}`;

  const client = new GoogleGenAI({ apiKey: resolvedKey });

  const t0 = Date.now();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new BananaUnavailableError(`Request timed out after ${TIMEOUT_MS}ms`)),
      TIMEOUT_MS,
    );
  });

  const fetchPromise = (async (): Promise<BananaResult> => {
    let response: Awaited<ReturnType<typeof client.models.generateContent>>;
    try {
      response = await client.models.generateContent({
        model: MODEL,
        contents: promptUsed,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
    } catch (err) {
      throw new BananaUnavailableError('generateContent failed', err);
    }

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart?.inlineData?.data) {
      throw new BananaUnavailableError(
        'No image data in response. Parts received: ' + parts.length,
      );
    }

    const pngBytes = Buffer.from(imagePart.inlineData.data, 'base64');
    const durationMs = Date.now() - t0;

    if (runContext) {
      void recordCost({
        runContext,
        model: MODEL,
        provider: 'banana',
        images: 1,
        durationMs,
      });
    }

    return {
      pngBytes,
      promptUsed,
      durationMs,
    };
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

// ---------------------------------------------------------------------------
// composeBrandingSvg
// ---------------------------------------------------------------------------

export interface ComposeBrandingOpts {
  backdropPngBytes: Buffer | null;
  brandName: string;
  tagline?: string;
  headlineFont: string;
  bodyFont: string;
  primary: string;
  surface?: string;
  width?: number;
  height?: number;
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function googleFontsUrl(families: string[]): string {
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function composeBrandingSvg(opts: ComposeBrandingOpts): string {
  const {
    backdropPngBytes,
    brandName,
    tagline,
    headlineFont,
    bodyFont,
    primary,
    surface = '#0A0A0F',
    width = 1200,
    height = 800,
  } = opts;

  const safeBrand = escapeXml(brandName);
  const safeTagline = tagline ? escapeXml(tagline) : null;

  const uniqueFamilies = Array.from(new Set([headlineFont, bodyFont]));
  const fontsUrl = googleFontsUrl(uniqueFamilies);

  // Background: either embedded PNG or flat surface color
  let backdropLayer: string;
  if (backdropPngBytes && backdropPngBytes.length > 0) {
    const b64 = backdropPngBytes.toString('base64');
    backdropLayer = `<image href="data:image/png;base64,${b64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    backdropLayer = `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(surface)}"/>`;
  }

  // Vertical layout
  const brandY = Math.round(height * 0.48);
  const taglineY = Math.round(height * 0.58);
  const headlineFontSize = Math.round(width * 0.075);
  const taglineFontSize = Math.round(width * 0.028);

  const taglineEl = safeTagline
    ? `<text
        x="50%"
        y="${taglineY}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="${escapeXml(bodyFont)}, system-ui, sans-serif"
        font-size="${taglineFontSize}"
        font-weight="400"
        fill="#FFFFFF"
        opacity="0.82"
        letter-spacing="2"
      >${safeTagline}</text>`
    : '';

  // Accent underline decoration
  const lineW = Math.round(width * 0.06);
  const lineY = Math.round(brandY + headlineFontSize * 0.7);

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${width} ${height}"
  width="${width}"
  height="${height}"
>
  <defs>
    <style>@import url("${fontsUrl}")</style>
    <radialGradient id="scrim" cx="50%" cy="60%" r="70%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </radialGradient>
    <linearGradient id="scrimBottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
    </linearGradient>
  </defs>

  ${backdropLayer}

  <!-- Scrim layers for legibility -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)"/>
  <rect x="0" y="${Math.round(height * 0.35)}" width="${width}" height="${Math.round(height * 0.65)}" fill="url(#scrimBottom)"/>
  <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.35)"/>

  <!-- Brand name -->
  <text
    x="50%"
    y="${brandY}"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="${escapeXml(headlineFont)}, system-ui, sans-serif"
    font-size="${headlineFontSize}"
    font-weight="700"
    fill="#FFFFFF"
    letter-spacing="-1"
  >${safeBrand}</text>

  <!-- Accent underline -->
  <rect
    x="${Math.round(width / 2 - lineW / 2)}"
    y="${lineY}"
    width="${lineW}"
    height="3"
    rx="2"
    fill="${escapeXml(primary)}"
  />

  ${taglineEl}
</svg>`;
}
