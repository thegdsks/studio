import tokensJson from '../tokens.json' assert { type: 'json' };

/** Token groups that have flat string/number leaves and should be emitted as CSS vars. */
type EmittableTokens = {
  color: typeof tokensJson.color;
  radius: typeof tokensJson.radius;
  space: typeof tokensJson.space;
  motion: typeof tokensJson.motion;
  shadow: typeof tokensJson.shadow;
  blur: typeof tokensJson.blur;
  size: typeof tokensJson.size;
};

function flatten(obj: object, prefix: string, acc: Record<string, string>): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}-${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v as object, key, acc);
    } else {
      acc[`--${key}`] = String(v);
    }
  }
}

/**
 * Emits CSS-variable map for the token groups we surface to the runtime:
 * color, radius, space, motion, shadow, blur, size.
 * Excludes structural groups (status, typography) — those compose other tokens.
 */
export function cssVars(): Record<string, string> {
  const acc: Record<string, string> = {};
  const tokens = tokensJson as unknown as EmittableTokens;
  const emitGroups = ['color', 'radius', 'space', 'motion', 'shadow', 'blur', 'size'] as const;
  for (const group of emitGroups) {
    const obj = tokens[group];
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
