# Studio

One sentence in. Nine specialist AI agents in parallel. A complete startup launch kit out — in 5 minutes.

Built for the Google I/O Hackathon @ Shack15, 2026-05-23.

## Quick start

```bash
pnpm install
pnpm dev
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:4000

## Public URL for demo

```bash
cloudflared tunnel --url http://localhost:3000
```

## Workspace layout

```
apps/
  backend/      # Express + multiplexed SSE orchestrator
  frontend/     # Next.js 14 dashboard
packages/
  shared/       # FROZEN contract (Agent, AgentEvent, Run types)
```

## Handoff rules

1. **`packages/shared/src/*` is the frozen contract.** Do not change without coordinating with every parallel session.
2. **`apps/backend/src/agents/*.ts`** — one file per agent. Currently a mock fan-out; swap in real Managed Agent calls per file.
3. **`apps/frontend/components/AgentCard.tsx`** — Stitch-swappable internals. Props, parent state, and SSE wiring are stable.

## The 9 agents

| # | Agent | Owns |
|---|---|---|
| 1 | Strategist | Positioning, ICP, JTBD |
| 2 | Namer | 5 names + live domain checks |
| 3 | Designer | Logo + UI mockup |
| 4 | Copywriter | Hero, features, FAQ |
| 5 | Developer | HTML + live deploy |
| 6 | Marketer | X / PH / HN launch posts |
| 7 | Growth | 10 prospects (public-record only) |
| 8 | Legal | Terms + Privacy drafts |
| 9 | Analyst | Competitor teardown |

## Stack

Node 20 · TypeScript · pnpm workspaces · Express · Next.js 14 · Tailwind · shadcn/ui · framer-motion · Phosphor icons · Server-Sent Events.
