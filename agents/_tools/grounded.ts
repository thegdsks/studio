import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new GoogleGenAI({});

export interface GroundedResult {
  summary: string;
  sources: Array<{ title: string; url: string }>;
}

export async function groundedQuery(
  query: string,
  numSources: number = 5
): Promise<GroundedResult> {
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const candidate = response.candidates?.[0];
    const summary = response.text || "";
    const groundingMetadata = candidate?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks || [];

    const sources = chunks
      .map((chunk: any) => {
        if (chunk.web) {
          return {
            title: chunk.web.title || "",
            url: chunk.web.uri || "",
          };
        }
        return null;
      })
      .filter((src: any): src is { title: string; url: string } => src !== null)
      .slice(0, numSources);

    return {
      summary,
      sources
    };
  } catch (err: any) {
    console.error("groundedQuery failed:", err);
    return {
      summary: `Fallback research summary for query: "${query}"`,
      sources: [
        { title: "Google Search (Fallback)", url: "https://www.google.com" }
      ]
    };
  }
}
