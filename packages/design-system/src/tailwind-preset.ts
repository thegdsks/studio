import type { Config } from 'tailwindcss';
import tokensJson from '../tokens.json' assert { type: 'json' };

type AnyRecord = Record<string, string>;

/**
 * Build Tailwind theme from tokens.json, using CSS variables so a single source
 * of truth flows: tokens.json -> css-vars -> tailwind utility classes.
 *
 * Every value here is `var(--<group>-<key>)`. Edits live in tokens.json only.
 */
function asVarMap<T extends Record<string, unknown>>(group: string, obj: T): AnyRecord {
  const out: AnyRecord = {};
  for (const key of Object.keys(obj)) {
    out[key] = `var(--${group}-${key})`;
  }
  return out;
}

const t = tokensJson;

export const studioPreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: asVarMap('color', t.color),
      borderRadius: asVarMap('radius', t.radius),
      spacing: asVarMap('space', t.space),
      maxWidth: {
        prose: 'var(--size-max-w-prose)',
        page:  'var(--size-max-w-page)',
      },
      height: {
        'agent-card': 'var(--size-agent-card-h)',
        'row-sm':     'var(--size-row-sm)',
        'row-md':     'var(--size-row-md)',
      },
      fontFamily: {
        display: t.font.display.split(',').map((s) => s.trim()),
        sans:    t.font.body.split(',').map((s) => s.trim()),
        mono:    t.font.mono.split(',').map((s) => s.trim()),
      },
      fontSize: Object.fromEntries(
        Object.entries(t.typography).map(([key, v]) => {
          const cfg: Record<string, string> = {
            lineHeight: v.lineHeight,
          };
          if ('letterSpacing' in v && v.letterSpacing) cfg.letterSpacing = v.letterSpacing as string;
          cfg.fontWeight = v.weight;
          return [key, [v.size, cfg] as const];
        }),
      ),
      boxShadow: asVarMap('shadow', t.shadow),
      backgroundImage: asVarMap('gradient', t.gradient),
      backdropBlur: {
        glass: 'var(--blur-glass)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--motion-ease)',
        ease:    'var(--motion-ease)',
        'ease-in': 'var(--motion-ease-in)',
      },
      transitionDuration: {
        micro: 'var(--motion-duration-micro)',
        state: 'var(--motion-duration-state)',
        entry: 'var(--motion-duration-entry)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.55', transform: 'scale(0.85)' },
        },
        'border-flash-done': {
          '0%':   { borderColor: 'var(--color-success)' },
          '100%': { borderColor: 'var(--color-border)' },
        },
        'bloom-in': {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          '60%':  { opacity: '1', transform: 'translateY(-2px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'pulse-dot':        'pulse-dot 1.4s var(--motion-ease) infinite',
        'border-flash-done':'border-flash-done 600ms var(--motion-ease) forwards',
        'bloom-in':         'bloom-in 600ms var(--motion-ease) forwards',
      },
    },
  },
};
