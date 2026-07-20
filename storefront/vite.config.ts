import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';

export default defineConfig(({command, isSsrBuild}) => ({
  plugins: [
    hydrogen(),
    // Oxygen is for local `shopify hydrogen dev` only. Vercel/production builds
    // use vercelPreset + react-router build and must not include this plugin.
    command === 'serve' ? oxygen() : null,
    reactRouter(),
  ].filter(Boolean),
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
    // Custom Vercel server entry so we can inject Hydrogen getLoadContext.
    // @see https://vercel.com/docs/frameworks/frontend/react-router#using-a-custom-server-entrypoint
    rollupOptions: isSsrBuild
      ? {
          input: './server/app.ts',
        }
      : undefined,
  },
  ssr: {
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * For example, for the following error:
       *
       * > ReferenceError: module is not defined
       * >   at /Users/.../node_modules/example-dep/index.js:1:1
       *
       * Include 'example-dep' in the array below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: [
        'react-router > set-cookie-parser',
        'react-router > cookie',
        'react-router',
      ],
    },
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev', '.ngrok-free.app'],
  },
}));
