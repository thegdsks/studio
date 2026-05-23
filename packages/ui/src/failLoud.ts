/**
 * Hard-boundary guards. No fallbacks — fail loudly so failures are visible.
 */

/**
 * Throws if `value` is null or undefined.
 * Use at component/function boundaries to surface missing required props.
 */
export function requireProp<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Missing required prop: ${name}`);
  }
  return value;
}

/**
 * Reads `process.env[name]`. Throws if the variable is missing or empty.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Exhaustive-switch guard. TypeScript narrows `value` to `never` so the
 * compiler tells you when you add a new union member but forget a case.
 */
export function assertNever(value: never, context: string): never {
  throw new Error(`Unhandled case in ${context}: ${JSON.stringify(value)}`);
}
