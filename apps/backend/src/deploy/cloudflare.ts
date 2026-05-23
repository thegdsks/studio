import { nanoid } from 'nanoid';

// Logger: write to stderr with structured prefix — no console.log allowed.
function log(msg: string): void {
  process.stderr.write(`[deploy] ${msg}\n`);
}

// ---- Types ------------------------------------------------------------------

export interface HtmlPayload {
  html: string;
  css?: string;
  assets?: Record<string, string>;
}

export interface DeployResult {
  url: string;
  deployment_id: string;
}

// ---- Slug sanitization ------------------------------------------------------

/**
 * Sanitize a brand name into a Cloudflare Pages-compatible project slug.
 * Rules: lowercase a-z, 0-9, hyphens only. Must start with a-z or 0-9.
 * Max total project name is "studio-{slug}" <= 58 chars, so slug <= 51 chars.
 */
export function sanitizeSlug(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanum to hyphen
    .replace(/^-+|-+$/g, '')     // trim leading/trailing hyphens
    .slice(0, 51);               // "studio-" is 7 chars; 7+51=58

  if (!slug || !/^[a-z0-9]/.test(slug)) {
    // Prepend "s" to ensure valid start character if slug is empty or starts with hyphen
    return ('s' + slug).slice(0, 51);
  }
  return slug;
}

// ---- CF Pages API helpers ---------------------------------------------------

const CF_API = 'https://api.cloudflare.com/client/v4';

interface CfApiResponse {
  success: boolean;
  result?: unknown;
  errors?: unknown[];
}

async function cfFetch(
  path: string,
  token: string,
  init: RequestInit,
): Promise<unknown> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '(unreadable body)');
    throw new Error(`CF API ${path} returned ${res.status}: ${body}`);
  }

  const json = (await res.json()) as CfApiResponse;
  if (!json.success) {
    throw new Error(
      `CF API ${path} returned success=false: ${JSON.stringify(json.errors)}`,
    );
  }
  return json.result;
}

async function ensureProject(
  projectName: string,
  accountId: string,
  token: string,
): Promise<void> {
  // Check if project exists first to avoid spurious create errors.
  const checkRes = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (checkRes.status === 200) {
    log(`project "${projectName}" already exists`);
    return;
  }

  if (checkRes.status !== 404) {
    const body = await checkRes.text().catch(() => '');
    throw new Error(
      `Unexpected status checking project "${projectName}": ${checkRes.status} ${body}`,
    );
  }

  log(`creating project "${projectName}"`);
  await cfFetch(`/accounts/${accountId}/pages/projects`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      production_branch: 'main',
    }),
  });
}

interface DeploymentResult {
  id: string;
  url: string;
}

async function uploadDeployment(
  projectName: string,
  accountId: string,
  token: string,
  payload: HtmlPayload,
): Promise<DeployResult> {
  const enc = new TextEncoder();

  const files: Record<string, Uint8Array> = {
    'index.html': enc.encode(payload.html),
  };

  if (payload.css) {
    files['styles.css'] = enc.encode(payload.css);
  }

  if (payload.assets) {
    for (const [name, content] of Object.entries(payload.assets)) {
      files[name] = enc.encode(content);
    }
  }

  // Compute SHA-256 hashes for the manifest.
  const manifest: Record<string, { hash: string; size: number }> = {};
  for (const [name, bytes] of Object.entries(files)) {
    const view = bytes as unknown as BufferSource;
    const hashBuf = await crypto.subtle.digest('SHA-256', view);
    const hash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    manifest[`/${name}`] = { hash, size: bytes.length };
  }

  const form = new FormData();
  form.append('manifest', JSON.stringify(manifest));

  for (const [name, bytes] of Object.entries(files)) {
    const mime = name.endsWith('.css') ? 'text/css' : 'text/html';
    const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
    form.append(name, blob, name);
  }

  log(`uploading ${Object.keys(files).length} file(s) to "${projectName}"`);

  const result = (await cfFetch(
    `/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    token,
    { method: 'POST', body: form },
  )) as DeploymentResult;

  return {
    url: result.url,
    deployment_id: result.id,
  };
}

// ---- Public API -------------------------------------------------------------

/**
 * Deploy a landing page to Cloudflare Pages.
 *
 * When DEPLOY_ENABLED=1 AND CF_API_TOKEN AND CF_ACCOUNT_ID are set, performs a
 * real Direct Upload deployment and returns the production URL.
 *
 * When not enabled, returns a mock URL and logs that deploy is stubbed.
 *
 * On real-deploy error, throws -- does NOT silently fall back to a mock URL.
 */
export async function deployLandingPage({
  brandSlug,
  htmlPayload,
}: {
  brandSlug: string;
  htmlPayload: HtmlPayload;
}): Promise<DeployResult> {
  const deployEnabled = process.env['DEPLOY_ENABLED'] === '1';
  const token = process.env['CF_API_TOKEN'];
  const accountId = process.env['CF_ACCOUNT_ID'];

  if (!deployEnabled || !token || !accountId) {
    const mockDeploymentId = `mock_${nanoid()}`;
    const slug = sanitizeSlug(brandSlug);
    const url = `https://${slug}.studio.gdsks.dev`;
    log(
      'deploy stubbed -- set DEPLOY_ENABLED=1 with CF_API_TOKEN + CF_ACCOUNT_ID to ship',
    );
    return { url, deployment_id: mockDeploymentId };
  }

  const slug = sanitizeSlug(brandSlug);
  const projectName = `studio-${slug}`;

  log(
    `real deploy: project="${projectName}" account=${accountId.slice(0, 8)}...`,
  );

  await ensureProject(projectName, accountId, token);
  return uploadDeployment(projectName, accountId, token, htmlPayload);
}
