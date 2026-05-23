export interface StitchResult {
  mockupUrl: string;
  exportedCode: string;
}

export async function stitchGenerate(
  brief: string,
  style?: string
): Promise<StitchResult> {
  console.log(`[Stitch Tool] Generating mockup for: "${brief}" with style: "${style || 'modern'}"`);
  return {
    mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    exportedCode: `<div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Startup Landing Page</h1>
      <p class="mt-2 text-slate-400 max-w-md text-center">${brief}</p>
    </div>`
  };
}
