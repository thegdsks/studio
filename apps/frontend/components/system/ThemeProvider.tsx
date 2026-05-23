import { cssVarsString } from '@studio/design-system/css-vars';

/**
 * Injects token CSS variables onto <html> via a server-rendered style tag.
 * One source of truth — packages/design-system/tokens.json.
 */
export function ThemeStyle(): JSX.Element {
  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: cssVarsString(':root') }} />;
}
