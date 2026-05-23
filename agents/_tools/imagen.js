import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();
const client = new GoogleGenAI({});
export async function generateLogo(brand, vibe) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("[Imagen] GEMINI_API_KEY missing, using inline SVG wordmark fallback.");
        return generateSvgWordmark(brand, vibe);
    }
    const prompt = `A modern, premium, minimalist vector logo design for a brand named "${brand}". Vibe: ${vibe}. High quality, clean graphic design on a dark solid background.`;
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Imagen generation timed out")), 15000); // 15s timeout
    });
    const executionPromise = async () => {
        // Call Imagen 3 model in the SDK
        const response = await client.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 2,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1'
            }
        });
        const images = response.generatedImages || [];
        if (images.length === 0) {
            throw new Error("No images generated");
        }
        const variants = images.map(img => {
            const b64 = img.image?.imageBytes;
            if (!b64)
                throw new Error("Image bytes empty");
            return `data:image/jpeg;base64,${b64}`;
        });
        return {
            url: variants[0] || "",
            variants
        };
    };
    try {
        return await Promise.race([executionPromise(), timeoutPromise]);
    }
    catch (err) {
        console.warn(`[Imagen] generation failed or exceeded 15s for ${brand}. Falling back to inline SVG:`, err);
        return generateSvgWordmark(brand, vibe);
    }
}
function generateSvgWordmark(brand, vibe) {
    const cleanBrand = brand.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cleanVibe = vibe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#38bdf8;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#090d16"/>
    <circle cx="250" cy="250" r="160" fill="url(#grad1)" opacity="0.1"/>
    <circle cx="250" cy="250" r="140" stroke="url(#grad1)" stroke-width="4" fill="none"/>
    <text x="50%" y="245" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="46" font-weight="900" fill="#ffffff" letter-spacing="1.5">
      ${cleanBrand.toUpperCase()}
    </text>
    <text x="50%" y="300" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#38bdf8" letter-spacing="4">
      ${cleanVibe.toUpperCase()}
    </text>
  </svg>`;
    const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f43f5e;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#0b0f19"/>
    <path d="M250,110 L370,350 L130,350 Z" stroke="url(#grad2)" stroke-width="3" fill="none" opacity="0.2"/>
    <text x="50%" y="250" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="48" font-weight="900" fill="url(#grad2)" letter-spacing="1">
      ${cleanBrand.toUpperCase()}
    </text>
    <text x="50%" y="310" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8" letter-spacing="3">
      LAUNCH KIT BRANDING
    </text>
  </svg>`;
    const uri1 = `data:image/svg+xml;utf8,${encodeURIComponent(svg1)}`;
    const uri2 = `data:image/svg+xml;utf8,${encodeURIComponent(svg2)}`;
    return {
        url: uri1,
        variants: [uri1, uri2]
    };
}
