import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const preview = env.DEV_WEB_URL ? new URL(env.DEV_WEB_URL) : null;
  return {
    plugins: [react(), tailwindcss()],
    build: { manifest: true },
    resolve: { alias: { '@': fileURLToPath(new URL('./web', import.meta.url)) } },
    server: {
      port: 5180,
      strictPort: true,
      allowedHosts: preview ? [preview.hostname, 'web'] : undefined,
      hmr: preview ? { protocol: 'wss', host: preview.hostname, clientPort: 443 } : undefined,
      proxy: {
        '/convex-api': {
          target: env.VITE_CONVEX_URL || 'http://127.0.0.1:3210',
          ws: true,
          rewrite: p => p.replace(/^\/convex-api/, ''),
        },
        '/api/auth': {
          target: env.VITE_CONVEX_SITE_URL || 'http://127.0.0.1:3211',
          changeOrigin: true,
        },
      },
    },
  };
});
