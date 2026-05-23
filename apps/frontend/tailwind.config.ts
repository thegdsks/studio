import type { Config } from 'tailwindcss';
import { studioPreset } from '@studio/design-system/tailwind-preset';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [studioPreset as Config],
  plugins: [],
};

export default config;
