# Studio Design System

Mirrors Stitch asset `15972727176921104973` ("Studio — Mission Control"). The Stitch project holds the canonical visual; this package is the consumable runtime.

## Files

- `tokens.json` — single source of truth. Edit here.
- `src/css-vars.ts` — flattens tokens to `--group-key` CSS variables for the `<html>` element.
- `src/tailwind-preset.ts` — exposes tokens as Tailwind utilities through CSS vars (no hardcoded values in the preset).
- `src/index.ts` — typed `token(group, key)` accessor that **throws on missing keys**. No silent defaults.

## Rules

1. **No hardcoded visuals in components.** If you reach for a hex literal or pixel number, stop and add a token first.
2. **Update path:** edit `tokens.json` → save → Tailwind utility names stay stable, CSS vars rebind, page restyles. Stitch must be updated in lockstep when the change is structural (new color, new typography role).
3. **`token()` throws on miss.** That is intentional. Demo-day failures are *visible*, never silent.
4. **One mode (dark).** Light mode is out of scope for the demo. Don't add a `light` branch yet — keep the structure simple.

## How a component should look

```tsx
// good — utility classes resolve to CSS vars
<div className="bg-surface-raised text-text border border-border rounded-lg p-5">
  <h3 className="text-headline-md font-display">Designer</h3>
  <p className="text-mono-md font-mono text-text-muted">streaming…</p>
</div>

// bad — hardcoded
<div style={{ background: '#11141C', color: '#F2F4F8' }}>
```

## Status mapping (used by AgentCard)

```ts
import { tokens } from '@studio/design-system';

const map = tokens.status[agent.status];
// map.fg     -> color token key
// map.border -> color token key
// map.dot    -> 'outlined' | 'pulsing' | 'filled'
// map.glow?  -> color token key (only for 'running')
```

That mapping is the *only* place the queued/running/done/error → visual decision lives.
