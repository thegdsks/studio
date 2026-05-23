import tokensJson from '../tokens.json' assert { type: 'json' };

export const tokens = tokensJson;

export type Tokens = typeof tokensJson;
export type ColorToken = keyof Tokens['color'];
export type StatusKey = keyof Tokens['status'];
export type TypographyToken = keyof Tokens['typography'];
export type SpaceToken = keyof Tokens['space'];
export type RadiusToken = keyof Tokens['radius'];
export type ShadowToken = keyof Tokens['shadow'];
export type MotionToken = keyof Tokens['motion'];

/**
 * Strict token lookup. Throws if the key is absent — by design, no fallbacks.
 * Demo-day rule: a missing token is a bug, not a soft failure.
 */
export function token<G extends keyof Tokens, K extends keyof Tokens[G]>(
  group: G,
  key: K,
): Tokens[G][K] {
  const groupObj = tokens[group] as Record<string, unknown> | undefined;
  if (!groupObj) {
    throw new Error(`[design-system] unknown token group: ${String(group)}`);
  }
  if (!(key as string in groupObj)) {
    throw new Error(
      `[design-system] unknown token: ${String(group)}.${String(key)}`,
    );
  }
  return groupObj[key as string] as Tokens[G][K];
}

export { cssVars, cssVarStyle } from './css-vars.js';
export { studioPreset } from './tailwind-preset.js';
