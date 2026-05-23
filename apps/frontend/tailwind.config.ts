import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulse_scale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        border_flash: {
          '0%': { borderColor: 'rgb(34 197 94)' },
          '100%': { borderColor: 'rgb(var(--color-border))' },
        },
      },
      animation: {
        pulse_scale: 'pulse_scale 1.5s ease-in-out infinite',
        border_flash: 'border_flash 1s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
