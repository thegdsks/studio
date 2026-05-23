import * as dotenv from 'dotenv';
dotenv.config();

export async function deploy(
  html: string,
  projectPath: string
): Promise<string> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const domain = `${projectPath}.vercel.app`.toLowerCase().replace(/[^a-z0-9.-]/g, '');

  if (!token || !projectId) {
    console.warn("[Vercel Deploy] VERCEL_TOKEN or VERCEL_PROJECT_ID missing. Returning mock domain.");
    return `https://${domain}`;
  }

  const url = "https://api.vercel.com/v13/deployments";
  
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "studio-landingpage",
        projectId: projectId,
        files: [
          {
            file: "index.html",
            data: html
          }
        ],
        projectSettings: {
          framework: null
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    // Vercel returns data.url as the deployment host (e.g. project-git-branch.vercel.app)
    return `https://${data.url}`;
  } catch (err) {
    console.warn("[Vercel Deploy] Live deployment failed, returning mock URL:", err);
    return `https://${domain}`;
  }
}
