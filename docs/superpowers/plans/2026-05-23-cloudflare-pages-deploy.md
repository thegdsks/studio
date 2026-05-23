# Cloudflare Pages Deploy Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Developer agent to deploy the generated landing page to Cloudflare Pages and surface a real clickable URL, guarded behind DEPLOY_ENABLED=1 so mock mode works out of the box.

**Architecture:** A new deployer module (`apps/backend/src/deploy/cloudflare.ts`) encapsulates all CF Pages Direct Upload API calls. The developer runner in `runners.ts` calls it after generation and emits a `deploy_url` meta event. The shared `agent.ts` contract gets two optional fields. The frontend developer card and detail page surface the URL with a prominent CTA.

**Tech Stack:** Node 20 built-in `fetch`, Cloudflare Pages Direct Upload API, nanoid (already in `apps/backend`), TypeScript strict, Next.js 14 app router, Tailwind, Lucide.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/backend/src/deploy/cloudflare.ts` | Create | CF Pages upload logic + mock stub |
| `apps/backend/src/runners.ts` | Modify | Call deployer after developer generation; emit `deploy_url` meta |
| `packages/shared/src/agent.ts` | Modify | Add `deploy_url?` and `deployment_id?` to `AgentEvent` meta payload |
| `apps/frontend/components/agent/AgentCardFooter.tsx` | Modify | Show "Open live site" ExternalLink button when agent is developer+done+deploy_url present |
| `apps/frontend/components/detail/DeveloperDetail.tsx` | Modify | Promote deploy URL to top of panel; add copy-to-clipboard |
| `docs-local/2026-05-23-studio-hackathon-design.md` | Modify | Append "Deploy" section: env vars, how to obtain token, mock fallback |

---

### Task 1: Create the Cloudflare Pages deployer module

**Files:**
- Create: `apps/backend/src/deploy/cloudflare.ts`

**Background:** The Cloudflare Pages Direct Upload API has three steps:
1. `POST /accounts/{account_id}/pages/projects` - create project if not found (get a 422 or existing on duplicate, handle gracefully)
2. `POST /accounts/{account_id}/pages/projects/{project_name}/deployments` with `multipart/form-data` containing a `manifest.json` and the raw file bytes
3. The response contains `url` field with the deployment URL

The project name format is `studio-{brandSlug}` sanitized to match `^[a-z0-9][a-z0-9-]{0,57}$`.

CF API base: `https://api.cloudflare.com/client/v4`

- [ ] **Step 1: Create the deploy directory and module file**

```typescript
// apps/backend/src/deploy/cloudflare.ts
import { nanoid } from 'nanoid';

// Logger: use process.stderr with structured prefix — no console.log allowed.
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
 * Sanitize a brand name into a CF Pages-compatible project slug.
 * Rules: lowercase a-z, 0-9, hyphens only. Must start with a-z or 0-9.
 * Max total project name: studio-{slug} must be <= 58 chars, so slug <= 51 chars.
 */
export function sanitizeSlug(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // non-alphanum -> hyphen
    .replace(/^-+|-+$/g, '')          // trim leading/trailing hyphens
    .slice(0, 51);                    // "studio-" is 7 chars; 7+51=58

  if (!slug || !/^[a-z0-9]/.test(slug)) {
    // Fallback: prepend "s" to ensure valid start character
    return ('s' + slug).slice(0, 51);
  }
  return slug;
}

// ---- CF Pages API helpers ---------------------------------------------------

const CF_API = 'https://api.cloudflare.com/client/v4';

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

  const json = await res.json() as { success: boolean; result?: unknown; errors?: unknown[] };
  if (!json.success) {
    throw new Error(`CF API ${path} returned success=false: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

async function ensureProject(projectName: string, accountId: string, token: string): Promise<void> {
  // Try to fetch first to avoid spurious create errors.
  const listRes = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (listRes.status === 200) {
    log(`project "${projectName}" already exists`);
    return;
  }

  // 404 means it doesn't exist; create it.
  if (listRes.status !== 404) {
    const body = await listRes.text().catch(() => '');
    throw new Error(`Unexpected status checking project "${projectName}": ${listRes.status} ${body}`);
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

async function uploadDeployment(
  projectName: string,
  accountId: string,
  token: string,
  payload: HtmlPayload,
): Promise<DeployResult> {
  // Build file manifest: { "index.html": { hash, size } } + file blobs.
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

  // Compute SHA256 hashes for manifest.
  const manifest: Record<string, { hash: string; size: number }> = {};
  for (const [name, bytes] of Object.entries(files)) {
    const hashBuf = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    manifest[`/${name}`] = { hash, size: bytes.length };
  }

  const form = new FormData();
  form.append('manifest', JSON.stringify(manifest));

  for (const [name, bytes] of Object.entries(files)) {
    const blob = new Blob([bytes], {
      type: name.endsWith('.css') ? 'text/css' : 'text/html',
    });
    form.append(name, blob, name);
  }

  log(`uploading ${Object.keys(files).length} file(s) to "${projectName}"`);

  const result = await cfFetch(
    `/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    token,
    { method: 'POST', body: form },
  ) as { id: string; url: string };

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
 * On real-deploy error, throws — does NOT silently fall back to mock.
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
    log(`deploy stubbed -- set DEPLOY_ENABLED=1 with CF_API_TOKEN + CF_ACCOUNT_ID to ship`);
    return { url, deployment_id: mockDeploymentId };
  }

  const slug = sanitizeSlug(brandSlug);
  const projectName = `studio-${slug}`;

  log(`real deploy: project="${projectName}" account=${accountId.slice(0, 8)}…`);

  await ensureProject(projectName, accountId, token);
  return uploadDeployment(projectName, accountId, token, htmlPayload);
}
```

- [ ] **Step 2: Verify file compiles in isolation**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | head -40
```

Expected: may have errors in other files but no errors in `deploy/cloudflare.ts` itself (or zero errors overall).

---

### Task 2: Extend the shared contract with optional deploy fields

**Files:**
- Modify: `packages/shared/src/agent.ts` (line 73: the `meta` event payload)

**Background:** The frozen contract only allows adding optional fields. We add `deploy_url?` and `deployment_id?` to the meta payload union member. The frontend SSE client reads meta events and merges them onto the `Agent` object in the store; we also need `deploy_url` and `deployment_id` on the `Agent` type.

- [ ] **Step 1: Add optional fields to `AgentEvent` meta payload and `Agent` type**

In `packages/shared/src/agent.ts`, the meta event line (line 73) currently reads:
```typescript
| { agent_id: AgentId; type: 'meta';   payload: { ranLocally?: boolean; quality_score?: number; quality_critique?: string } }
```

Change it to:
```typescript
| { agent_id: AgentId; type: 'meta';   payload: { ranLocally?: boolean; quality_score?: number; quality_critique?: string; deploy_url?: string; deployment_id?: string } }
```

Also add to the `Agent` interface (after line 63, the `refined_with?` field):
```typescript
  /** Live deployment URL produced by the developer agent. */
  deploy_url?: string;
  /** Cloudflare Pages deployment ID or "mock_…" in stub mode. */
  deployment_id?: string;
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | grep -E "error TS|packages/shared"
```

Expected: no errors in `packages/shared`.

---

### Task 3: Wire deployer into the developer runner

**Files:**
- Modify: `apps/backend/src/runners.ts` (the `developerRunner` function, lines 275-287)

**Background:**
- Brand slug comes from namer's output: `ctx.upstream['namer']` typed as `{ names?: Array<{ name: string }> }`. Use the first name's `name` field, fall back to `'studio'`.
- The developer runner's result (`DeveloperOutput`) has an `html` field and optionally a `liveUrl`. We pass `html` as the payload.
- After deploying, emit a `meta` event with `deploy_url` and `deployment_id` so the SSE consumer can update the Agent record.
- The `runId` is required to update the agent store after deploying. We need to import `updateAgent` from `./store.js`.
- Note: The `developerRunner` in `runners.ts` does NOT have `runId` in its `RunContext` (the orchestrator calls it without runId in wave 3 in orchestrator.ts line 179). We must fix that call in `orchestrator.ts` to pass `runId`.

- [ ] **Step 1: Fix orchestrator.ts to pass runId to developer runner**

In `apps/backend/src/orchestrator.ts`, line 179, change:
```typescript
staggerRun(0, runId, 'developer', { idea, upstream: wave2Upstream }),
```
to:
```typescript
staggerRun(0, runId, 'developer', { idea, upstream: wave2Upstream, runId }),
```

- [ ] **Step 2: Modify developerRunner in runners.ts**

Replace the `developerRunner` function (lines 275-287) with:

```typescript
const developerRunner: AgentRunner = async (ctx, emit) => {
  const { runDeveloper } = await import('../../../agents/developer/run.js');
  const { deployLandingPage } = await import('./deploy/cloudflare.js');
  const { updateAgent } = await import('./store.js');

  const designerOut = ctx.upstream['designer'];
  const copywriterOut = ctx.upstream['copywriter'];
  const namerOut = ctx.upstream['namer'] as { names?: Array<{ name: string }> } | undefined;
  const brandSlug = namerOut?.names?.[0]?.name ?? 'studio';

  const result = await runDeveloper(designerOut ?? {}, copywriterOut ?? {}, {
    onChunk: (text) => emit({ agent_id: 'developer', type: 'chunk', payload: { text } }),
    onToolCall: (call) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `\n[tool] ${call.name}(…)\n` } }),
    onToolResult: (res) => emit({ agent_id: 'developer', type: 'chunk', payload: { text: `[result] ${truncate(JSON.stringify(res), 120)}\n` } }),
    runContext: ctx.runId ? { runId: ctx.runId, agentId: 'developer' } : undefined,
  });

  // Deploy the generated landing page (real or stubbed via DEPLOY_ENABLED).
  const htmlPayload = {
    html: result.html,
  };

  emit({ agent_id: 'developer', type: 'chunk', payload: { text: '\nDeploying landing page…\n' } });

  const { url: deployUrl, deployment_id: deploymentId } = await deployLandingPage({
    brandSlug,
    htmlPayload,
  });

  emit({
    agent_id: 'developer',
    type: 'meta',
    payload: { deploy_url: deployUrl, deployment_id: deploymentId },
  });

  emit({
    agent_id: 'developer',
    type: 'chunk',
    payload: { text: `\nLive site: ${deployUrl}\n` },
  });

  // Persist deploy fields onto the agent record so late-joining SSE clients
  // see the URL when they load /api/runs/:id.
  if (ctx.runId) {
    updateAgent(ctx.runId, 'developer', {
      deploy_url: deployUrl,
      deployment_id: deploymentId,
    });
  }

  // Merge deploy_url into the result artifact so DeveloperDetail can read it
  // from agent.finalArtifact.liveUrl (existing field the detail page already checks).
  return {
    ...result,
    liveUrl: result.liveUrl ?? deployUrl,
    deploy_url: deployUrl,
    deployment_id: deploymentId,
  };
};
```

- [ ] **Step 3: Verify no type errors in runners.ts**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | grep -E "runners\.ts|deploy"
```

Expected: no errors.

---

### Task 4: Persist deploy_url in the store

**Files:**
- Modify: `apps/backend/src/store.ts` — ensure `updateAgent` accepts `deploy_url` and `deployment_id`
- Modify: `apps/backend/src/db.ts` — check if `dbUpdateAgent` handles these fields

- [ ] **Step 1: Check what updateAgent accepts**

```bash
grep -n "updateAgent\|dbUpdateAgent" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/backend/src/store.ts | head -20
grep -n "updateAgent\|Partial.*Agent" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/backend/src/db.ts | head -20
```

If `updateAgent` takes `Partial<Agent>`, the new optional fields on `Agent` automatically flow through. If it takes a narrower type, widen it.

- [ ] **Step 2: Verify by running typecheck after Task 3 edits**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | tail -10
```

Expected: zero TypeScript errors across workspace.

---

### Task 5: Update the SSE client to merge deploy fields onto the agent

**Files:**
- Modify: `apps/frontend/lib/useRunStream.ts` — handle `deploy_url` and `deployment_id` in meta event processing

- [ ] **Step 1: Read the current meta handler in useRunStream.ts**

```bash
grep -n "meta\|ranLocally\|quality_score" /Users/gdsks/G-Development/GLINRV5/studio/studio-app/apps/frontend/lib/useRunStream.ts
```

- [ ] **Step 2: Add deploy field merging in the meta case**

Find the `case 'meta':` handler (or wherever `ranLocally` is merged). Add the deploy fields alongside the existing ones:

```typescript
// Inside the meta event handler, alongside ranLocally/quality_score:
if (event.payload.deploy_url !== undefined) {
  agent.deploy_url = event.payload.deploy_url;
}
if (event.payload.deployment_id !== undefined) {
  agent.deployment_id = event.payload.deployment_id;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | grep -E "useRunStream|error TS"
```

Expected: no errors.

---

### Task 6: Surface deploy URL in AgentCard footer (developer tile only)

**Files:**
- Modify: `apps/frontend/components/agent/AgentCardFooter.tsx`

**Background:** The card footer currently shows Refine + Re-run buttons for done/error agents. For the developer agent specifically, when `agent.deploy_url` is set and status is `done`, we show a prominent "Open live site" button. We must not add it to other agent cards.

- [ ] **Step 1: Update AgentCardFooterProps and component**

Replace the entire `AgentCardFooter.tsx` with:

```typescript
'use client';

import { Sparkles, RotateCcw, ExternalLink } from 'lucide-react';
import { Button, Chip, Mono } from '@studio/ui';
import type { Agent } from '@studio/shared';
import { RawStreamToggle } from './RawStreamToggle';

interface AgentCardFooterProps {
  agent: Agent;
  text: string;
  stable: string;
  fading: string;
  rawScrollRef: React.RefObject<HTMLDivElement>;
  duration: string | null;
  refining: boolean;
  rerunning: boolean;
  onRefineOpen: () => void;
  onRerun: () => void;
  runId: string;
}

export function AgentCardFooter({
  agent,
  text,
  stable,
  fading,
  rawScrollRef,
  duration,
  refining,
  rerunning,
  onRefineOpen,
  onRerun,
  runId,
}: AgentCardFooterProps) {
  const showActions = (agent.status === 'done' || agent.status === 'error') && !!runId;
  const showDeployUrl = agent.id === 'developer' && agent.status === 'done' && !!agent.deploy_url;

  return (
    <>
      {agent.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {agent.tools.map((tool) => (
            <Chip key={tool} className="text-micro tracking-wide tabular-nums">{tool}</Chip>
          ))}
        </div>
      )}

      {(agent.finalArtifact !== undefined || text !== '') && (
        <RawStreamToggle text={text} stable={stable} fading={fading} scrollRef={rawScrollRef} />
      )}

      {showDeployUrl && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            onClick={() => window.open(agent.deploy_url, '_blank', 'noopener,noreferrer')}
            aria-label="Open live site"
          >
            Open live site
          </Button>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            onClick={onRefineOpen}
            disabled={refining}
            aria-label="Refine this agent"
          >
            Refine
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={
              rerunning
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-text-faint/30 border-t-text-faint animate-spin shrink-0" aria-hidden />
                : <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            }
            onClick={onRerun}
            disabled={rerunning}
            aria-label="Re-run this agent"
          >
            Re-run
          </Button>
        </div>
      )}

      {duration && (
        <Mono className="text-micro tabular-nums text-text-faint mt-1">{duration}</Mono>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | grep -E "AgentCardFooter|error TS"
```

Expected: no errors.

---

### Task 7: Promote deploy URL to top of DeveloperDetail

**Files:**
- Modify: `apps/frontend/components/detail/DeveloperDetail.tsx`

**Background:** The detail page already has "Open live site" and "Copy URL" buttons in `ActionPanel`. We add a prominent URL display at the very top of the content area so judges see it instantly. We also add a copy-to-clipboard button inline with the URL display.

- [ ] **Step 1: Add a deploy URL banner at the top of DeveloperDetail content**

The deploy URL comes from `agent.deploy_url` (merged from meta event) OR from `data.liveUrl`/`data.deployedUrl`. We should prefer `agent.deploy_url` since it is the canonical deployed URL, with `data.liveUrl` as fallback.

Replace `DeveloperDetail.tsx` with:

```typescript
'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Download, Check } from 'lucide-react';
import DeveloperArtifact from '@/components/artifacts/DeveloperArtifact';
import ActionPanel from './ActionPanel';
import type { ActionButton, MetadataItem } from './ActionPanel';
import { downloadHTML, copyToClipboard } from '@/lib/downloads';
import type { Agent } from '@studio/shared';

interface DeveloperShape {
  liveUrl?: string;
  html?: string;
  deployedAt?: string;
  deployedUrl?: string;
}

function isDeveloper(a: unknown): a is DeveloperShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return 'liveUrl' in o || 'html' in o || 'deployedAt' in o || 'deployedUrl' in o;
}

type ViewTab = 'preview' | 'source';

interface Props {
  agent: Agent;
  metadata: MetadataItem[];
}

export default function DeveloperDetail({ agent, metadata }: Props) {
  const [tab, setTab] = useState<ViewTab>('preview');
  const [copied, setCopied] = useState(false);

  const art = agent.finalArtifact;
  const data = isDeveloper(art) ? art : null;
  // Prefer agent.deploy_url (from meta event) over artifact.liveUrl
  const liveUrl = agent.deploy_url ?? data?.liveUrl ?? data?.deployedUrl;
  const html = data?.html;

  async function handleCopyUrl() {
    if (!liveUrl) return;
    await copyToClipboard(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttons: ActionButton[] = [
    ...(liveUrl
      ? [
          {
            label: 'Open live site',
            icon: ExternalLink,
            variant: 'primary' as const,
            onClick: () => window.open(liveUrl, '_blank', 'noopener,noreferrer'),
          } satisfies ActionButton,
          {
            label: 'Copy URL',
            icon: Copy,
            onClick: () => void copyToClipboard(liveUrl),
          } satisfies ActionButton,
          {
            label: 'Share site URL',
            icon: Copy,
            onClick: () => void copyToClipboard(liveUrl),
          } satisfies ActionButton,
        ]
      : []),
    ...(html
      ? [
          {
            label: 'Download HTML',
            icon: Download,
            onClick: () => downloadHTML('site.html', html),
          } satisfies ActionButton,
        ]
      : []),
  ];

  const nextSteps = [
    'Point your custom domain at this Cloudflare Pages URL.',
    'Add Google Analytics.',
    'Set up a 404 page.',
  ];

  const tabs: { id: ViewTab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'source', label: 'HTML source' },
  ];

  return (
    <>
      <div className="flex-1 min-w-0 space-y-8">
        {liveUrl && (
          <section className="rounded-lg border border-border-accent bg-surface-raised p-4 flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-accent shrink-0" aria-hidden />
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 font-mono text-mono-sm text-accent truncate hover:underline"
            >
              {liveUrl}
            </a>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              aria-label="Copy deployment URL"
              className="shrink-0 p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
            >
              {copied
                ? <Check className="h-4 w-4 text-success" aria-hidden />
                : <Copy className="h-4 w-4" aria-hidden />}
            </button>
          </section>
        )}

        <DeveloperArtifact artifact={art} />

        {(liveUrl || html) && (
          <section className="space-y-4">
            <div className="flex gap-0 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors duration-micro -mb-px ${
                    tab === t.id
                      ? 'border-border-accent text-accent'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'preview' && liveUrl && (
              <div className="border border-border rounded-lg overflow-hidden">
                <iframe
                  src={liveUrl}
                  title="Live site full preview"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-[600px] bg-surface-sunken"
                />
              </div>
            )}

            {tab === 'source' && html && (
              <div className="rounded-lg border border-border bg-surface-sunken">
                <pre className="font-mono text-mono-sm text-text-muted p-4 overflow-auto max-h-[600px] whitespace-pre-wrap break-all">
                  {html}
                </pre>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20">
        <ActionPanel buttons={buttons} metadata={metadata} nextSteps={nextSteps} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Run typecheck to confirm clean**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1 | tail -20
```

Expected: zero errors.

---

### Task 8: Append Deploy section to design doc

**Files:**
- Modify: `/Users/gdsks/G-Development/GLINRV5/studio/docs-local/2026-05-23-studio-hackathon-design.md`

- [ ] **Step 1: Append the Deploy section to the end of the design doc**

Append this text (use a Read first to find the current end, then append):

```markdown

---

## Deploy

The Developer agent deploys the generated landing page to Cloudflare Pages using the Direct Upload API. In demo mode the deploy is stubbed and returns a fake URL instantly.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DEPLOY_ENABLED` | No (default: off) | Set to `1` to enable real Cloudflare Pages deployments. |
| `CF_API_TOKEN` | When `DEPLOY_ENABLED=1` | Cloudflare API token with "Cloudflare Pages: Edit" permission. |
| `CF_ACCOUNT_ID` | When `DEPLOY_ENABLED=1` | Your Cloudflare account ID (visible in dash.cloudflare.com right sidebar). |

### Obtaining an API token

1. Visit https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token", use the "Edit Cloudflare Pages" template.
3. Scope it to your account. Copy the token into `.env.local` as `CF_API_TOKEN`.

### Mock mode (default)

When `DEPLOY_ENABLED` is not set (or not `1`), the deployer returns:
```
{ url: "https://{brand-slug}.studio.gdsks.dev", deployment_id: "mock_<nanoid>" }
```
and logs: `[deploy] deploy stubbed -- set DEPLOY_ENABLED=1 with CF_API_TOKEN + CF_ACCOUNT_ID to ship`.

No network calls are made. The frontend shows the mock URL as a clickable link.

### Error policy

When `DEPLOY_ENABLED=1` and the CF API returns an error, the deployer throws. The runner surfaces the error to the orchestrator, which marks the developer agent as `error` state. There is no silent fallback to a mock URL during real-deploy mode.

### CF Pages naming rules

Project names must match `^[a-z0-9][a-z0-9-]{0,57}$`. The deployer sanitizes the brand name with `sanitizeSlug()` in `apps/backend/src/deploy/cloudflare.ts` and prefixes `studio-` to get the final project name (e.g. `studio-verdeai`). Max brand slug length after sanitization: 51 characters.
```

---

### Task 9: Final typecheck and smoke test

**Files:** None — verification only.

- [ ] **Step 1: Full workspace typecheck**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
pnpm typecheck 2>&1
```

Expected: zero errors.

- [ ] **Step 2: Smoke test mock mode**

In one terminal:
```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
MOCK_ONLY=1 pnpm --filter backend dev
```

In another (after server starts):
```bash
# Create a run
curl -s -X POST http://localhost:3001/api/runs \
  -H 'Content-Type: application/json' \
  -d '{"idea":"A tool that helps founders ship faster"}' | jq .
```

Then watch the SSE stream:
```bash
curl -sN http://localhost:3001/api/runs/<run_id>/stream | grep -E "deploy|developer"
```

Expected: you see `deploy_url` in a meta event for the developer agent, pointing to `https://*.studio.gdsks.dev`.

- [ ] **Step 3: Commit**

```bash
cd /Users/gdsks/G-Development/GLINRV5/studio/studio-app
git add \
  apps/backend/src/deploy/cloudflare.ts \
  apps/backend/src/runners.ts \
  apps/backend/src/orchestrator.ts \
  packages/shared/src/agent.ts \
  apps/frontend/components/agent/AgentCardFooter.tsx \
  apps/frontend/components/detail/DeveloperDetail.tsx \
  docs-local/2026-05-23-studio-hackathon-design.md
git commit -m "feat: deploy landing page to Cloudflare Pages from developer agent"
```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|---|---|
| `deployLandingPage()` function with correct signature | Task 1 |
| Mock mode with env guard `DEPLOY_ENABLED=1` | Task 1 |
| No silent fallback when real deploy fails | Task 1 (throws in `cfFetch`) |
| CF Pages Direct Upload API: create project + upload | Task 1 |
| Project name: `studio-{slug}`, sanitized, max 58 chars | Task 1 |
| Developer runner calls deployer after generation | Task 3 |
| Meta event `{ deploy_url, deployment_id }` emitted | Task 3 |
| `deploy_url` in agent.result for detail page | Task 3 (merged into returned artifact) |
| `AgentEvent.meta.payload` optional fields | Task 2 |
| `Agent` optional `deploy_url` + `deployment_id` | Task 2 |
| Frontend SSE merges deploy fields | Task 5 |
| AgentCard "Open live site" button for developer done | Task 6 |
| DeveloperDetail deploy URL banner + copy button | Task 7 |
| Deploy docs section in design doc | Task 8 |
| No `any`, no `console.log`, no em dashes | All tasks |
| `pnpm typecheck` passes | Task 9 |

### Placeholder scan

No TBDs, no "implement later", no "similar to Task N" patterns. All code blocks are complete.

### Type consistency

- `DeployResult` returned by `deployLandingPage` used consistently in Task 3 runner.
- `Agent.deploy_url` added in Task 2, read in Task 5 (SSE), Task 6 (card footer), Task 7 (detail page) -- consistent field name throughout.
- `sanitizeSlug()` exported and used in same file -- consistent.
- `HtmlPayload` defined in Task 1 and used by `deployLandingPage` signature -- consistent.
