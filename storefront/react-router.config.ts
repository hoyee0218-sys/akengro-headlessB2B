import type {Config} from '@react-router/dev/config';
import {vercelPreset} from '@vercel/react-router/vite';

/**
 * React Router configuration for Hydrogen on Vercel.
 *
 * Note: vercelPreset enables serverBundles, which is incompatible with
 * `shopify hydrogen build`. Use `react-router build` instead (see package.json).
 */
export default {
  appDirectory: 'app',
  buildDirectory: 'dist',
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
