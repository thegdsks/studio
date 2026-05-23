import tokensJson from '../tokens.json' assert { type: 'json' };

type Group = Record<string, string | number | object>;

function flatten(obj: object, prefix: string, acc: Record<string, string>): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v as object, key, acc);
    } else {
      acc[`--${key}`] = String(v);
    }
  }
}

/**
 * Emits CSS-variable map for the token groups we surface to the runtime:
 * color, radius, space, motion, shadow, blur, gradient, size.
 * Excludes structural groups (status, typography) — those compose other tokens.
 */
export function cssVars(): Record<string, string> {
  const acc: Record<string, string> = {};
  const emitGroups: string[] = [
    'color',
    'radius',
    'space',
    'motion',
    'shadow',
    'size',
  ];
  for (const group of emitGroups) {
    const obj = (tokensJson as any)[group];
    if (obj && typeof obj === 'object') {
      flatten(obj as object, group, acc);
    }
  }
  return acc;
}

/** Inline style helper for the <html> element. */
export function cssVarStyle(): React.CSSProperties {
  return cssVars() as unknown as React.CSSProperties;
}

/** Pre-rendered :root CSS string, for global stylesheet injection. */
export function cssVarsString(selector = ':root'): string {
  const vars = cssVars();
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}
