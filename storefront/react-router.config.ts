import type {Config} from '@react-router/dev/config';
import {vercelPreset} from '@vercel/react-router/vite';

/**
 * React Router configuration for Hydrogen on Vercel.
 */

export default {
  appDirectory: 'app',
  buildDirectory: 'dist',
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
