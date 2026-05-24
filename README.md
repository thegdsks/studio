# Studio

**One sentence in. A complete startup launch kit out. Ten specialist AI agents in parallel, five minutes flat.**

Built for the Google I/O Hackathon at Shack15 on 2026-05-23.

```
┌─────────────────────────────────────────────────────────┐
│  "calendar app for solo founders"                       │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
   Wave 1 (parallel)                    Wave 1
   Strategist · Namer · Analyst         (positioning, names, competitors)
        │
        ▼
   Wave 2 (parallel, on Wave 1)
   Copywriter · Designer · Legal        (hero copy, brand kit, terms)
        │
        ▼
   Wave 3 (parallel, on Waves 1+2)
   Developer · Marketer · Growth        (live deploy, launch posts, prospects)
        │
        ▼
   Director                             (executive briefing, voiceover, next actions)
```

## What you get in 5 minutes

| # | Agent | Output |
|---|---|---|
| 1 | Strategist | Positioning, ICP, JTBD, three risks, success metrics |
| 2 | Namer | 5 brand names with live domain availability and trademark risk |
| 3 | Analyst | Competitor teardown, market gap, TAM estimate, defensibility score |
| 4 | Copywriter | Hero, features, FAQ, value props, email subject lines |
| 5 | Designer | Logo, color palette, font pairing, hero mockup image |
| 6 | Legal | Terms, Privacy, cookies, risk checklist |
| 7 | Developer | Production HTML and an actual live deployed URL on Cloudflare Pages |
| 8 | Marketer | X thread, Product Hunt launch, Show HN, LinkedIn post |
| 9 | Growth | 10 named prospects with public profile links and tailored outreach drafts |
| 10 | Director | Executive briefing with headline metric, money quote, 60-second voiceover, talking points, next actions |

Every output is structured, downloadable, and reviewable. Each tile shows a quality score 0–100 and can be refined with one click or re-run with feedback. Low-scoring agents auto-improve once silently before completion.

## Quick start

```bash
pnpm install
pnpm dev
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:4000

For a public URL during demo:

```bash
cloudflared tunnel --url http://localhost:3000
```

### Demo mode (insurance)

If the live agents misbehave on stage, replay a recorded run instead:

```
http://localhost:3000/?demo=1
```

To record a fresh fixture:

```bash
DEMO_RECORD=1 pnpm dev
# trigger a real run, then promote the file
cp apps/backend/src/demo/fixtures/<run_id>.json \
   apps/backend/src/demo/fixtures/default.json
```

### Useful scripts

```bash
pnpm dev         # both servers in parallel
pnpm kill        # kill anything on :3000 and :4000
pnpm restart     # kill + restart
pnpm fresh       # kill + scrub .next + restart (clears Next.js cache)
pnpm typecheck   # workspace-wide tsc
pnpm build       # workspace-wide build
```

## Architecture

```
apps/
  backend/      Express + multiplexed SSE orchestrator
                ├── src/orchestrator.ts    3-wave DAG with auto-refine loop
                ├── src/runners.ts         one runner per agent
                ├── src/critique.ts        Gemini Flash quality scoring
                ├── src/agents/director/   structured briefing schema
                ├── src/demo/              record + replay for stage safety
                └── src/deploy/            Cloudflare Pages Direct Upload
  frontend/     Next.js 14 App Router
                ├── app/page.tsx           landing with mission-control bar
                ├── app/run/[id]/          live DAG canvas + director panel
                └── components/artifacts/  per-agent renderers (card + detail variants)
packages/
  shared/       FROZEN contract (Agent, AgentEvent, Run types)
  ui/           primitives (Button, Chip, StatusBadge, motion variants)
  design-system/ tokens.json — single source of truth for color, type, spacing
agents/
  _runtime/     Managed Agents wrapper for the Gemini interactions API
  <agent>/      one folder per specialist with prompt + run.ts
```

### Real-time wire format

Single SSE connection per run, fanned out by `agent_id`. Event types:

- `status` — queued, running, done, error
- `chunk` — streaming tokens for live ticker
- `result` — final structured artifact
- `meta` — quality_score, quality_critique, deploy_url, auto_refined, original_score, iteration
- `error` — agent-level failure, surfaces to the tile
- `__run/complete` — terminal event

The store buffers events so late-joining SSE clients receive a full replay on connect, then live updates from that point.

## Design system

Studio's aesthetic is **mission control for nine specialists**. Precise, calm, technical. Not a startup-template gradient mess.

- **Tokens are the source of truth.** All visual values live in [`packages/design-system/tokens.json`](./packages/design-system/tokens.json). Components consume them via Tailwind preset and CSS vars. No hex literals or pixel numbers in component files.
- **Default theme is black with cream accents.** Light mode is a toggle, not the default.
- **Lucide icons only.** No emoji in chrome (registry emojis remain content).
- **No em dashes** in any user-facing copy.
- **No fallbacks.** If a token, env var, or upstream value is missing, fail loud. Demo failures must be visible.
- **No `any`, no `@ts-nocheck`, no `console.log`** in committed code.
- **Max 250 lines per component file.** Split into hooks and subcomponents before crossing it.

See [`docs/`](./docs/) for the full design spec and architecture decisions.

## Environment variables

Copy `apps/backend/.env.example` to `apps/backend/.env` and set:

```bash
GEMINI_API_KEY=...              # required for real agent runs (tier 1 key works)
MOCK_ONLY=1                     # optional: use mock runners, no API calls
AUTO_REFINE_THRESHOLD=70        # optional: score below this triggers auto-refine
AUTO_REFINE_DISABLE=1           # optional: disable auto-refine entirely
DEMO_RECORD=1                   # optional: capture runs as replay fixtures
DEPLOY_ENABLED=1                # optional: real Cloudflare Pages deploys
CF_API_TOKEN=...                # required if DEPLOY_ENABLED=1
CF_ACCOUNT_ID=...               # required if DEPLOY_ENABLED=1
```

Without `GEMINI_API_KEY`, runners fall through to high-quality mocks so the full UI still works end-to-end.

## Tech stack

Node 20 · TypeScript strict · pnpm workspaces · Express + SSE · Next.js 14 App Router · Tailwind · framer-motion · Lucide icons · `@microsoft/fetch-event-source` · `@google/genai` (Managed Agents) · SQLite (in-memory + WAL persistence).

## Project rules

This is a hackathon submission, not a SaaS. No auth, no billing, no analytics this weekend. Scope creep loses the prize.

The full contributor guide lives in [`../CLAUDE.md`](../CLAUDE.md).
