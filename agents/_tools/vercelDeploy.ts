export async function deploy(
  html: string,
  projectPath: string
): Promise<string> {
  console.log(`[Vercel Tool] Deploying HTML payload to project: ${projectPath}`);
  const domain = `${projectPath}.vercel.app`.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  return `https://${domain}`;
}
