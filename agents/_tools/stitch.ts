import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new GoogleGenAI({});

export interface StitchResult {
  mockupUrl: string;
  exportedCode: string;
}

export async function stitchGenerate(
  brief: string,
  style: string = 'modern'
): Promise<StitchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallbackResult = {
    mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    exportedCode: `<div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Startup Landing Page</h1>
      <p class="mt-2 text-slate-400 max-w-md text-center">${brief}</p>
    </div>`
  };

  if (!apiKey) {
    console.warn("[Stitch] GEMINI_API_KEY missing, using fallback mockup.");
    return fallbackResult;
  }

  const prompt = `You are a frontend developer. Write a single-file landing page HTML code based on this startup brief: "${brief}". Style: ${style}. Use Tailwind CSS via CDN. Output ONLY raw HTML, no markdown wrappers, no backticks.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      signal: controller.signal
    });

    clearTimeout(timer);

    const rawText = response.text || "";
    let code = rawText.trim();
    
    // Clean markdown code blocks if any
    if (code.startsWith("```html")) {
      code = code.substring(7);
    } else if (code.startsWith("```")) {
      code = code.substring(3);
    }
    if (code.endsWith("```")) {
      code = code.substring(0, code.length - 3);
    }
    code = code.trim();

    if (!code.includes("<html") && !code.includes("<div")) {
      throw new Error("Invalid HTML code generated");
    }

    return {
      mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
      exportedCode: code
    };
  } catch (err) {
    console.warn("[Stitch] generation failed, using fallback:", err);
    return fallbackResult;
  }
}
