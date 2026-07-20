import { vercelPreset } from '@vercel/react-router/vite';
import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: 'app',
  buildDirectory: 'dist',
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;